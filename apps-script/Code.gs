/**
 * Cukrarstvi_Objednavky_Pohoda – příjem webhooků z Netlify Forms (přes netlify/functions/pohoda-webhook.mjs).
 *
 * Zpracovává všechny formuláře webu jednotně:
 *   objednavka        – košík (dorty, zákusky, zápichy, studená kuchyně) → XML pro Pohodu + e-mail
 *   tisk-na-papir     – jedlý tisk (fondánový list)                      → e-mail
 *   dort-na-prani-v2  – dort na přání (poptávka)                         → e-mail
 *   b2b-poptavka      – poptávka pro firmy                               → e-mail
 *   jiný formulář     – obecný e-mail se všemi poli (nic se neztratí)
 *
 * Jednotná pole formulářů: Jmeno, Email, Telefon, Prodejna, Datum, Poznamka (+ Firma, ICO, Lokalita u B2B,
 * Typ-Pozadavku, položky / cena / odkazy). Skript zná i starší názvy (Datum_Vyzvednuti, Zprava, firma, …).
 *
 * Odpověď je vždy JSON { ok: true|false, ... } – to vyhodnocuje pohoda-webhook.mjs.
 */

const CONFIG = {
  NOTIFY_EMAIL: 'objednavky@cukrarstviblahutovi.cz',
  XML_FOLDER_ID: 'DOPLNIT_ID_SLOZKY',
  ICO: '76208371',
  RATE_VAT: 'low',
  SENDER_NAME: 'Web – Cukrářství Blahutovi',
};

/** Typy formulářů (klíč = form_name z Netlify). */
const FORM_TYPES = {
  'objednavka': { key: 'objednavka', label: 'Objednávka z košíku', accent: '#b45309', xml: true },
  'tisk-na-papir': { key: 'tisk', label: 'Jedlý tisk – fondánový list', accent: '#2563eb', xml: false },
  'dort-na-prani-v2': { key: 'dort-na-prani', label: 'Dort na přání – poptávka', accent: '#db2777', xml: false },
  'b2b-poptavka': { key: 'b2b', label: 'Poptávka pro firmy', accent: '#059669', xml: false },
};
const GENERIC_TYPE = { key: 'jine', label: 'Formulář z webu', accent: '#475569', xml: false };

const CATEGORY_LABELS = {
  'dorty': 'Dorty',
  'zakusky': 'Zákusky',
  'zapichy': 'Zápichy',
  'studena-kuchyne': 'Studená kuchyně',
  'ostatni': 'Ostatní',
};

/** Starší hodnoty pole Prodejna (dort na přání) → dnešní názvy. */
const STORE_ALIASES = {
  ostrava: 'Ostrava (Zábřeh)',
  karvina: 'Karviná',
  petrvald: 'Petřvald',
  pist: 'Píšť',
};

/** Pole, která se v e-mailu ukazují až dole v „Technické údaje“. */
const TECH_KEYS = [
  'ip', 'user_agent', 'referrer', 'created_at', 'Souhlas-VOP-GDPR', 'form-name', 'form_name',
  'bot-field', 'id', 'number', 'site_url', 'form_id', 'human_fields', 'ordered_human_fields',
];

// ---------------------------------------------------------------------------------------------
// Vstupní body
// ---------------------------------------------------------------------------------------------

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ ok: true, service: 'Cukrarstvi_Objednavky_Pohoda' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    const expectedToken = PropertiesService.getScriptProperties().getProperty('WEBHOOK_TOKEN');
    if (expectedToken && (e.parameter || {}).token !== expectedToken) {
      return json_({ ok: false, error: 'unauthorized' });
    }

    const parsed = parsePayload_(e);
    if (parsed.test) {
      return json_({ ok: true, test: true, note: 'nic nezapsáno ani neodesláno' });
    }

    const req = normalizeRequest_(parsed);
    const result = req.type.xml ? handleOrder_(req) : handleRequest_(req, parsed);

    return json_(Object.assign({
      ok: true,
      handledForm: req.formName || '(neznámý)',
      type: req.type.key,
      submissionId: req.submissionId || undefined,
    }, result));
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------------------------------------
// Zpracování
// ---------------------------------------------------------------------------------------------

