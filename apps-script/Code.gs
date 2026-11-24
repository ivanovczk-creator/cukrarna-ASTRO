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
 * Odpověď je vždy JSON { ok: true|false, version, confirmation: sent|skipped|failed|delegated, ... } – vyhodnocuje ji pohoda-webhook.mjs.
 * Kopie objednávky z košíku pro prodejnu: podle pole Prodejna (místo vyzvednutí) se na adresu prodejny z CONFIG.STORE_EMAILS
 * pošle samostatný e-mail s údaji objednávky (bez XML přílohy a bez technických údajů). Ostatní prodejny ji nedostanou.
 * Totéž platí pro jedlý tisk (tisk) a dort na přání (dort-na-prani) – viz CONFIG.STORE_COPY_TYPES.
 * Stav platby je ve všech objednávkových e-mailech jednotně v bloku „Způsob a stav platby“ (paymentState_):
 * ZAPLACENO ONLINE (Comgate) / PLATBA PŘI VYZVEDNUTÍ (na prodejně) / ČEKÁ NA ONLINE PLATBU – NEZAPLACENO.
 * Po výsledku online platby (Comgate) dostane prodejna aktualizaci ve stejné šabloně (ZAPLACENO ONLINE, resp. platba při
 * vyzvednutí, když online platba nebyla dokončena) a po zaplacení i zákazník krátké „Platba přijata“ (každé jen jednou).
 * Test z editoru: funkce testStoreCopy a testStorePaymentNotice.
 * Test z editoru: funkce testConfirmation (bez podtržítka, jinak by nešla spustit).
 */

/** Verze kódu – po nasazení ji uvidíte v odpovědi na GET adresy /exec (kontrola, že běží správná verze). */
const VERSION = '2026-11-22-payment-status-v2';

const CONFIG = {
  NOTIFY_EMAIL: 'objednavky@cukrarstviblahutovi.cz',
  XML_FOLDER_ID: '16X6rwavpSbq27msnCi81ZjtPwSZPxzmp',
  ICO: '76208371',
  RATE_VAT: 'low',
  SENDER_NAME: 'Web – Cukrářství Blahutovi', // interní notifikace
  CUSTOMER_SENDER_NAME: 'Cukrářství Blahutovi', // potvrzení zákazníkům
  // Podoba potvrzení zákazníkovi: 'text' = jen prostý text (nejméně spustí odchozí spam filtr Google),
  // 'html' = barevná HTML šablona + prostý text jako alternativa. Při chybě „Message rejected“ nechte 'text'.
  CUSTOMER_EMAIL_FORMAT: 'text',
  TEST_EMAIL: 'ivanovczk@gmail.com', // příjemce pro testConfirmation() a testDeliverability(); testDeliverability vyžaduje EXTERNÍ adresu
  PHONE: '+420 602 323 788',
  ADDRESS: 'Opavská 218/101, 747 18 Píšť',
  // Kopie objednávky pro prodejnu podle zvoleného místa vyzvednutí (pole Prodejna).
  // Klíč = první slovo názvu prodejny bez diakritiky malými písmeny („Ostrava“ i „Ostrava (Zábřeh)“ → ostrava).
  // Píšť (výrobna) kopii nedostává.
  STORE_EMAILS: {
    petrvald: 'blahutovi.petrvald@cukrarstviblahutovi.cz',
    karvina: 'blahutovi.karvina@cukrarstviblahutovi.cz',
    ostrava: 'blahutovi.ostrava@cukrarstviblahutovi.cz',
  },
  // Pro které typy formulářů (FORM_TYPES[].key) se kopie prodejně posílá.
  STORE_COPY_TYPES: ['objednavka', 'tisk', 'dort-na-prani'],
};

/** Typy formulářů (klíč = form_name z Netlify). */
const FORM_TYPES = {
  'objednavka': { key: 'objednavka', label: 'Objednávka', accent: '#b83b46', xml: true },
  'tisk-na-papir': { key: 'tisk', label: 'Jedlý tisk – fondánový list', accent: '#b83b46', xml: false },
  'dort-na-prani-v2': { key: 'dort-na-prani', label: 'Dort na přání – poptávka', accent: '#b83b46', xml: false },
  'b2b-poptavka': { key: 'b2b', label: 'Poptávka pro firmy', accent: '#b83b46', xml: false },
};
const GENERIC_TYPE = { key: 'jine', label: 'Formulář z webu', accent: '#b83b46', xml: false };

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

/**
 * true = potvrzení zákazníkovi tento skript NEPOŠLE, jen ho sestaví a vrátí v odpovědi (confirmationMail);
 * odešle ho netlify funkce přes externí službu (Resend). Zapíná se parametrem ?mail=external, který
 * pohoda-webhook přidá, když má v Netlify nastavené RESEND_API_KEY. Bez něj posílá potvrzení tento skript sám.
 */
