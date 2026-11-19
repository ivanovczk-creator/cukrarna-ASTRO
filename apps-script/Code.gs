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
 * Po úspěšné interní notifikaci (NOTIFY_EMAIL) se zákazníkovi s platným e-mailem pošle potvrzení
 * (ne u testu, ne u duplicit; selhání potvrzení běh neshodí, jen pošle upozornění na NOTIFY_EMAIL).
 * Online platba (Comgate): netlify/functions/comgate-notify.mjs posílá { action: 'payment-update', orderId, status, transId, amount }
 * → handlePaymentUpdate_ přepíše v XML objednávky poznámku „Platba: …“ a značku v textu ([ZAPLACENO ONLINE]) a pošle interní e-mail.
 * Odpověď je vždy JSON { ok: true|false, version, confirmation: sent|skipped|failed, ... } – vyhodnocuje ji pohoda-webhook.mjs.
 * Test z editoru: funkce testConfirmation (bez podtržítka, jinak by nešla spustit).
 */

/** Verze kódu – po nasazení ji uvidíte v odpovědi na GET adresy /exec (kontrola, že běží správná verze). */
const VERSION = '2026-11-19-comgate-payment';

const CONFIG = {
  NOTIFY_EMAIL: 'objednavky@cukrarstviblahutovi.cz',
  XML_FOLDER_ID: '16X6rwavpSbq27msnCi81ZjtPwSZPxzmp',
  ICO: '76208371',
  RATE_VAT: 'low',
  SENDER_NAME: 'Web – Cukrářství Blahutovi', // interní notifikace
  CUSTOMER_SENDER_NAME: 'Cukrářství Blahutovi', // potvrzení zákazníkům
  TEST_EMAIL: '', // příjemce pro testConfirmation(); prázdné = NOTIFY_EMAIL
  PHONE: '+420 602 323 788',
  ADDRESS: 'Opavská 218/101, 747 18 Píšť',
};