/** Košík: XML pro Pohodu na Disk + e-mail. Idempotentní podle čísla objednávky (existující XML). */
function handleOrder_(req) {
  if (!req.orderId) {
    throw new Error('Chybí Cislo-Objednavky');
  }

  const folder = DriveApp.getFolderById(CONFIG.XML_FOLDER_ID);
  const fileName = req.orderId + '.xml';

  if (folder.getFilesByName(fileName).hasNext()) {
    return { duplicate: true, orderId: req.orderId };
  }

  const xml = buildPohodaXml_(req);
  const file = folder.createFile(fileName, xml, 'text/xml');

  try {
    sendRequestEmail_(req, { xml: xml, fileName: fileName });
  } catch (mailErr) {
    // bez e-mailu by se při opakování objednávka jevila jako duplicita → XML raději zrušíme
    file.setTrashed(true);
    throw mailErr;
  }

  return { orderId: req.orderId };
}

/** Ostatní formuláře: přehledný e-mail. Idempotence přes ID odeslání (nebo otisk těla). */
function handleRequest_(req, parsed) {
  const cache = CacheService.getScriptCache();
  const key = req.submissionId
    ? 'sub:' + req.submissionId
    : 'raw:' + digest_(parsed.raw || JSON.stringify(parsed.data));

  if (cache.get(key)) {
    return { duplicate: true, orderId: req.orderId || undefined };
  }

  sendRequestEmail_(req, null);
  cache.put(key, '1', 21600); // 6 h = maximum CacheService

  return { orderId: req.orderId || undefined };
}

function digest_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text), Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); })
    .join('');
}

// ---------------------------------------------------------------------------------------------
// Čtení a normalizace dat
// ---------------------------------------------------------------------------------------------