let EXTERNAL_MAIL_ = false;

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    const expectedToken = PropertiesService.getScriptProperties().getProperty('WEBHOOK_TOKEN');
    if (expectedToken && (e.parameter || {}).token !== expectedToken) {
      return json_({ ok: false, error: 'unauthorized' });
    }
    EXTERNAL_MAIL_ = (e.parameter || {}).mail === 'external';

    const parsed = parsePayload_(e);
    if (parsed.test) {
      return json_({ ok: true, test: true, version: VERSION, note: 'nic nezapsáno ani neodesláno' });
    }

    // výsledek online platby z Comgate (posílá netlify/functions/comgate-notify.mjs přes pohoda-webhook)
    if (parsed.src && parsed.src.action === 'payment-update') {
      return json_(Object.assign({ ok: true, version: VERSION, handledForm: 'payment-update' }, handlePaymentUpdate_(parsed.src)));
    }

    // netlify funkce nedokázala odeslat potvrzení přes externí službu → upozorníme obchod (interní e-mail)
    if (parsed.src && parsed.src.action === 'confirmation-failed') {
      return json_(Object.assign({ ok: true, version: VERSION, handledForm: 'confirmation-failed' }, handleConfirmationFailed_(parsed.src)));
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

/**
 * Jednotný popis způsobu a stavu platby pro VŠECHNY objednávkové e-maily (interní, kopie pro prodejnu, aktualizace
 * po platbě i potvrzení zákazníkovi). Stav drží r.paymentStatus:
 *   'PENDING'   online (Comgate) vybráno, platba zatím není potvrzena (stav v okamžiku odeslání objednávky)
 *   'PAID'      online platba potvrzená (push notifikace z Comgate)
 *   'CANCELLED' online platba nedokončena → platí se při převzetí
 *   'CASH'      platba při vyzvednutí na prodejně
 * Vrací null u požadavků bez platby (poptávky: dort na přání, firmy).
 * hi = styl buňky (zelená / žlutá / červená), tag = štítek v předmětu e-mailu.
 */
function paymentState_(r) {
  if (!r || !r.paymentMethod) return null;
  const st = r.paymentStatus || (r.paymentMethod === 'online' ? 'PENDING' : 'CASH');
  if (st === 'PAID') {
    return {
      code: 'paid', hi: 'pay-paid', tag: 'ZAPLACENO ONLINE',
      headline: 'ZAPLACENO ONLINE (Comgate)',
      sub: 'Při převzetí se nic neinkasuje.' + (r.paymentDetail ? ' ' + r.paymentDetail + '.' : ''),
      subCustomer: 'Děkujeme, objednávka je uhrazena – při vyzvednutí už nic neplatíte.',
    };
  }
  if (st === 'PENDING') {
    return {
      code: 'pending', hi: 'pay-wait', tag: 'ČEKÁ NA ONLINE PLATBU',
      headline: 'ČEKÁ NA ONLINE PLATBU – NEZAPLACENO',
      sub: 'Platba kartou zatím není potvrzena – nevydávejte jako zaplaceno. Po úhradě přijde další e-mail „ZAPLACENO ONLINE“.',
      subCustomer: 'Dokončete platbu kartou na stránce platební brány. Nedokončíte-li ji, zaplatíte při vyzvednutí na prodejně.',
    };
  }
  const cancelled = st === 'CANCELLED';
  return {
    code: cancelled ? 'cancelled' : 'cash', hi: 'pay-cash', tag: 'PLATBA PŘI VYZVEDNUTÍ',
    headline: 'PLATBA PŘI VYZVEDNUTÍ (na prodejně)',
    sub: cancelled
      ? 'Online platba nebyla dokončena – vybrat při převzetí na prodejně.'
      : 'Zákazník zaplatí při převzetí na prodejně.',
    subCustomer: cancelled
      ? 'Online platba nebyla dokončena – zaplatíte při převzetí na prodejně.'
      : 'Zaplatíte při převzetí objednávky na prodejně.',
  };
}

/** Štítek stavu platby na začátku předmětu e-mailu, např. „[ZAPLACENO ONLINE] “ (prázdný u poptávek). */
function paymentSubjectTag_(r) {
  const ps = paymentState_(r);
  return ps ? '[' + ps.tag + '] ' : '';
}

/** Barevný informační pruh nad / pod e-mailem (kind: paid | wait | cash | info). */
function noticeBox_(text, kind) {
  const colors = {
    paid: ['#dcfce7', '#16a34a', '#1f1f1f'],
    wait: ['#f6e3e0', '#b83b46', '#1f1f1f'],
    cash: ['#faf7f2', '#ddd4c0', '#1f1f1f'],
    info: ['#faf7f2', '#ddd4c0', '#1f1f1f'],
  };
  const c = colors[kind] || colors.info;
  return '<div style="max-width:680px;margin:0 auto 10px auto;padding:12px 16px;background:' + c[0] + ';border:1px solid ' + c[1] + ';' +
    "border-radius:8px;font-family:'Segoe UI',Roboto,Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:" + c[2] + ';">' +
    esc_(text) + '</div>';
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

  const order = orderFromXml_(xml, status, p);
  const paid = status === 'PAID';
  const cache = CacheService.getScriptCache();
  const key = 'pay:' + orderId + ':' + status;
  let emailed = false;
  if (!cache.get(key)) {
    const intro = paid
      ? 'Zákazník zaplatil objednávku online kartou přes Comgate – při převzetí se nic neinkasuje.'
      : 'Online platba nebyla dokončena (zrušena / nezdařila se). Objednávka zůstává v systému – platba proběhne při vyzvednutí na prodejně, případně se domluvte se zákazníkem.';
    const hint = 'XML objednávky na Disku (' + orderId + '.xml) bylo aktualizováno: poznámka „Platba: …“ a značka v textu objednávky. ' +
      'Pokud už byla objednávka naimportována do Pohody před úhradou, upravte poznámku ručně.';
    MailApp.sendEmail({
      to: CONFIG.NOTIFY_EMAIL,
      subject: buildPaymentUpdateSubject_(order),
      body: intro + '\n\n' + buildEmailText_(order, null) + '\n\n' + hint,
      htmlBody: noticeBox_(intro, paid ? 'paid' : 'cash') + buildEmailHtml_(order, null) + noticeBox_(hint, 'info'),
      name: CONFIG.SENDER_NAME,
    });
    cache.put(key, '1', 21600);
    emailed = true;
  }

  // prodejna, u které si zákazník objednávku vyzvedne, se dozví výsledek platby (ZAPLACENO / platba při vyzvednutí), vždy jednou
  const storeNotice = sendStorePaymentNotice_(file, xml, p, undefined, status);

  const result = { orderId: orderId, payment: status, xmlUpdated: true, emailed: emailed, storeNotice: storeNotice.status };
  // zákazník dostal při odeslání objednávky e-mail „ČEKÁ NA ONLINE PLATBU“ → po zaplacení mu pošleme „Platba přijata“
  // (při Resendu ho odešle pohoda-webhook podle polí confirmation/confirmationMail v této odpovědi)
  if (paid) Object.assign(result, confirmationResult_(sendCustomerPaymentConfirmation_(file, order)));
  return result;
}

/** Značka v popisu XML souboru: zákazník už dostal e-mail „Platba přijata“. */
const CUSTOMER_PAID_MARK = 'CUSTOMER_PAID_NOTIFIED';

/** Pošle zákazníkovi „Platba přijata“ (jednou na objednávku). Nikdy nevyhazuje výjimku. */
function sendCustomerPaymentConfirmation_(file, order) {
  const cache = CacheService.getScriptCache();
  const key = 'paycust:' + order.orderId;
  try {
    const marked = file && String(file.getDescription() || '').indexOf(CUSTOMER_PAID_MARK) !== -1;
    if (marked || cache.get(key)) return { status: 'skipped', reason: 'duplicate' };
  } catch (err) { /* hlídání duplicit je jen pojistka */ }

  const res = sendCustomerConfirmation_(Object.assign({}, order, { mailKind: 'paid' }));
  if (res.status === 'sent' || res.status === 'delegated') {
    cache.put(key, '1', 21600);
    try {
      if (file) file.setDescription((String(file.getDescription() || '') + ' ' + CUSTOMER_PAID_MARK).trim());
    } catch (err) { /* cache už duplicitu hlídá */ }
  }
  return res;
}

/** Předmět interního e-mailu po výsledku online platby. */
function buildPaymentUpdateSubject_(o) {
  return (o.paymentStatus === 'PAID' ? 'ZAPLACENO ONLINE – ' : 'ONLINE PLATBA NEDOKONČENA – ') +
    o.name + ' – ' + o.type.label + ' ' + o.orderId +
    (o.store ? ' – ' + o.store : '') +
    (o.date ? ' (' + o.date + ')' : '');
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
    paymentStatus: '',
    paymentDetail: '',
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

  // platba: jen objednávky s cenou (košík, jedlý tisk). Online (Comgate) startuje jako PENDING – v okamžiku
  // odeslání formuláře ještě není zaplaceno, výsledek přijde později (handlePaymentUpdate_). Poptávky (dort na přání,
  // firmy) platbu nemají.
  const paymentRaw = pick_(d, ['Zpusob-Platby'], used).toLowerCase();
  if (type.key === 'objednavka' || type.key === 'tisk') {
    req.paymentMethod = paymentRaw.indexOf('online') !== -1 ? 'online' : 'cash';
    req.paymentLabel = req.paymentMethod === 'online' ? 'Online kartou (Comgate)' : 'Při převzetí';
    req.paymentStatus = req.paymentMethod === 'online' ? 'PENDING' : 'CASH';
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

/**
 * Do e-mailu zákazníkovi se vrací text, který zadal sám zákazník (jméno, poznámka, seznam položek).
 * Odkazy v něm odstraníme – odchozí spam filtr Google je u automatických e-mailů s cizími URL podezřívavý.
 */
function defang_(v) {
  return String(v == null ? '' : v).replace(/(?:https?:\/\/|www\.)\S+/gi, '[odkaz odstraněn]');
}

function defangForCustomer_(r) {
  return Object.assign({}, r, {
    name: defang_(r.name),
    company: defang_(r.company),
    note: defang_(r.note),
    itemsText: defang_(r.itemsText),
  });
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
    paymentSubjectTag_(r) +
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
  let bg = '#faf7f2';
  let border = '#ebe4d6';
  let color = '#1f1f1f';
  let labelColor = '#1f1f1f';
  let size = '15px';
  if (fact.hi === 'price') { color = '#1f1f1f'; size = '20px'; }
  if (fact.hi === 'date') { color = '#1f1f1f'; size = '17px'; }
  // způsob a stav platby: zelená = zaplaceno, žlutá = při vyzvednutí, červená = čeká na online platbu
  if (fact.hi === 'pay-paid') { bg = '#dcfce7'; border = '#16a34a'; color = '#1f1f1f'; labelColor = '#1f1f1f'; }
  if (fact.hi === 'pay-cash') { bg = '#ffffff'; border = '#d49a96'; }
  if (fact.hi === 'pay-wait') { bg = '#f6e3e0'; border = '#b83b46'; color = '#1f1f1f'; labelColor = '#1f1f1f'; }
  const sub = fact.sub
    ? '<div style="font-size:12px;font-weight:400;line-height:1.45;margin-top:6px;color:' + color + ';">' + esc_(fact.sub) + '</div>'
    : '';
  return (
    '<td width="50%" valign="top" style="padding:12px 14px;background:' + bg + ';border:1px solid ' + border + ';border-radius:10px;">' +
    '<div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:' + labelColor + ';margin-bottom:4px;">' + esc_(fact.label) + '</div>' +
    '<div style="font-size:' + size + ';font-weight:700;color:' + color + ';word-break:break-word;">' + fact.html + '</div>' +
    sub +
    '</td>'
  );
}

function buildFacts_(r) {
  const facts = [];
  const link = function (href, text) {
    return '<a href="' + esc_(href) + '" style="color:inherit;text-decoration:none;border-bottom:1px dotted #1f1f1f;">' + esc_(text) + '</a>';
  };

  // cena a způsob/stav platby vždy vedle sebe (první řádek)
  if (r.total) facts.push({ label: 'Cena celkem', html: esc_(money_(r.total)), hi: 'price' });
  const ps = paymentState_(r);
  if (ps) facts.push({ label: 'Způsob a stav platby', html: esc_(ps.headline), sub: ps.sub, hi: ps.hi });
  if (r.date) facts.push({ label: 'Termín vyzvednutí', html: esc_(formatDate_(r.date)), hi: 'date' });
  if (r.store) facts.push({ label: 'Prodejna', html: esc_(r.store) });
  if (r.location) facts.push({ label: 'Lokalita závozu', html: esc_(r.location) });
  if (r.quantity) facts.push({ label: 'Počet kusů', html: esc_(r.quantity) + '\u00a0ks' });
  if (r.company) facts.push({ label: 'Firma', html: esc_(r.company) + (r.ico ? ' <span style="font-weight:400;color:#1f1f1f;">(IČO ' + esc_(r.ico) + ')</span>' : '') });
  else if (r.ico) facts.push({ label: 'IČO', html: esc_(r.ico) });
  if (r.email) facts.push({ label: 'E-mail', html: link('mailto:' + r.email, r.email) });
  if (r.phone) facts.push({ label: 'Telefon', html: link('tel:' + r.phone.replace(/\s+/g, ''), r.phone) });
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
  return '<div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;color:#1f1f1f;margin:0 0 10px 0;">' + esc_(text) + '</div>';
}

function linesTable_(r) {
  const th = 'padding:10px 12px;border-bottom:2px solid #ddd4c0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#1f1f1f;';
  const td = 'padding:10px 12px;border-bottom:1px solid #ebe4d6;font-size:14px;';
  const showCat = r.categories.length > 1;

  const rows = r.lines.map(function (l) {
    return (
      '<tr>' +
      '<td style="' + td + '"><strong>' + esc_(l.name) + '</strong>' +
      (showCat ? '<div style="font-size:11px;color:#1f1f1f;margin-top:2px;">' + esc_(categoryLabel_(l.category)) + '</div>' : '') +
      '</td>' +
      '<td style="' + td + 'text-align:center;white-space:nowrap;">' + l.quantity + '\u00a0ks</td>' +
      '<td style="' + td + 'text-align:right;white-space:nowrap;">' + (l.unitPrice ? esc_(money_(l.unitPrice)) : '–') + '</td>' +
      '<td style="' + td + 'text-align:right;white-space:nowrap;"><strong>' + (l.lineTotal ? esc_(money_(l.lineTotal)) : '–') + '</strong></td>' +
      '</tr>'
    );
  }).join('');

  const totalRow = r.total
    ? '<tr><td colspan="3" style="padding:12px;text-align:right;font-size:13px;color:#1f1f1f;">Celkem s DPH</td>' +
      '<td style="padding:12px;text-align:right;font-size:16px;font-weight:700;white-space:nowrap;color:#1f1f1f;">' + esc_(money_(r.total)) + '</td></tr>'
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
  const color = small ? '#1f1f1f' : '#1f1f1f';
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' +
    rows.map(function (row) {
      return (
        '<tr>' +
        '<td valign="top" style="padding:5px 12px 5px 0;font-size:' + fs + ';color:#1f1f1f;white-space:nowrap;width:1%;">' + esc_(row[0]) + '</td>' +
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
        return '<span style="display:inline-block;margin:0 6px 4px 0;padding:3px 10px;border-radius:999px;background:rgba(31,31,31,0.10);color:#1f1f1f;font-size:12px;font-weight:600;">' + esc_(categoryLabel_(c)) + '</span>';
      }).join('') + '</div>'
    : '';

  const header =
    '<tr><td style="background:#d49a96;padding:22px 28px 20px 28px;">' +
    '<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#1f1f1f;margin-bottom:12px;">Cukrářství Blahutovi · web</div>' +
    '<span style="display:inline-block;background:' + accent + ';color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:5px 12px;border-radius:6px;">' + esc_(r.type.label) + '</span>' +
    '<div style="font-size:26px;line-height:1.25;font-weight:700;color:#1f1f1f;margin-top:14px;">' + esc_(r.name) + '</div>' +
    (r.orderId ? '<div style="font-size:14px;font-weight:600;color:#1f1f1f;margin-top:4px;">Objednávka č. ' + esc_(r.orderId) + '</div>' : '') +
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
      '<div style="background:#faf7f2;border-left:4px solid ' + accent + ';border-radius:4px;padding:14px 16px;font-size:15px;line-height:1.55;white-space:pre-wrap;">' + esc_(r.note) + '</div>'
    ));
  }

  if (r.links.length) {
    const buttons = r.links.map(function (l) {
      return (
        '<div style="margin:0 0 12px 0;">' +
        '<a href="' + esc_(l.url) + '" target="_blank" style="display:inline-block;background:' + accent + ';color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:13px 22px;border-radius:8px;">' + esc_(l.label) + ' &rarr;</a>' +
        '<div style="font-size:11px;color:#1f1f1f;margin-top:5px;word-break:break-all;">' + esc_(l.url) + '</div>' +
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
      '<div style="background:#faf7f2;border:1px solid #ddd4c0;border-radius:8px;padding:10px 14px;font-size:13px;color:#1f1f1f;">' +
      'XML pro Pohodu <code>' + esc_(xmlInfo.fileName) + '</code> je uložené na Google Disku a přiložené k tomuto e-mailu.</div>'
    ));
  }

  const tech = r.tech.length
    ? '<tr><td style="padding:16px 28px 22px 28px;background:#faf7f2;border-top:1px solid #ebe4d6;">' +
      '<div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#1f1f1f;margin-bottom:6px;">Technické údaje</div>' +
      kvTable_(r.tech, true) +
      '</td></tr>'
    : '';

  return (
    '<div style="margin:0;padding:24px 12px;background:#f4efe6;' + font + 'color:#1f1f1f;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #ddd4c0;">' +
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
  const ps = paymentState_(r);
  if (ps) {
    lines.push('ZPŮSOB A STAV PLATBY: ' + ps.headline);
    lines.push('  (' + ps.sub + ')');
  }

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
  let mail = null;

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

      if (EXTERNAL_MAIL_) {
        // odešle netlify funkce přes externí službu; tady jen předáme hotový obsah (HTML + prostý text)
        status = 'delegated';
        mail = {
          to: r.email,
          subject: content.subject,
          text: content.text,
          html: content.html,
          fromName: CONFIG.CUSTOMER_SENDER_NAME,
          replyTo: CONFIG.NOTIFY_EMAIL,
          // jen pro upozornění obchodu, kdyby odeslání selhalo
          customerName: r.name,
          typeLabel: r.mailKind === 'paid' ? 'Potvrzení platby' : r.type.label,
          orderId: r.orderId || '',
          kind: r.mailKind || 'confirmation',
        };
      } else {
        const options = {
          to: r.email,
          subject: content.subject,
          body: content.text,
          name: CONFIG.CUSTOMER_SENDER_NAME,
          replyTo: CONFIG.NOTIFY_EMAIL,
        };
        if (CONFIG.CUSTOMER_EMAIL_FORMAT === 'html') options.htmlBody = content.html;
        MailApp.sendEmail(options);
      }
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

  return { status: status, reason: reason, mail: mail };
}

/**
 * Pole pro JSON odpověď: confirmation = sent | skipped | failed | delegated, confirmationReason = důvod (pokud je),
 * confirmationMail = hotová zpráva k odeslání přes externí službu (jen při status 'delegated').
 */
function confirmationResult_(res) {
  return {
    confirmation: res.status,
    confirmationReason: res.reason || undefined,
    confirmationMail: res.mail || undefined,
  };
}

/** Netlify funkce hlásí, že potvrzení přes externí službu selhalo → upozornění na NOTIFY_EMAIL. */
function handleConfirmationFailed_(src) {
  const cut = function (v, n) { return String(v == null ? '' : v).slice(0, n); };
  notifyConfirmationFailure_({
    name: cut(src.name, 120) || '(neznámý)',
    email: cut(src.email, 200),
    type: { label: cut(src.type, 60) || 'objednávka' },
    orderId: cut(src.orderId, 40),
  }, cut(src.reason, 300) || 'neuvedeno');
  return { alerted: true };
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

/**
 * Diagnostika chyby „Message rejected“ (Gmail → Email Log Search): pošle na EXTERNÍ adresu (CONFIG.TEST_EMAIL,
 * např. váš soukromý Gmail) tři zprávy od nejjednodušší po nejbohatší a vždy mezi nimi počká 20 s:
 *   A) jedna věta prostého textu            → když selže i A, je omezení na úrovni účtu / domény (ne obsah)
 *   B) skutečné potvrzení jako prostý text   → když projde A, ale selže B, vadí obsah (slova, údaje)
 *   C) skutečné potvrzení jako bohaté HTML   → když projde B, ale selže C, vadí HTML šablona
 * Výsledek každé zprávy pak zkontrolujte v Admin konzoli → Reporting → Email Log Search (příjemce = testovací adresa).
 * Spouští se z editoru (Spustit → testDeliverability).
 */
function testDeliverability() {
  const FALLBACK_EXTERNAL = 'ivanovczk@gmail.com';
  const domainOf = function (a) { return String(a).toLowerCase().split('@')[1]; };
  let to = CONFIG.TEST_EMAIL;
  // Prázdná, neplatná nebo vlastní (interní) adresa → použij externí náhradní, ať se odchozí filtr skutečně uplatní.
  if (!to || !isEmail_(to) || domainOf(to) === domainOf(CONFIG.NOTIFY_EMAIL)) {
    to = FALLBACK_EXTERNAL;
  }

  console.log('Odesílatel: ' + Session.getEffectiveUser().getEmail() + ' | příjemce: ' + maskEmail_(to) +
    ' | kvóta: ' + MailApp.getRemainingDailyQuota() + ' | verze: ' + VERSION);

  const sample = normalizeRequest_({
    raw: '', src: {}, formName: 'objednavka', submissionId: 'test-deliverability',
    data: {
      'form-name': 'objednavka',
      Jmeno: 'Test Zákazník', Email: to, Telefon: '602 000 000', Prodejna: 'Píšť',
      Datum: Utilities.formatDate(new Date(Date.now() + 7 * 86400000), 'Europe/Prague', 'yyyy-MM-dd'),
      'Cislo-Objednavky': 'TEST-0002', 'Zpusob-Platby': 'cash', 'Celkem-Kc': '540',
      'Produkty-JSON': JSON.stringify([
        { name: 'Větrník', price: 70, quantity: 3, category: 'zakusky' },
        { name: 'Punčový řez', price: 65, quantity: 2, category: 'zakusky' },
      ]),
      Poznamka: 'Testovací zpráva z testDeliverability – ignorujte.',
    },
  });
  const content = buildStandardConfirmation_(sample);

  const variants = [
    { id: 'A', note: 'jedna věta prostého textu', send: function () {
      MailApp.sendEmail({ to: to, subject: '[test A/3] Cukrářství Blahutovi – kontrola doručení', body: 'Dobrý den, toto je zkušební zpráva z objednávkového systému. Prosím ignorujte ji.', name: CONFIG.CUSTOMER_SENDER_NAME });
    } },
    { id: 'B', note: 'potvrzení – prostý text', send: function () {
      MailApp.sendEmail({ to: to, subject: '[test B/3] ' + content.subject, body: content.text, name: CONFIG.CUSTOMER_SENDER_NAME, replyTo: CONFIG.NOTIFY_EMAIL });
    } },
    { id: 'C', note: 'potvrzení – bohaté HTML', send: function () {
      MailApp.sendEmail({ to: to, subject: '[test C/3] ' + content.subject, body: content.text, htmlBody: content.html, name: CONFIG.CUSTOMER_SENDER_NAME, replyTo: CONFIG.NOTIFY_EMAIL });
    } },
  ];

  const results = [];
  variants.forEach(function (v, i) {
    try {
      v.send();
      results.push(v.id + ' (' + v.note + '): odesláno');
    } catch (err) {
      results.push(v.id + ' (' + v.note + '): CHYBA ' + err);
    }
    if (i < variants.length - 1) Utilities.sleep(20000);
  });
  console.log('Výsledek: ' + results.join(' | ') + ' → nyní zkontrolujte Email Log Search (které z A/B/C bylo „Message rejected“).');
  return results;
}

/** Texty podle typu požadavku (předmět, nadpis, úvod). */
function confirmationTexts_(r) {
  const brand = 'Cukrářství Blahutovi';
  if (r.mailKind === 'paid') {
    return {
      subject: 'Platba přijata – objednávka' + (r.orderId ? ' č. ' + r.orderId : '') + ' – ' + brand,
      title: 'Děkujeme, platbu jsme přijali',
      intro: 'Vaši online platbu kartou jsme v pořádku přijali. Objednávka je uhrazena – při vyzvednutí už nic neplatíte.',
      noteLabel: 'Vaše poznámka',
    };
  }
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
  if (r.total) facts.push({ label: 'Cena celkem', text: money_(r.total), hi: 'price' });
  const ps = paymentState_(r);
  if (ps) facts.push({ label: 'Způsob a stav platby', text: ps.headline, sub: ps.subCustomer, hi: ps.hi });
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
    '<tr><td style="background:#d49a96;padding:26px 28px 22px 28px;">' +
    '<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#1f1f1f;margin-bottom:12px;">Cukrářství Blahutovi</div>' +
    '<div style="font-size:26px;line-height:1.25;font-weight:700;color:#1f1f1f;">' + esc_(title) + '</div>' +
    '</td></tr>' +
    '<tr><td style="height:4px;line-height:4px;font-size:0;background:#b83b46;">&nbsp;</td></tr>';

  const footer =
    '<tr><td style="padding:16px 28px 22px 28px;background:#faf7f2;border-top:1px solid #ebe4d6;font-size:12px;line-height:1.6;color:#1f1f1f;">' +
    '<strong style="color:#1f1f1f;">Cukrářství Blahutovi</strong> · Ivo Blahut · ' + esc_(CONFIG.ADDRESS) + ' · IČO ' + esc_(CONFIG.ICO) + '<br>' +
    'Tel. <a href="tel:' + esc_(CONFIG.PHONE.replace(/\s+/g, '')) + '" style="color:#1f1f1f;">' + esc_(CONFIG.PHONE) + '</a> · ' +
    '<a href="mailto:' + esc_(CONFIG.NOTIFY_EMAIL) + '" style="color:#1f1f1f;">' + esc_(CONFIG.NOTIFY_EMAIL) + '</a><br>' +
    '<span style="color:#1f1f1f;">Tento e-mail vznikl automaticky po odeslání formuláře na webu cukrarstviblahutovi.cz.</span>' +
    '</td></tr>';

  return (
    '<div style="margin:0;padding:24px 12px;background:#f4efe6;' + font + 'color:#1f1f1f;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #ddd4c0;">' +
    header + bodyRows.join('') + footer +
    '</table></div>'
  );
}

function confirmParagraph_(text) {
  return '<tr><td style="padding:18px 28px 6px 28px;font-size:15px;line-height:1.6;color:#1f1f1f;">' + text + '</td></tr>';
}

function confirmBlock_(inner) {
  return '<tr><td style="padding:6px 28px 18px 28px;">' + inner + '</td></tr>';
}

/** Potvrzení pro ostatní typy: košík, tisk, dort na přání i obecné formuláře. */
function buildStandardConfirmation_(req) {
  const r = defangForCustomer_(req);
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
      return { label: f.label, html: esc_(f.text), sub: f.sub, hi: f.hi };
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
      '<div style="background:#faf7f2;border-left:4px solid #b83b46;border-radius:4px;padding:14px 16px;font-size:15px;line-height:1.55;white-space:pre-wrap;">' + esc_(r.note) + '</div>'
    ));
  }
  rows.push(confirmBlock_(
    '<div style="background:#faf7f2;border:1px solid #ddd4c0;border-radius:8px;padding:12px 16px;font-size:14px;line-height:1.55;color:#1f1f1f;">' +
    contactHtml + '</div>'
  ));
  rows.push(confirmParagraph_('Děkujeme a těšíme se na vás.<br><strong>Cukrářství Blahutovi</strong>'));
  rows.push('<tr><td style="height:12px;line-height:12px;font-size:0;">&nbsp;</td></tr>');

  // prostý text
  const text = [hello, t.intro, ''];
  facts.forEach(function (f) { text.push(f.label + ': ' + f.text + (f.sub ? ' (' + f.sub + ')' : '')); });
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
function buildB2bConfirmation_(req) {
  const r = defangForCustomer_(req);
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
    '<div style="background:#faf7f2;border:1px solid #ddd4c0;border-radius:8px;padding:12px 16px;font-size:14px;line-height:1.55;color:#1f1f1f;">' +
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

  // kopie pro prodejnu až po interním e-mailu; její selhání zpracování objednávky neshodí
  sendStoreCopy_(r);
}

// ---------------------------------------------------------------------------------------------
// Kopie objednávky pro prodejnu
// ---------------------------------------------------------------------------------------------

/** Klíč prodejny pro CONFIG.STORE_EMAILS: „Ostrava (Zábřeh)“ → ostrava, „Petřvald“ → petrvald, „Karviná“ → karvina. */
function storeKey_(store) {
  const plain = String(store || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z]+/g, ' ').trim();
  return plain.split(' ')[0] || '';
}

/**
 * Pošle kopii objednávky na e-mail prodejny, kterou zákazník zvolil jako místo vyzvednutí.
 * Nikdy nevyhazuje výjimku. Vrací { status: 'sent' | 'skipped' | 'failed', reason, to } a zapíše výsledek do logu.
 * @param {Object} r normalizovaný požadavek
 * @param {string=} overrideTo jen pro test: pošle se sem místo na adresu prodejny
 */
function sendStoreCopy_(r, overrideTo) {
  const result = function (status, reason, to) {
    console.log('Kopie pro prodejnu: ' + status + (reason ? ' (' + reason + ')' : '') +
      ' | objednávka: ' + (r.orderId || '-') + ' | prodejna: ' + (r.store || '(prázdná)') + (to ? ' | ' + maskEmail_(to) : ''));
    return { status: status, reason: reason || '', to: to || '' };
  };

  try {
    if (CONFIG.STORE_COPY_TYPES.indexOf(r.type.key) === -1) return result('skipped', 'typ formuláře ' + r.type.key);

    const to = overrideTo || CONFIG.STORE_EMAILS[storeKey_(r.store)];
    if (!to) return result('skipped', 'prodejna nemá e-mail pro kopii');

    // bez technických údajů (IP, user agent, …) a bez XML přílohy – prodejna dostane jen údaje objednávky
    const copy = Object.assign({}, r, { tech: [] });
    const ps = paymentState_(r);
    const waiting = !!ps && ps.code === 'pending';
    const intro = 'Kopie: ' + r.type.label + ' – prodejna ' + (r.store || '') + '. Zákazník si ji vyzvedne u vás. ' +
      'Požadavek zpracovává centrála, tento e-mail je pro informaci a přípravu.' +
      (waiting ? ' Online platba zatím NENÍ potvrzena – o výsledku vás budeme informovat dalším e-mailem.' : '');

    const options = {
      to: to,
      subject: 'Kopie pro prodejnu ' + (r.store || '') + ': ' + buildSubject_(r),
      body: intro + '\n\n' + buildEmailText_(copy, null),
      htmlBody: noticeBox_(intro, waiting ? 'wait' : 'info') + buildEmailHtml_(copy, null),
      name: CONFIG.SENDER_NAME,
    };
    if (isEmail_(r.email)) options.replyTo = r.email;

    MailApp.sendEmail(options);
    return result('sent', '', to);
  } catch (err) {
    console.error('Kopie pro prodejnu SELHALA: ' + (err && err.stack ? err.stack : err));
    return result('failed', String(err && err.message ? err.message : err));
  }
}

/** Značky v popisu XML souboru na Disku: upozornění prodejně už bylo odesláno (ochrana proti duplicitě i po 6 h cache). */
const STORE_PAID_MARK = 'STORE_PAID_NOTIFIED';
const STORE_CANCEL_MARK = 'STORE_CANCEL_NOTIFIED';

function unx_(v) {
  return String(v == null ? '' : v)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

/** Z XML objednávky (buildPohodaXml_) vyčte prodejnu, zákazníka, termín, poznámku a položky. */
function parseOrderFromXml_(xml) {
  const tag = function (name, scope) {
    const m = new RegExp('<' + name + '>([^<]*)</' + name + '>').exec(scope);
    return m ? unx_(m[1]) : '';
  };
  const parts = String(xml).split('<ord:orderDetail>');
  const header = parts[0];
  const detail = parts[1] || '';

  // hlavička: „Web objednávka BL-… – Karviná [ZAPLACENO ONLINE]“
  const headText = tag('ord:text', header);
  const sm = /^Web objednávka \S+ – (.*?)(?: \[[^\]]*\])?$/.exec(headText);

  // poznámka: „Platba: … | poznámka zákazníka“
  const nm = /^Platba: (.*?)(?: \| ([\s\S]*))?$/.exec(tag('ord:note', header));

  const lines = [];
  const itemRe = /<ord:orderItem>([\s\S]*?)<\/ord:orderItem>/g;
  let m;
  while ((m = itemRe.exec(detail)) !== null) {
    const quantity = Number(tag('ord:quantity', m[1])) || 0;
    const unitPrice = Number(tag('typ:unitPrice', m[1])) || 0;
    lines.push({ name: tag('ord:text', m[1]), quantity: quantity, unitPrice: unitPrice, lineTotal: quantity * unitPrice });
  }

  return {
    orderId: tag('ord:numberOrder', header),
    store: sm ? sm[1].trim() : '',
    name: tag('typ:name', header),
    phone: tag('typ:mobilPhone', header),
    email: tag('typ:email', header),
    date: tag('ord:dateDelivery', header),
    note: nm && nm[2] ? nm[2] : '',
    lines: lines,
    total: lines.reduce(function (sum, l) { return sum + l.lineTotal; }, 0),
  };
}

/**
 * Z XML objednávky složí požadavek ve stejném tvaru jako normalizeRequest_, takže e-maily po platbě
 * (interní i pro prodejnu) používají stejnou šablonu a stejné názvy polí jako e-maily při vzniku objednávky.
 * @param {string} xml obsah XML objednávky
 * @param {string} status 'PAID' | 'CANCELLED'
 * @param {Object} p údaje o platbě { transId, test }
 */
function orderFromXml_(xml, status, p) {
  p = p || {};
  const o = parseOrderFromXml_(xml);
  const detail = status === 'PAID'
    ? [p.transId ? 'Transakce ' + p.transId : '', p.test ? 'TESTOVACÍ PLATBA' : ''].filter(function (s) { return s; }).join(', ')
    : '';
  const lines = o.lines.map(function (l) { return Object.assign({ category: 'objednavka' }, l); });
  return {
    formName: 'objednavka',
    type: FORM_TYPES['objednavka'],
    submissionId: '',
    name: o.name || 'Zákazník',
    company: '',
    ico: '',
    email: o.email,
    phone: o.phone,
    store: o.store,
    location: '',
    date: o.date,
    note: o.note,
    orderId: o.orderId,
    paymentMethod: 'online',
    paymentLabel: 'Online kartou (Comgate)',
    paymentStatus: status,
    paymentDetail: detail,
    total: o.total,
    quantity: lines.reduce(function (s, l) { return s + l.quantity; }, 0),
    lines: lines,
    categories: [],
    itemsText: '',
    baseType: '',
    links: [],
    extras: [],
    tech: [],
  };
}

/**
 * Po výsledku online platby pošle prodejně aktualizaci ve stejné šabloně jako kopii objednávky:
 *   PAID      → „ZAPLACENO ONLINE (Comgate)“ – při výdeji se neinkasuje
 *   CANCELLED → „PLATBA PŘI VYZVEDNUTÍ (na prodejně)“ – online platba nedokončena, vybrat na místě
 * Nikdy nevyhazuje výjimku. Duplicitu hlídá cache (6 h) i značka v popisu XML souboru (trvale), zvlášť pro každý stav.
 * @param {GoogleAppsScript.Drive.File|null} file XML objednávky (null jen v testu)
 * @param {string} xml aktuální obsah XML
 * @param {Object} p údaje o platbě { orderId, amount (v haléřích), transId, test }
 * @param {string=} overrideTo jen pro test: pošle se sem a duplicita se nehlídá
 * @param {string=} status 'PAID' (výchozí) | 'CANCELLED'
 */
function sendStorePaymentNotice_(file, xml, p, overrideTo, status) {
  status = status || 'PAID';
  const paid = status === 'PAID';
  const mark = paid ? STORE_PAID_MARK : STORE_CANCEL_MARK;
  const orderId = String(p.orderId || '');
  const result = function (st, reason, to) {
    console.log('Upozornění prodejně o platbě (' + status + '): ' + st + (reason ? ' (' + reason + ')' : '') +
      ' | objednávka: ' + orderId + (to ? ' | ' + maskEmail_(to) : ''));
    return { status: st, reason: reason || '', to: to || '' };
  };

  try {
    if (!overrideTo && p.test) return result('skipped', 'testovací platba');

    const order = orderFromXml_(xml, status, p);
    const to = overrideTo || CONFIG.STORE_EMAILS[storeKey_(order.store)];
    if (!to) return result('skipped', 'prodejna "' + order.store + '" nemá e-mail pro kopii');

    const cache = CacheService.getScriptCache();
    const key = 'paystore:' + orderId + ':' + status;
    if (!overrideTo) {
      const marked = file && String(file.getDescription() || '').indexOf(mark) !== -1;
      if (marked || cache.get(key)) return result('skipped', 'duplicate', to);
    }

    const headline = paid
      ? 'ZAPLACENO ONLINE kartou – při převzetí se nic neinkasuje.'
      : 'Online platba nebyla dokončena – zákazník zaplatí při vyzvednutí na prodejně.';
    const intro = 'Aktualizace platby: ' + headline;

    MailApp.sendEmail({
      to: to,
      subject: (paid ? 'ZAPLACENO ONLINE – ' : 'PLATBA PŘI VYZVEDNUTÍ (online nedokončena) – ') +
        'Objednávka ' + orderId + (order.store ? ' – ' + order.store : ''),
      body: intro + '\n\n' + buildEmailText_(order, null),
      htmlBody: noticeBox_(intro, paid ? 'paid' : 'cash') + buildEmailHtml_(order, null),
      name: CONFIG.SENDER_NAME,
    });

    if (!overrideTo) {
      cache.put(key, '1', 21600);
      if (file) file.setDescription((String(file.getDescription() || '') + ' ' + mark).trim());
    }
    return result('sent', '', to);
  } catch (err) {
    console.error('Upozornění prodejně o platbě SELHALO: ' + (err && err.stack ? err.stack : err));
    try {
      MailApp.sendEmail({
        to: CONFIG.NOTIFY_EMAIL,
        subject: 'Upozornění prodejně o výsledku platby se nepodařilo odeslat – ' + orderId,
        body: 'U objednávky ' + orderId + ' (' + (paid ? 'zaplaceno online' : 'online platba nedokončena') +
          ') se nepodařilo odeslat upozornění prodejně (' + String(err && err.message ? err.message : err) + '). Dejte prodejně vědět ručně.',
        name: CONFIG.SENDER_NAME,
      });
    } catch (e2) { /* už nic neděláme */ }
    return result('failed', String(err && err.message ? err.message : err));
  }
}

/**
 * Test z editoru Apps Script (vyberte funkci „testStorePaymentNotice“ a dejte Spustit).
 * Pošle ukázkové upozornění „ZAPLACENO ONLINE“ pro prodejnu Karviná na CONFIG.TEST_EMAIL.
 */
function testStorePaymentNotice() {
  const to = CONFIG.TEST_EMAIL || CONFIG.NOTIFY_EMAIL;
  const sample = {
    form_name: 'objednavka',
    id: 'test-store-paid',
    data: {
      Jmeno: 'Test Zákazník', Email: to, Telefon: '602 000 000', Prodejna: 'Karviná',
      Datum: Utilities.formatDate(new Date(Date.now() + 7 * 86400000), 'Europe/Prague', 'yyyy-MM-dd'),
      'Cislo-Objednavky': 'TEST-0003', 'Zpusob-Platby': 'online', 'Celkem-Kc': '410',
      'Produkty-JSON': JSON.stringify([
        { name: 'Větrník', price: 70, quantity: 3, category: 'zakusky' },
        { name: 'Punčový řez', price: 100, quantity: 2, category: 'zakusky' },
      ]),
    },
  };
  const req = normalizeRequest_({ raw: '', src: sample, data: sample.data, formName: sample.form_name, submissionId: sample.id });
  const xml = buildPohodaXml_(req);
  const res = sendStorePaymentNotice_(null, xml, { orderId: 'TEST-0003', amount: 41000 }, to);
  console.log('Výsledek testu: ' + res.status + (res.reason ? ' (' + res.reason + ')' : ''));
  return res;
}

/**
 * Test z editoru Apps Script (vyberte funkci „testStoreCopy“ a dejte Spustit).
 * Pošle ukázkovou kopii objednávky pro prodejnu Karviná na CONFIG.TEST_EMAIL (ne na skutečnou prodejnu)
 * a vypíše do protokolu, na jaké adresy by se kopie posílala pro jednotlivé názvy prodejen.
 */
function testStoreCopy() {
  const to = CONFIG.TEST_EMAIL || CONFIG.NOTIFY_EMAIL;
  ['Petřvald', 'Karviná', 'Ostrava', 'Ostrava (Zábřeh)', 'Píšť'].forEach(function (name) {
    console.log(name + ' → ' + (CONFIG.STORE_EMAILS[storeKey_(name)] || '(bez kopie)'));
  });

  const sample = {
    form_name: 'objednavka',
    id: 'test-store-copy',
    data: {
      Jmeno: 'Test Zákazník', Email: to, Telefon: '602 000 000', Prodejna: 'Karviná',
      Datum: Utilities.formatDate(new Date(Date.now() + 7 * 86400000), 'Europe/Prague', 'yyyy-MM-dd'),
      'Cislo-Objednavky': 'TEST-0002', 'Zpusob-Platby': 'cash', 'Celkem-Kc': '540',
      'Produkty-JSON': JSON.stringify([
        { name: 'Větrník', price: 70, quantity: 3, category: 'zakusky' },
        { name: 'Punčový řez', price: 65, quantity: 2, category: 'zakusky' },
        { name: 'Zápich – ukázka', price: 100, quantity: 2, category: 'zapichy' },
      ]),
      Poznamka: 'Test kopie pro prodejnu z funkce testStoreCopy – ignorujte.',
    },
  };
  const req = normalizeRequest_({ raw: '', src: sample, data: sample.data, formName: sample.form_name, submissionId: sample.id });
  const res = sendStoreCopy_(req, to);
  console.log('Výsledek testu: ' + res.status + (res.reason ? ' (' + res.reason + ')' : ''));
  return res;
}

/**
 * Test z editoru Apps Script (vyberte funkci „testPaymentStatusEmails“ a dejte Spustit).
 * Pošle na CONFIG.TEST_EMAIL ukázky interního e-mailu ve všech stavech platby (čeká na online platbu,
 * zaplaceno online, online nedokončena → při vyzvednutí, platba při vyzvednutí, jedlý tisk) a zákaznické potvrzení
 * s čekající online platbou a po zaplacení. Nic se neposílá prodejnám ani do Pohody.
 */
function testPaymentStatusEmails() {
  const to = CONFIG.TEST_EMAIL || CONFIG.NOTIFY_EMAIL;
  const date = Utilities.formatDate(new Date(Date.now() + 7 * 86400000), 'Europe/Prague', 'yyyy-MM-dd');
  const make = function (formName, extra) {
    const data = Object.assign({
      Jmeno: 'Test Zákazník', Email: to, Telefon: '602 000 000', Prodejna: 'Karviná', Datum: date,
    }, extra);
    return normalizeRequest_({ raw: '', src: { form_name: formName, id: 'test-pay', data: data }, data: data, formName: formName, submissionId: 'test-pay' });
  };
  const cart = {
    'Cislo-Objednavky': 'TEST-0010', 'Celkem-Kc': '410',
    'Produkty-JSON': JSON.stringify([
      { name: 'Větrník', price: 70, quantity: 3, category: 'zakusky' },
      { name: 'Punčový řez', price: 100, quantity: 2, category: 'zakusky' },
    ]),
  };
  const send = function (label, r) {
    MailApp.sendEmail({
      to: to,
      subject: 'TEST platby – ' + label + ' | ' + buildSubject_(r),
      body: buildEmailText_(r, null),
      htmlBody: buildEmailHtml_(r, null),
      name: CONFIG.SENDER_NAME,
    });
  };

  const pending = make('objednavka', Object.assign({ 'Zpusob-Platby': 'online' }, cart));
  send('čeká na online platbu', pending);

  const paid = Object.assign({}, pending, { paymentStatus: 'PAID', paymentDetail: 'transakce TEST' });
  send('zaplaceno online', paid);

  send('online nedokončena', Object.assign({}, pending, { paymentStatus: 'CANCELLED' }));
  send('platba při vyzvednutí', make('objednavka', Object.assign({ 'Zpusob-Platby': 'cash' }, cart)));
  send('jedlý tisk', make('tisk-na-papir', {
    'Typ-Podkladu': 'Fondánový list A4', 'Pocet-Kusu': '2', 'Celkem-Kc': '180',
  }));

  const paidConf = buildStandardConfirmation_(Object.assign({}, paid, { mailKind: 'paid' }));
  MailApp.sendEmail({ to: to, subject: 'TEST platby – potvrzení zákazníkovi po zaplacení | ' + paidConf.subject, body: paidConf.text, htmlBody: paidConf.html, name: CONFIG.CUSTOMER_SENDER_NAME });

  const conf = buildStandardConfirmation_(pending);
  MailApp.sendEmail({ to: to, subject: 'TEST platby – potvrzení zákazníkovi (online čeká) | ' + conf.subject, body: conf.text, htmlBody: conf.html, name: CONFIG.CUSTOMER_SENDER_NAME });
  console.log('Odesláno 7 ukázkových e-mailů na ' + maskEmail_(to));
}