/** Typy formulářů (klíč = form_name z Netlify). */
const FORM_TYPES = {
  'objednavka': { key: 'objednavka', label: 'Objednávka', accent: '#b45309', xml: true },
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
  return json_({ ok: true, service: 'Cukrarstvi_Objednavky_Pohoda', version: VERSION });
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
      return json_({ ok: true, test: true, version: VERSION, note: 'nic nezapsáno ani neodesláno' });
    }

    // výsledek online platby z Comgate (posílá netlify/functions/comgate-notify.mjs přes pohoda-webhook)
    if (parsed.src && parsed.src.action === 'payment-update') {
      return json_(Object.assign({ ok: true, version: VERSION, handledForm: 'payment-update' }, handlePaymentUpdate_(parsed.src)));
    }

    const req = normalizeRequest_(parsed);
    const result = req.type.xml ? handleOrder_(req) : handleRequest_(req, parsed);

    return json_(Object.assign({
      ok: true,
      version: VERSION,
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

  // zákaznické potvrzení až po úspěšné interní notifikaci; jeho selhání běh neshodí
  return Object.assign({ orderId: req.orderId }, confirmationResult_(sendCustomerConfirmation_(req)));
}

// ---------------------------------------------------------------------------------------------
// Online platba (Comgate)
// ---------------------------------------------------------------------------------------------

/** Text pro poznámku objednávky (Pohoda → Poznámka) podle stavu online platby. */
function paymentNote_(status, p) {
  p = p || {};
  if (status === 'PAID') {
    return 'ZAPLACENO online kartou (Comgate)' +
      (p.transId ? ', transakce ' + p.transId : '') +
      (p.amount ? ', ' + (Number(p.amount) / 100) + ' Kč' : '') +
      (p.test ? ' [TESTOVACÍ PLATBA]' : '');
  }
  if (status === 'CANCELLED') {
    return 'Online platba (Comgate) NEDOKONČENA / zrušena – neuhrazeno, k úhradě při převzetí';
  }
  return 'Online kartou (Comgate) – ČEKÁ NA ÚHRADU';
}

/** Krátká značka v textu objednávky (v Pohodě je vidět ve výpisu objednávek). */
function paymentMarker_(status) {
  if (status === 'PAID') return '[ZAPLACENO ONLINE]';
  if (status === 'CANCELLED') return '[ONLINE PLATBA ZRUŠENA]';
  return '[ONLINE – ČEKÁ NA ÚHRADU]';
}

/**
 * Propíše výsledek online platby do XML objednávky na Disku (přepíše poznámku a značku v textu)
 * a pošle interní e-mail. Idempotentní: opakované volání s týmž stavem nic neduplikuje (e-mail se pošle jednou).
 * Když XML objednávky ještě neexistuje (platba dorazila dřív než objednávka), vrací chybu – netlify funkce
 * i Comgate pak notifikaci zopakují.
 */
function handlePaymentUpdate_(p) {
  const orderId = String(p.orderId || '');
  const status = String(p.status || '').toUpperCase();
  if (!/^BL-\d{8}-[A-Z0-9]{4}$/.test(orderId)) throw new Error('Neplatné číslo objednávky');
  if (status !== 'PAID' && status !== 'CANCELLED') throw new Error('Nepodporovaný stav platby: ' + status);

  const folder = DriveApp.getFolderById(CONFIG.XML_FOLDER_ID);
  const files = folder.getFilesByName(orderId + '.xml');
  if (!files.hasNext()) throw new Error('order-not-found: XML objednávky ' + orderId + ' zatím neexistuje');

  const file = files.next();
  let xml = file.getBlob().getDataAsString('UTF-8');
  const note = paymentNote_(status, p);
  const marker = paymentMarker_(status);

  // poznámka: „Platba: … | poznámka zákazníka“ → vyměníme jen část o platbě
  xml = xml.replace(/<ord:note>Platba: [^<|]*?(?= \| |<\/ord:note>)/, function () {
    return '<ord:note>Platba: ' + x_(note);
  });
  // text objednávky: přidáme / vyměníme značku stavu platby
  xml = xml.replace(/(<ord:text>[^<]*?)( \[(?:ONLINE|ZAPLACENO)[^\]<]*\])?(<\/ord:text>)/, function (m, head, oldMarker, tail) {
    return head + ' ' + x_(marker) + tail;
  });
  file.setContent(xml);

  const cache = CacheService.getScriptCache();
  const key = 'pay:' + orderId + ':' + status;
  let emailed = false;
  if (!cache.get(key)) {
    const paid = status === 'PAID';
    MailApp.sendEmail({
      to: CONFIG.NOTIFY_EMAIL,
      subject: (paid ? 'Online platba ZAPLACENA – ' : 'Online platba NEDOKONČENA – ') + orderId,
      body: [
        paid ? 'Zákazník zaplatil objednávku online kartou přes Comgate.' : 'Online platba objednávky nebyla dokončena (zrušena / nezdařila se).',
        '',
        'Objednávka: ' + orderId,
        'Stav: ' + note,
        paid ? '' : 'Objednávka zůstává v systému – domluvte se se zákazníkem na úhradě (např. při převzetí).',
        'XML objednávky na Disku (' + orderId + '.xml) bylo aktualizováno: poznámka „Platba: …“ a značka v textu objednávky.',
        'Pokud už byla objednávka naimportována do Pohody před úhradou, upravte poznámku ručně.',
      ].join('\n'),
      name: CONFIG.SENDER_NAME,
    });
    cache.put(key, '1', 21600);
    emailed = true;
  }

  return { orderId: orderId, payment: status, xmlUpdated: true, emailed: emailed };
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

  // zákaznické potvrzení až po úspěšné interní notifikaci; jeho selhání běh neshodí
  return Object.assign({ orderId: req.orderId || undefined }, confirmationResult_(sendCustomerConfirmation_(req)));
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
    // e-mail: pole formuláře, jinak fallback na e-mail z nejvyšší úrovně payloadu (Netlify ho posílá i tam)
    email: pick_(d, ['Email', 'email'], used) || String((parsed.src && parsed.src.email) || '').trim(),
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
    // název typu zůstává vždy jednotně „Objednávka“; kategorie slouží jen jako štítky v e-mailu
    req.categories = Object.keys(seen).filter(function (c) { return c !== 'tisk'; });
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

/**
 * Přísná kontrola e-mailu: jen ASCII (MailApp adresy s diakritikou odmítá), žádná koncová tečka,
 * žádné dvojité tečky, doména s tečkou a koncovkou alespoň 2 písmena.
 */
function isEmail_(s) {
  const v = String(s || '');
  if (!v || v.length > 254 || v !== v.trim()) return false;
  const parts = v.split('@');
  if (parts.length !== 2) return false;
  const local = parts[0];
  const domain = parts[1];
  if (!local || local.length > 64 || /^\.|\.$|\.\./.test(local)) return false;
  if (!/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+$/.test(local)) return false;
  if (domain.length > 253 || /^\.|\.$|\.\./.test(domain)) return false;
  return /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(domain) &&
    !/(^|\.)-|-(\.|$)/.test(domain);
}

/** Zamaskovaná adresa pro logy: j***@seznam.cz */
function maskEmail_(s) {
  const v = String(s || '');
  const at = v.indexOf('@');
  if (!v) return '(prázdné)';
  if (at < 1) return v.slice(0, 2) + '***';
  return v.charAt(0) + '***' + v.slice(at);
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
  // online platba: v okamžiku objednávky ještě neuhrazeno – po zaplacení přepíše stav handlePaymentUpdate_
  const online = o.paymentMethod === 'online';
  const payLabel = online ? paymentNote_('PENDING') : (o.paymentLabel || 'Při převzetí');
  const headerText = 'Web objednávka ' + o.orderId + ' – ' + o.store + (online ? ' ' + paymentMarker_('PENDING') : '');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<dat:dataPack id="' + x_(o.orderId) + '" ico="' + CONFIG.ICO + '" application="cukrarstviblahutovi.cz" version="2.0" note="Import objednavky z webu" ' +
    'xmlns:dat="http://www.stormware.cz/schema/version_2/data.xsd" xmlns:ord="http://www.stormware.cz/schema/version_2/order.xsd" xmlns:typ="http://www.stormware.cz/schema/version_2/type.xsd">' +
    '<dat:dataPackItem id="' + x_(o.orderId) + '" version="2.0"><ord:order version="2.0"><ord:orderHeader>' +
    '<ord:orderType>receivedOrder</ord:orderType>' +
    '<ord:numberOrder>' + x_(o.orderId) + '</ord:numberOrder>' +
    '<ord:date>' + dateIssued + '</ord:date>' +
    (o.date ? '<ord:dateDelivery>' + x_(o.date) + '</ord:dateDelivery>' : '') +
    '<ord:text>' + x_(headerText) + '</ord:text>' +
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

// ---------------------------------------------------------------------------------------------
// Potvrzovací e-mail zákazníkovi
// ---------------------------------------------------------------------------------------------

/**
 * Odešle zákazníkovi potvrzení. Volá se až po úspěšné interní notifikaci a jen u reálně zpracovaných
 * požadavků (test i duplicity končí dřív). Nikdy nevyhazuje výjimku.
 * Vrací { status: 'sent' | 'skipped' | 'failed', reason } a vždy zapíše rozhodnutí do logu (Spuštění).
 */
function sendCustomerConfirmation_(r) {
  const started = Date.now();
  let status = 'sent';
  let reason = '';

  if (!r.email) {
    status = 'skipped';
    reason = 'zákazník nevyplnil e-mail';
  } else if (!isEmail_(r.email)) {
    status = 'skipped';
    reason = 'neplatný e-mail (kontrola isEmail_)';
  } else {
    try {
      const isB2b = r.type.key === 'b2b';
      const content = isB2b ? buildB2bConfirmation_(r) : buildStandardConfirmation_(r);

      MailApp.sendEmail({
        to: r.email,
        subject: content.subject,
        body: content.text,
        htmlBody: content.html,
        name: CONFIG.CUSTOMER_SENDER_NAME,
        replyTo: CONFIG.NOTIFY_EMAIL,
      });
    } catch (err) {
      status = 'failed';
      reason = String(err && err.message ? err.message : err);
      console.error('Potvrzení zákazníkovi se nepodařilo odeslat: ' + (err && err.stack ? err.stack : err));
    }
  }

  let quota = 'n/a';
  try {
    quota = MailApp.getRemainingDailyQuota();
  } catch (quotaErr) {
    quota = 'chyba: ' + quotaErr;
  }

  console.log('Potvrzení zákazníkovi: ' + JSON.stringify({
    status: status,
    reason: reason || undefined,
    to: maskEmail_(r.email),
    form: r.formName || '(neznámý)',
    type: r.type.key,
    orderId: r.orderId || undefined,
    ms: Date.now() - started,
    remainingQuota: quota,
    version: VERSION,
  }));

  if (status === 'failed') {
    notifyConfirmationFailure_(r, reason);
  }

  return { status: status, reason: reason };
}

/** Pole pro JSON odpověď: confirmation = sent | skipped | failed, confirmationReason = důvod (pokud je). */
function confirmationResult_(res) {
  return { confirmation: res.status, confirmationReason: res.reason || undefined };
}

/** Krátké upozornění na NOTIFY_EMAIL, že potvrzení zákazníkovi selhalo (aby se dalo poslat ručně). */
function notifyConfirmationFailure_(r, reason) {
  try {
    const lines = [
      'Potvrzovací e-mail se nepodařilo odeslat. Objednávka / požadavek byl zpracován, jen zákazník nedostal potvrzení.',
      '',
      'Zákazník: ' + r.name,
      'E-mail zákazníka: ' + r.email,
      'Typ: ' + r.type.label,
    ];
    if (r.orderId) lines.push('Číslo objednávky: ' + r.orderId);
    lines.push('Důvod chyby: ' + reason, '', 'Prosím odpovězte zákazníkovi ručně. Podrobnosti jsou v Apps Script → Spuštění.');

    MailApp.sendEmail({
      to: CONFIG.NOTIFY_EMAIL,
      subject: 'POZOR: potvrzení zákazníkovi se neodeslalo – ' + r.name + (r.orderId ? ' ' + r.orderId : ''),
      body: lines.join('\n'),
      name: CONFIG.SENDER_NAME,
    });
  } catch (err) {
    console.error('Upozornění na selhání potvrzení se nepodařilo odeslat: ' + err);
  }
}

/**
 * Test z editoru Apps Script (vyberte funkci „testConfirmation“ a dejte Spustit).
 * Název je záměrně bez podtržítka na konci – funkce končící „_“ jsou v editoru soukromé a nejdou spustit.
 * Odešle ukázková potvrzení (košík + B2B) na CONFIG.TEST_EMAIL (jinak NOTIFY_EMAIL) a vypíše do protokolu
 * efektivního uživatele (odesílatele) a zbývající denní kvótu.
 */
function testConfirmation() {
  const to = CONFIG.TEST_EMAIL || CONFIG.NOTIFY_EMAIL;

  let activeUser = '';
  try { activeUser = Session.getActiveUser().getEmail(); } catch (e1) { activeUser = 'nedostupné'; }
  console.log('Efektivní uživatel (odesílatel): ' + Session.getEffectiveUser().getEmail());
  console.log('Aktivní uživatel: ' + (activeUser || '(prázdné)'));
  console.log('Zbývající denní kvóta e-mailů: ' + MailApp.getRemainingDailyQuota());
  console.log('Verze: ' + VERSION + ' | příjemce testu: ' + maskEmail_(to));

  const samples = [
    {
      form_name: 'objednavka',
      id: 'test-objednavka',
      data: {
        Jmeno: 'Test Zákazník', Email: to, Telefon: '602 000 000', Prodejna: 'Píšť',
        Datum: Utilities.formatDate(new Date(Date.now() + 7 * 86400000), 'Europe/Prague', 'yyyy-MM-dd'),
        'Cislo-Objednavky': 'TEST-0001', 'Zpusob-Platby': 'Při převzetí', 'Celkem-Kc': '540',
        'Produkty-JSON': JSON.stringify([
          { name: 'Větrník', price: 70, quantity: 3, category: 'zakusky' },
          { name: 'Punčový řez', price: 65, quantity: 2, category: 'zakusky' },
          { name: 'Zápich – ukázka', price: 100, quantity: 2, category: 'zapichy' },
        ]),
        Poznamka: 'Testovací potvrzení z funkce testConfirmation – ignorujte.',
      },
    },
    {
      form_name: 'b2b-poptavka',
      id: 'test-b2b',
      data: {
        Firma: 'Testovací firma s.r.o.', ICO: '12345678', Email: to, Telefon: '602 000 000',
        Lokalita: 'Ostrava', Poznamka: 'Testovací potvrzení z funkce testConfirmation – ignorujte.',
      },
    },
  ];

  const results = samples.map(function (sample) {
    const req = normalizeRequest_({
      raw: '', src: sample, data: sample.data, formName: sample.form_name, submissionId: sample.id,
    });
    const res = sendCustomerConfirmation_(req);
    return sample.form_name + ' → ' + res.status + (res.reason ? ' (' + res.reason + ')' : '');
  });

  console.log('Výsledek testu: ' + results.join(' | '));
  return results;
}

/** Texty podle typu požadavku (předmět, nadpis, úvod). */
function confirmationTexts_(r) {
  const brand = 'Cukrářství Blahutovi';
  switch (r.type.key) {
    case 'objednavka':
      return {
        subject: 'Potvrzení objednávky' + (r.orderId ? ' č. ' + r.orderId : '') + ' – ' + brand,
        title: 'Děkujeme za vaši objednávku',
        intro: 'Vaši objednávku jsme v pořádku přijali a začínáme ji zpracovávat. Níže najdete její shrnutí.',
        noteLabel: 'Vaše poznámka',
      };
    case 'tisk':
      return {
        subject: 'Potvrzení objednávky jedlého tisku – ' + brand,
        title: 'Děkujeme za objednávku jedlého tisku',
        intro: 'Vaši objednávku tisku na fondánový list jsme přijali. Níže najdete její shrnutí.',
        noteLabel: 'Vaše poznámka',
      };
    case 'dort-na-prani':
      return {
        subject: 'Potvrzení přijetí poptávky – dort na přání – ' + brand,
        title: 'Děkujeme za vaši poptávku',
        intro: 'Vaši poptávku na dort na přání jsme přijali. Přání si projdeme a ozveme se vám s dalším postupem.',
        noteLabel: 'Vaše přání',
      };
    default:
      return {
        subject: 'Potvrzení přijetí požadavku – ' + brand,
        title: 'Děkujeme za váš požadavek',
        intro: 'Váš požadavek jsme přijali. Níže najdete shrnutí zadaných údajů.',
        noteLabel: 'Vaše poznámka',
      };
  }
}

/** Klíčové údaje pro zákazníka jako { label, text, hi }. */
function confirmFacts_(r) {
  const facts = [];
  if (r.orderId) facts.push({ label: 'Číslo objednávky', text: r.orderId });
  if (r.store) facts.push({ label: 'Prodejna', text: r.store });
  if (r.location) facts.push({ label: 'Lokalita', text: r.location });
  if (r.date) facts.push({ label: 'Termín vyzvednutí', text: formatDate_(r.date), hi: 'date' });
  if (r.paymentLabel) facts.push({ label: 'Způsob platby', text: r.paymentLabel });
  if (r.total) facts.push({ label: 'Cena celkem', text: money_(r.total), hi: 'price' });
  if (r.quantity) facts.push({ label: 'Počet kusů', text: r.quantity + '\u00a0ks' });
  if (r.baseType) facts.push({ label: 'Podklad', text: r.baseType });
  return facts;
}

/** Údaje z B2B poptávky jako [popisek, hodnota]. */
function b2bRows_(r) {
  const rows = [];
  if (r.company) rows.push(['Firma', r.company]);
  if (r.name && r.name !== r.company && r.name !== 'Zákazník') {
    rows.push([r.company ? 'Kontaktní osoba' : 'Jméno', r.name]);
  }
  if (r.ico) rows.push(['IČO', r.ico]);
  if (r.location) rows.push(['Lokalita', r.location]);
  if (r.phone) rows.push(['Telefon', r.phone]);
  if (r.email) rows.push(['E-mail', r.email]);
  if (r.date) rows.push(['Požadovaný termín', formatDate_(r.date)]);
  if (r.note) rows.push(['Zpráva / poznámka', r.note]);
  return rows;
}

/** Společný rámec zákaznického e-mailu (hlavička, obsah, kontakt, patička). */
function confirmationShell_(title, bodyRows) {
  const font = "font-family:'Segoe UI',Roboto,Arial,Helvetica,sans-serif;";
  const header =
    '<tr><td style="background:#0a192f;padding:26px 28px 22px 28px;">' +
    '<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#d4af37;margin-bottom:12px;">Cukrářství Blahutovi</div>' +
    '<div style="font-size:26px;line-height:1.25;font-weight:700;color:#ffffff;">' + esc_(title) + '</div>' +
    '</td></tr>' +
    '<tr><td style="height:4px;line-height:4px;font-size:0;background:#d4af37;">&nbsp;</td></tr>';

  const footer =
    '<tr><td style="padding:16px 28px 22px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.6;color:#64748b;">' +
    '<strong style="color:#475569;">Cukrářství Blahutovi</strong> · Ivo Blahut · ' + esc_(CONFIG.ADDRESS) + ' · IČO ' + esc_(CONFIG.ICO) + '<br>' +
    'Tel. <a href="tel:' + esc_(CONFIG.PHONE.replace(/\s+/g, '')) + '" style="color:#475569;">' + esc_(CONFIG.PHONE) + '</a> · ' +
    '<a href="mailto:' + esc_(CONFIG.NOTIFY_EMAIL) + '" style="color:#475569;">' + esc_(CONFIG.NOTIFY_EMAIL) + '</a><br>' +
    '<span style="color:#94a3b8;">Tento e-mail vznikl automaticky po odeslání formuláře na webu cukrarstviblahutovi.cz.</span>' +
    '</td></tr>';

  return (
    '<div style="margin:0;padding:24px 12px;background:#e2e8f0;' + font + 'color:#0f172a;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #cbd5e1;">' +
    header + bodyRows.join('') + footer +
    '</table></div>'
  );
}

function confirmParagraph_(text) {
  return '<tr><td style="padding:18px 28px 6px 28px;font-size:15px;line-height:1.6;color:#0f172a;">' + text + '</td></tr>';
}

function confirmBlock_(inner) {
  return '<tr><td style="padding:6px 28px 18px 28px;">' + inner + '</td></tr>';
}

/** Potvrzení pro ostatní typy: košík, tisk, dort na přání i obecné formuláře. */
function buildStandardConfirmation_(r) {
  const t = confirmationTexts_(r);
  const facts = confirmFacts_(r);
  const hasItemsTable = r.lines.length > 0 && r.type.key !== 'tisk';
  const hello = r.name && r.name !== 'Zákazník' ? 'Dobrý den, ' + r.name + ',' : 'Dobrý den,';
  const contactHtml =
    'V případě dotazů nebo změny termínu můžete jednoduše odpovědět na tento e-mail ' +
    'nebo zavolat na prodejnu, případně na telefon <strong>' + esc_(CONFIG.PHONE) + '</strong>.';
  const contactText =
    'V případě dotazů nebo změny termínu můžete jednoduše odpovědět na tento e-mail nebo zavolat na prodejnu, případně na telefon ' +
    CONFIG.PHONE + '.';

  // HTML
  const rows = [];
  rows.push(confirmParagraph_(esc_(hello) + '<br>' + esc_(t.intro)));
  if (facts.length) {
    rows.push('<tr><td style="padding:10px 20px 4px 20px;">' + factsTable_(facts.map(function (f) {
      return { label: f.label, html: esc_(f.text), hi: f.hi };
    })) + '</td></tr>');
  }
  if (hasItemsTable) {
    rows.push(confirmBlock_(sectionTitle_('Přehled položek') + linesTable_(r)));
  } else if (r.itemsText) {
    rows.push(confirmBlock_(sectionTitle_('Přehled položek') +
      '<div style="font-size:14px;white-space:pre-wrap;">' + esc_(r.itemsText) + '</div>'));
  }
  if (r.note) {
    rows.push(confirmBlock_(
      sectionTitle_(t.noteLabel) +
      '<div style="background:#f8fafc;border-left:4px solid #d4af37;border-radius:4px;padding:14px 16px;font-size:15px;line-height:1.55;white-space:pre-wrap;">' + esc_(r.note) + '</div>'
    ));
  }
  rows.push(confirmBlock_(
    '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;font-size:14px;line-height:1.55;color:#78350f;">' +
    contactHtml + '</div>'
  ));
  rows.push(confirmParagraph_('Děkujeme a těšíme se na vás.<br><strong>Cukrářství Blahutovi</strong>'));
  rows.push('<tr><td style="height:12px;line-height:12px;font-size:0;">&nbsp;</td></tr>');

  // prostý text
  const text = [hello, t.intro, ''];
  facts.forEach(function (f) { text.push(f.label + ': ' + f.text); });
  if (r.lines.length && r.type.key !== 'tisk') {
    text.push('', 'Přehled položek:');
    r.lines.forEach(function (l) {
      text.push('- ' + l.quantity + 'x ' + l.name + (l.lineTotal ? ' – ' + money_(l.lineTotal) : ''));
    });
  } else if (r.itemsText) {
    text.push('', 'Přehled položek:', r.itemsText);
  }
  if (r.note) text.push('', t.noteLabel + ':', r.note);
  text.push('', contactText, '', 'Děkujeme a těšíme se na vás.', 'Cukrářství Blahutovi');
  text.push(CONFIG.ADDRESS + ' · IČO ' + CONFIG.ICO + ' · ' + CONFIG.NOTIFY_EMAIL);

  return { subject: t.subject, html: confirmationShell_(t.title, rows), text: text.join('\n') };
}

/** Potvrzení pro B2B poptávku: profesionální tón a výpis zadaných údajů. */
function buildB2bConfirmation_(r) {
  const subject = 'Děkujeme za váš zájem o spolupráci – Cukrářství Blahutovi';
  const title = 'Děkujeme za váš zájem o spolupráci';
  const p1 = 'děkujeme vám za zájem o spolupráci s Cukrářstvím Blahutovi. Váš zájem nás velmi těší.';
  const p2 = 'Vaši poptávku jsme přijali a co nejdříve se vám ozveme s dalšími informacemi – ' +
    'rádi vás přivítáme mezi našimi novými odběrateli.';
  const dataRows = b2bRows_(r);
  const contactText =
    'Pokud byste cokoli chtěli doplnit nebo upřesnit, stačí odpovědět na tento e-mail ' +
    'nebo nám zavolat na telefon ' + CONFIG.PHONE + '.';

  const rows = [];
  rows.push(confirmParagraph_('Dobrý den,<br>' + esc_(p1) + '<br><br>' + esc_(p2)));
  if (dataRows.length) {
    rows.push(confirmBlock_(sectionTitle_('Údaje z vaší poptávky') + kvTable_(dataRows, false)));
  }
  rows.push(confirmBlock_(
    '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;font-size:14px;line-height:1.55;color:#166534;">' +
    esc_(contactText) + '</div>'
  ));
  rows.push(confirmParagraph_('S pozdravem<br><strong>Cukrářství Blahutovi</strong>'));
  rows.push('<tr><td style="height:12px;line-height:12px;font-size:0;">&nbsp;</td></tr>');

  const text = ['Dobrý den,', p1, '', p2, ''];
  if (dataRows.length) {
    text.push('Údaje z vaší poptávky:');
    dataRows.forEach(function (row) { text.push('- ' + row[0] + ': ' + row[1]); });
    text.push('');
  }
  text.push(contactText, '', 'S pozdravem', 'Cukrářství Blahutovi');
  text.push(CONFIG.ADDRESS + ' · IČO ' + CONFIG.ICO + ' · ' + CONFIG.NOTIFY_EMAIL);

  return { subject: subject, html: confirmationShell_(title, rows), text: text.join('\n') };
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