function parsePayload_(e) {
  const type = ((e && e.postData && e.postData.type) || '').toLowerCase();
  const raw = (e && e.postData && e.postData.contents) || '';
  let src;

  if (type.indexOf('application/json') === 0 || /^\s*[{\[]/.test(raw)) {
    src = JSON.parse(raw);
  } else {
    src = (e && e.parameter) || {};
  }

  if (src.test === true || src.test === 'true') {
    return { test: true };
  }

  // Netlify webhook: pole formuláře jsou v src.data, metadata (ip, user_agent, …) i v src
  const data = src.data && typeof src.data === 'object' ? src.data : src;
  const formName = String(src.form_name || data['form-name'] || '');

  return {
    raw: raw,
    src: src,
    data: data,
    formName: formName,
    submissionId: String(src.id || src.number || ''),
  };
}

function pick_(d, names, used) {
  for (let i = 0; i < names.length; i++) {
    used[names[i]] = true;
  }
  for (let j = 0; j < names.length; j++) {
    const v = d[names[j]];
    if (v !== undefined && v !== null) {
      const s = (Array.isArray(v) ? v.join(', ') : String(v)).trim();
      if (s) return s;
    }
  }
  return '';
}

function parseMoney_(val) {
  const cleaned = String(val == null ? 0 : val)
    .replace(/\s/g, '')
    .replace(/[^\d,.-]/g, '')
    .replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function humanize_(key) {
  const s = String(key).replace(/[-_]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function splitLinks_(text) {
  return String(text || '')
    .split(/[\s,]+/)
    .filter(function (s) { return /^https?:\/\/\S+$/i.test(s); });
}

/** Z Produkty-JSON (řetězec nebo pole) vyrobí řádky objednávky; null = JSON nešel přečíst. */
function parseLines_(d) {
  const raw = d['Produkty-JSON'];
  let items = [];

  if (Array.isArray(raw)) {
    items = raw;
  } else if (typeof raw === 'string' && raw.trim() !== '') {
    try {
      items = JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }
  if (!Array.isArray(items)) return null;

  return items.map(function (item) {
    const qty = Number(item.quantity) || 1;
    const unitPrice = parseMoney_(item.price);
    return {
      name: String(item.name || 'Položka'),
      quantity: qty,
      unitPrice: unitPrice,
      lineTotal: parseMoney_(item.total) || qty * unitPrice,
      category: String(item.category || 'ostatni'),
    };
  });
}

function categoryLabel_(key) {
  return CATEGORY_LABELS[key] || humanize_(key);
}

/** Jednotný popis požadavku, ze kterého se staví e-mail i XML. */
function normalizeRequest_(parsed) {
  const d = parsed.data || {};
  const used = {};
  let type = FORM_TYPES[parsed.formName];

  if (!type) {
    const custom = String(d['Typ-Pozadavku'] || '').trim();
    type = Object.assign({}, GENERIC_TYPE, {
      label: custom || GENERIC_TYPE.label + (parsed.formName ? ' – ' + parsed.formName : ''),
    });
  }

  const company = pick_(d, ['Firma', 'firma'], used);
  const name = pick_(d, ['Jmeno', 'jmeno'], used);
  const rawStore = pick_(d, ['Prodejna', 'prodejna'], used);
  const location = pick_(d, ['Lokalita', 'lokalita'], used);

  const req = {
    formName: parsed.formName,
    type: type,
    submissionId: parsed.submissionId,
    name: name || company || pick_(d, ['name'], used) || 'Zákazník',
    company: company,
    ico: pick_(d, ['ICO', 'ico', 'IC'], used),
    email: pick_(d, ['Email', 'email'], used),
    phone: pick_(d, ['Telefon', 'telefon'], used),
    store: STORE_ALIASES[rawStore.toLowerCase()] || rawStore,
    location: location === 'jine' ? 'Jiná lokalita' : location,
    date: pick_(d, ['Datum', 'Datum_Vyzvednuti', 'datum'], used),
    note: pick_(d, ['Poznamka', 'Zprava', 'zprava'], used),
    orderId: pick_(d, ['Cislo-Objednavky'], used),
    paymentMethod: '',
    paymentLabel: '',
    total: parseMoney_(pick_(d, ['Celkem-Kc'], used)),
    quantity: 0,
    lines: [],
    categories: [],
    itemsText: pick_(d, ['Produkty-Seznam'], used),
    baseType: pick_(d, ['Typ-Podkladu'], used),
    links: [],
    extras: [],
    tech: [],
  };
  pick_(d, ['Typ-Pozadavku'], used);
  const categoriesField = pick_(d, ['Kategorie-Objednavky'], used);

  // platba
  const paymentRaw = pick_(d, ['Zpusob-Platby'], used).toLowerCase();
  if (paymentRaw) {
    req.paymentMethod = paymentRaw.indexOf('online') !== -1 ? 'online' : 'cash';
    req.paymentLabel = req.paymentMethod === 'online' ? 'Online kartou (Comgate)' : 'Při převzetí';
  }

  // položky košíku
  const lines = parseLines_(d);
  if (lines !== null) {
    used['Produkty-JSON'] = true;
    req.lines = lines;
  }
  if (req.lines.length) {
    req.quantity = req.lines.reduce(function (s, l) { return s + l.quantity; }, 0);
    if (!req.total) {
      req.total = req.lines.reduce(function (s, l) { return s + l.lineTotal; }, 0);
    }
  }

  // tisk: počet kusů + jediná řádka (Typ podkladu × počet)
  const printQty = parseInt(pick_(d, ['Pocet-Kusu'], used), 10);
  if (printQty > 0) {
    req.quantity = printQty;
    if (!req.lines.length) {
      req.lines.push({
        name: req.baseType || 'Tisk',
        quantity: printQty,
        unitPrice: req.total ? req.total / printQty : 0,
        lineTotal: req.total,
        category: 'tisk',
      });
    }
  }

  // kategorie objednávky (košík)
  const seen = {};
  req.lines.forEach(function (l) { seen[l.category] = true; });
  if (!req.lines.length) {
    // položky se nepodařilo přečíst → aspoň kategorie z pole Kategorie-Objednavky
    categoriesField.split(',').forEach(function (c) { if (c.trim()) seen[c.trim()] = true; });
  }
  if (type.key === 'objednavka') {
    req.categories = Object.keys(seen).filter(function (c) { return c !== 'tisk'; });
    if (req.categories.length) {
      req.type = Object.assign({}, type, {
        label: 'Objednávka – ' + req.categories.map(function (c) { return categoryLabel_(c).toLowerCase(); }).join(', '),
      });
    }
  }

  // odkazy na soubory / obrázky
  splitLinks_(pick_(d, ['Tisk-Odkazy'], used)).forEach(function (url, i, all) {
    req.links.push({ label: all.length > 1 ? 'Otevřít tiskový soubor ' + (i + 1) : 'Otevřít tiskový soubor', url: url });
  });
  splitLinks_(pick_(d, ['Foto-Odkaz'], used)).forEach(function (url) {
    req.links.push({ label: 'Otevřít inspirační obrázek', url: url });
  });

  // technické údaje (nakonec v e-mailu)
  const src = parsed.src || {};
  const techValue = function (k) {
    const v = d[k] !== undefined && d[k] !== null && d[k] !== '' ? d[k] : src[k];
    return v === undefined || v === null ? '' : String(v).trim();
  };
  const consent = techValue('Souhlas-VOP-GDPR');
  const tech = [
    ['Formulář', parsed.formName],
    ['Odesláno', formatDateTime_(techValue('created_at'))],
    ['Souhlas s VOP a GDPR', consent ? 'Udělen (' + consent + ')' : ''],
    ['IP adresa', techValue('ip')],
    ['Prohlížeč (user agent)', techValue('user_agent')],
    ['Odkazující stránka (referrer)', techValue('referrer')],
    ['ID odeslání', parsed.submissionId],
    ['Web', techValue('site_url')],
  ];
  req.tech = tech.filter(function (row) { return row[1]; });

  // cokoliv dalšího (neznámá pole) – aby se nic neztratilo
  Object.keys(d).forEach(function (key) {
    if (used[key] || TECH_KEYS.indexOf(key) !== -1) return;
    const v = d[key];
    if (v === undefined || v === null || typeof v === 'object') return;
    const s = String(v).trim();
    if (!s) return;
    if (/^https?:\/\/\S+$/i.test(s)) {
      req.links.push({ label: 'Otevřít: ' + humanize_(key), url: s });
    } else {
      req.extras.push([humanize_(key), s]);
    }
  });

  return req;
}

// ---------------------------------------------------------------------------------------------
// Formátování
// ---------------------------------------------------------------------------------------------

function esc_(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape pro XML (stejný jako dřív). */
function x_(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function money_(n) {
  const num = Math.round((Number(n) || 0) * 100) / 100;
  const parts = String(num).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return intPart + (parts[1] ? ',' + parts[1] : '') + '\u00a0Kč';
}

function formatDate_(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  if (!m) return String(iso || '');
  const days = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return days[dt.getDay()] + ' ' + Number(m[3]) + '. ' + Number(m[2]) + '. ' + m[1];
}

function formatDateTime_(value) {
  if (!value) return '';
  try {
    const dt = new Date(value);
    if (isNaN(dt.getTime())) return String(value);
    return Utilities.formatDate(dt, 'Europe/Prague', 'd. M. yyyy HH:mm');
  } catch (err) {
    return String(value);
  }
}

function isEmail_(s) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || ''));
}

// ---------------------------------------------------------------------------------------------
// XML pro Pohodu (jen košík)
// ---------------------------------------------------------------------------------------------

function buildPohodaXml_(o) {
  const itemsXml = o.lines.map(function (l) {
    return (
      '<ord:orderItem>' +
      '<ord:text>' + x_(l.name) + '</ord:text>' +
      '<ord:quantity>' + l.quantity + '</ord:quantity>' +
      '<ord:unit>ks</ord:unit>' +
      '<ord:payVAT>true</ord:payVAT>' +
      '<ord:rateVAT>' + CONFIG.RATE_VAT + '</ord:rateVAT>' +
      '<ord:homeCurrency><typ:unitPrice>' + l.unitPrice + '</typ:unitPrice></ord:homeCurrency>' +
      '</ord:orderItem>'
    );
  }).join('');

  const dateIssued = Utilities.formatDate(new Date(), 'Europe/Prague', 'yyyy-MM-dd');
  const payLabel = o.paymentLabel || 'Při převzetí';

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<dat:dataPack id="' + x_(o.orderId) + '" ico="' + CONFIG.ICO + '" application="cukrarstviblahutovi.cz" version="2.0" note="Import objednavky z webu" ' +
    'xmlns:dat="http://www.stormware.cz/schema/version_2/data.xsd" xmlns:ord="http://www.stormware.cz/schema/version_2/order.xsd" xmlns:typ="http://www.stormware.cz/schema/version_2/type.xsd">' +
    '<dat:dataPackItem id="' + x_(o.orderId) + '" version="2.0"><ord:order version="2.0"><ord:orderHeader>' +
    '<ord:orderType>receivedOrder</ord:orderType>' +
    '<ord:numberOrder>' + x_(o.orderId) + '</ord:numberOrder>' +
    '<ord:date>' + dateIssued + '</ord:date>' +
    (o.date ? '<ord:dateDelivery>' + x_(o.date) + '</ord:dateDelivery>' : '') +
    '<ord:text>' + x_('Web objednávka ' + o.orderId + ' – ' + o.store) + '</ord:text>' +
    '<ord:partnerIdentity><typ:address>' +
    '<typ:name>' + x_(o.name) + '</typ:name>' +
    (o.email ? '<typ:email>' + x_(o.email) + '</typ:email>' : '') +
    (o.phone ? '<typ:mobilPhone>' + x_(o.phone) + '</typ:mobilPhone>' : '') +
    '</typ:address></ord:partnerIdentity>' +
    '<ord:note>' + x_('Platba: ' + payLabel + (o.note ? ' | ' + o.note : '')) + '</ord:note>' +
    '</ord:orderHeader><ord:orderDetail>' + itemsXml + '</ord:orderDetail></ord:order></dat:dataPackItem></dat:dataPack>'
  );
}

// ---------------------------------------------------------------------------------------------
// E-mail
// ---------------------------------------------------------------------------------------------

function buildSubject_(r) {
  const where = r.store || r.location;
  return (
    r.name + ' – ' + r.type.label +
    (r.orderId ? ' ' + r.orderId : '') +
    (where ? ' – ' + where : '') +
    (r.date ? ' (' + r.date + ')' : '')
  );
}

function noteLabel_(r) {
  if (r.type.key === 'dort-na-prani') return 'Popis přání zákazníka';
  if (r.type.key === 'b2b') return 'Zpráva / poptávané množství';
  return 'Poznámka zákazníka';
}

function factCell_(fact) {
  if (!fact) {
    return '<td width="50%" style="padding:0;"></td>';
  }
  let bg = '#f8fafc';
  let border = '#e2e8f0';
  let color = '#0f172a';
  let size = '15px';
  if (fact.hi === 'price') { bg = '#fffbeb'; border = '#fcd34d'; color = '#92400e'; size = '20px'; }
  if (fact.hi === 'date') { bg = '#eff6ff'; border = '#93c5fd'; color = '#1e3a8a'; size = '17px'; }
  return (
    '<td width="50%" valign="top" style="padding:12px 14px;background:' + bg + ';border:1px solid ' + border + ';border-radius:10px;">' +
    '<div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-bottom:4px;">' + esc_(fact.label) + '</div>' +
    '<div style="font-size:' + size + ';font-weight:700;color:' + color + ';word-break:break-word;">' + fact.html + '</div>' +
    '</td>'
  );
}

function buildFacts_(r) {
  const facts = [];
  const link = function (href, text) {
    return '<a href="' + esc_(href) + '" style="color:inherit;text-decoration:none;border-bottom:1px dotted #94a3b8;">' + esc_(text) + '</a>';
  };

  if (r.date) facts.push({ label: 'Termín vyzvednutí', html: esc_(formatDate_(r.date)), hi: 'date' });
  if (r.total) facts.push({ label: 'Cena celkem', html: esc_(money_(r.total)), hi: 'price' });
  if (r.store) facts.push({ label: 'Prodejna', html: esc_(r.store) });
  if (r.location) facts.push({ label: 'Lokalita závozu', html: esc_(r.location) });
  if (r.quantity) facts.push({ label: 'Počet kusů', html: esc_(r.quantity) + '\u00a0ks' });
  if (r.company) facts.push({ label: 'Firma', html: esc_(r.company) + (r.ico ? ' <span style="font-weight:400;color:#64748b;">(IČO ' + esc_(r.ico) + ')</span>' : '') });
  else if (r.ico) facts.push({ label: 'IČO', html: esc_(r.ico) });
  if (r.email) facts.push({ label: 'E-mail', html: link('mailto:' + r.email, r.email) });
  if (r.phone) facts.push({ label: 'Telefon', html: link('tel:' + r.phone.replace(/\s+/g, ''), r.phone) });
  if (r.paymentLabel) facts.push({ label: 'Způsob platby', html: esc_(r.paymentLabel) });
  if (r.baseType) facts.push({ label: 'Podklad', html: esc_(r.baseType) });

  return facts;
}

function factsTable_(facts) {
  let rows = '';
  for (let i = 0; i < facts.length; i += 2) {
    rows += '<tr>' + factCell_(facts[i]) + factCell_(facts[i + 1]) + '</tr>';
  }
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px;">' + rows + '</table>';
}

function sectionTitle_(text) {
  return '<div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;color:#475569;margin:0 0 10px 0;">' + esc_(text) + '</div>';
}

function linesTable_(r) {
  const th = 'padding:10px 12px;border-bottom:2px solid #cbd5e1;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;';
  const td = 'padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;';
  const showCat = r.categories.length > 1;

  const rows = r.lines.map(function (l) {
    return (
      '<tr>' +
      '<td style="' + td + '"><strong>' + esc_(l.name) + '</strong>' +
      (showCat ? '<div style="font-size:11px;color:#64748b;margin-top:2px;">' + esc_(categoryLabel_(l.category)) + '</div>' : '') +
      '</td>' +
      '<td style="' + td + 'text-align:center;white-space:nowrap;">' + l.quantity + '\u00a0ks</td>' +
      '<td style="' + td + 'text-align:right;white-space:nowrap;">' + (l.unitPrice ? esc_(money_(l.unitPrice)) : '–') + '</td>' +
      '<td style="' + td + 'text-align:right;white-space:nowrap;"><strong>' + (l.lineTotal ? esc_(money_(l.lineTotal)) : '–') + '</strong></td>' +
      '</tr>'
    );
  }).join('');

  const totalRow = r.total
    ? '<tr><td colspan="3" style="padding:12px;text-align:right;font-size:13px;color:#475569;">Celkem s DPH</td>' +
      '<td style="padding:12px;text-align:right;font-size:16px;font-weight:700;white-space:nowrap;color:#92400e;">' + esc_(money_(r.total)) + '</td></tr>'
    : '';

  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' +
    '<thead><tr>' +
    '<th align="left" style="' + th + '">Položka</th>' +
    '<th align="center" style="' + th + '">Množství</th>' +
    '<th align="right" style="' + th + '">Cena/ks</th>' +
    '<th align="right" style="' + th + '">Celkem</th>' +
    '</tr></thead><tbody>' + rows + totalRow + '</tbody></table>'
  );
}

function kvTable_(rows, small) {
  const fs = small ? '12px' : '14px';
  const color = small ? '#64748b' : '#0f172a';
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' +
    rows.map(function (row) {
      return (
        '<tr>' +
        '<td valign="top" style="padding:5px 12px 5px 0;font-size:' + fs + ';color:#94a3b8;white-space:nowrap;width:1%;">' + esc_(row[0]) + '</td>' +
        '<td valign="top" style="padding:5px 0;font-size:' + fs + ';color:' + color + ';word-break:break-word;white-space:pre-wrap;">' + esc_(row[1]) + '</td>' +
        '</tr>'
      );
    }).join('') +
    '</table>'
  );
}

function buildEmailHtml_(r, xmlInfo) {
  const accent = r.type.accent;
  const font = "font-family:'Segoe UI',Roboto,Arial,Helvetica,sans-serif;";
  const block = function (inner) {
    return '<tr><td style="padding:6px 28px 18px 28px;">' + inner + '</td></tr>';
  };

  const chips = r.categories.length > 1
    ? '<div style="margin-top:10px;">' + r.categories.map(function (c) {
        return '<span style="display:inline-block;margin:0 6px 4px 0;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,0.14);color:#fde68a;font-size:12px;font-weight:600;">' + esc_(categoryLabel_(c)) + '</span>';
      }).join('') + '</div>'
    : '';

  const header =
    '<tr><td style="background:#0a192f;padding:22px 28px 20px 28px;">' +
    '<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#d4af37;margin-bottom:12px;">Cukrářství Blahutovi · web</div>' +
    '<span style="display:inline-block;background:' + accent + ';color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:5px 12px;border-radius:6px;">' + esc_(r.type.label) + '</span>' +
    '<div style="font-size:26px;line-height:1.25;font-weight:700;color:#ffffff;margin-top:14px;">' + esc_(r.name) + '</div>' +
    (r.orderId ? '<div style="font-size:14px;color:#d4af37;margin-top:4px;">Objednávka č. ' + esc_(r.orderId) + '</div>' : '') +
    chips +
    '</td></tr>' +
    '<tr><td style="height:4px;line-height:4px;font-size:0;background:' + accent + ';">&nbsp;</td></tr>';

  const sections = [];

  const facts = buildFacts_(r);
  if (facts.length) sections.push('<tr><td style="padding:12px 20px 4px 20px;">' + factsTable_(facts) + '</td></tr>');

  if (r.lines.length && r.type.key !== 'tisk') {
    sections.push(block(sectionTitle_('Objednané položky') + linesTable_(r)));
  } else if (r.itemsText) {
    sections.push(block(sectionTitle_('Objednané položky') +
      '<div style="font-size:14px;white-space:pre-wrap;">' + esc_(r.itemsText) + '</div>'));
  }

  if (r.note) {
    sections.push(block(
      sectionTitle_(noteLabel_(r)) +
      '<div style="background:#f8fafc;border-left:4px solid ' + accent + ';border-radius:4px;padding:14px 16px;font-size:15px;line-height:1.55;white-space:pre-wrap;">' + esc_(r.note) + '</div>'
    ));
  }

  if (r.links.length) {
    const buttons = r.links.map(function (l) {
      return (
        '<div style="margin:0 0 12px 0;">' +
        '<a href="' + esc_(l.url) + '" target="_blank" style="display:inline-block;background:' + accent + ';color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:13px 22px;border-radius:8px;">' + esc_(l.label) + ' &rarr;</a>' +
        '<div style="font-size:11px;color:#94a3b8;margin-top:5px;word-break:break-all;">' + esc_(l.url) + '</div>' +
        '</div>'
      );
    }).join('');
    sections.push(block(sectionTitle_('Soubory a obrázky') + buttons));
  }

  if (r.extras.length) {
    sections.push(block(sectionTitle_('Další údaje') + kvTable_(r.extras, false)));
  }

  if (xmlInfo) {
    sections.push(block(
      '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;font-size:13px;color:#166534;">' +
      'XML pro Pohodu <code>' + esc_(xmlInfo.fileName) + '</code> je uložené na Google Disku a přiložené k tomuto e-mailu.</div>'
    ));
  }

  const tech = r.tech.length
    ? '<tr><td style="padding:16px 28px 22px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">' +
      '<div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">Technické údaje</div>' +
      kvTable_(r.tech, true) +
      '</td></tr>'
    : '';

  return (
    '<div style="margin:0;padding:24px 12px;background:#e2e8f0;' + font + 'color:#0f172a;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #cbd5e1;">' +
    header + sections.join('') + tech +
    '</table></div>'
  );
}

function buildEmailText_(r, xmlInfo) {
  const lines = [];
  lines.push(r.type.label.toUpperCase());
  lines.push('Zákazník: ' + r.name);
  if (r.orderId) lines.push('Objednávka č.: ' + r.orderId);
  if (r.company) lines.push('Firma: ' + r.company + (r.ico ? ' (IČO ' + r.ico + ')' : ''));
  if (r.email) lines.push('E-mail: ' + r.email);
  if (r.phone) lines.push('Telefon: ' + r.phone);
  if (r.store) lines.push('Prodejna: ' + r.store);
  if (r.location) lines.push('Lokalita závozu: ' + r.location);
  if (r.date) lines.push('Termín: ' + formatDate_(r.date));
  if (r.quantity) lines.push('Počet kusů: ' + r.quantity);
  if (r.total) lines.push('Cena celkem: ' + money_(r.total));
  if (r.paymentLabel) lines.push('Platba: ' + r.paymentLabel);

  if (r.lines.length) {
    lines.push('', 'Položky:');
    r.lines.forEach(function (l) {
      lines.push('- ' + l.quantity + 'x ' + l.name + (l.lineTotal ? ' – ' + money_(l.lineTotal) : ''));
    });
  } else if (r.itemsText) {
    lines.push('', 'Položky:', r.itemsText);
  }
  if (r.note) lines.push('', noteLabel_(r) + ':', r.note);
  if (r.links.length) {
    lines.push('', 'Soubory a obrázky:');
    r.links.forEach(function (l) { lines.push('- ' + l.label + ': ' + l.url); });
  }
  if (r.extras.length) {
    lines.push('', 'Další údaje:');
    r.extras.forEach(function (row) { lines.push('- ' + row[0] + ': ' + row[1]); });
  }
  if (xmlInfo) lines.push('', 'XML pro Pohodu: ' + xmlInfo.fileName + ' (uloženo na Disku a v příloze)');
  if (r.tech.length) {
    lines.push('', '--- Technické údaje ---');
    r.tech.forEach(function (row) { lines.push(row[0] + ': ' + row[1]); });
  }
  return lines.join('\n');
}

function sendRequestEmail_(r, xmlInfo) {
  const options = {
    to: CONFIG.NOTIFY_EMAIL,
    subject: buildSubject_(r),
    body: buildEmailText_(r, xmlInfo),
    htmlBody: buildEmailHtml_(r, xmlInfo),
    name: CONFIG.SENDER_NAME,
  };

  if (xmlInfo) {
    options.attachments = [Utilities.newBlob(xmlInfo.xml, 'text/xml', xmlInfo.fileName)];
  }
  if (isEmail_(r.email)) {
    options.replyTo = r.email;
  }

  MailApp.sendEmail(options);
}
