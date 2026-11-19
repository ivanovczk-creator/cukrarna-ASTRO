const CONFIG = {
  NOTIFY_EMAIL: 'objednavky@cukrarstviblahutovi.cz',
  XML_FOLDER_ID: 'DOPLNIT_ID_SLOZKY',
  ICO: '76208371',
  RATE_VAT: 'low',
};

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

    if (parsed.formName && parsed.formName !== 'objednavka') {
      return json_({ ok: true, skipped: true, form: parsed.formName });
    }

    const order = toOrder_(parsed.data);
    const folder = DriveApp.getFolderById(CONFIG.XML_FOLDER_ID);
    const fileName = order.orderId + '.xml';

    if (folder.getFilesByName(fileName).hasNext()) {
      return json_({ ok: true, duplicate: true, orderId: order.orderId });
    }

    const xml = buildPohodaXml_(order);
    folder.createFile(fileName, xml, 'text/xml');

    sendOrderEmail_(order, xml, fileName);

    return json_({ ok: true, orderId: order.orderId });
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    lock.releaseLock();
  }
}

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

  const data = src.data || src;
  const formName = src.form_name || data['form-name'] || '';
  return { formName: formName, data: data };
}

function parseMoney_(val) {
  const cleaned = String(val == null ? 0 : val)
    .replace(/[^\d,.-]/g, '')
    .replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function toOrder_(d) {
  let rawItems = [];
  if (Array.isArray(d['Produkty-JSON'])) {
    rawItems = d['Produkty-JSON'];
  } else if (typeof d['Produkty-JSON'] === 'string' && d['Produkty-JSON'].trim() !== '') {
    rawItems = JSON.parse(d['Produkty-JSON']);
  }

  const lines = rawItems.map(function (item) {
    const qty = Number(item.quantity) || 1;
    const unitPrice = parseMoney_(item.price);
    const lineTotal = parseMoney_(item.total) || qty * unitPrice;
    return {
      name: String(item.name || 'Položka'),
      quantity: qty,
      unitPrice: unitPrice,
      lineTotal: lineTotal,
    };
  });

  const orderId = String(d['Cislo-Objednavky'] || '').trim();
  if (!orderId) {
    throw new Error('Chybí Cislo-Objednavky');
  }

  const paymentRaw = String(d['Zpusob-Platby'] || '').toLowerCase();
  const paymentMethod = paymentRaw.indexOf('online') !== -1 ? 'online' : 'cash';
  const total = parseMoney_(d['Celkem-Kc']) || lines.reduce(function (sum, l) {
    return sum + l.lineTotal;
  }, 0);

  return {
    orderId: orderId,
    name: String(d['Jmeno'] || 'Zákazník').trim(),
    email: String(d['Email'] || '').trim(),
    phone: String(d['Telefon'] || '').trim(),
    store: String(d['Prodejna'] || '').trim(),
    pickupDate: String(d['Datum'] || '').trim(),
    note: String(d['Poznamka'] || '').trim(),
    paymentMethod: paymentMethod,
    paymentLabel: paymentMethod === 'online' ? 'Online kartou (Comgate)' : 'Při převzetí',
    total: total,
    itemsText: String(d['Produkty-Seznam'] || '').trim(),
    lines: lines,
  };
}

function x_(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<dat:dataPack id="' + x_(o.orderId) + '" ico="' + CONFIG.ICO + '" application="cukrarstviblahutovi.cz" version="2.0" note="Import objednavky z webu" ' +
    'xmlns:dat="http://www.stormware.cz/schema/version_2/data.xsd" xmlns:ord="http://www.stormware.cz/schema/version_2/order.xsd" xmlns:typ="http://www.stormware.cz/schema/version_2/type.xsd">' +
    '<dat:dataPackItem id="' + x_(o.orderId) + '" version="2.0"><ord:order version="2.0"><ord:orderHeader>' +
    '<ord:orderType>receivedOrder</ord:orderType>' +
    '<ord:numberOrder>' + x_(o.orderId) + '</ord:numberOrder>' +
    '<ord:date>' + dateIssued + '</ord:date>' +
    (o.pickupDate ? '<ord:dateDelivery>' + x_(o.pickupDate) + '</ord:dateDelivery>' : '') +
    '<ord:text>' + x_('Web objednávka ' + o.orderId + ' – ' + o.store) + '</ord:text>' +
    '<ord:partnerIdentity><typ:address>' +
    '<typ:name>' + x_(o.name) + '</typ:name>' +
    (o.email ? '<typ:email>' + x_(o.email) + '</typ:email>' : '') +
    (o.phone ? '<typ:mobilPhone>' + x_(o.phone) + '</typ:mobilPhone>' : '') +
    '</typ:address></ord:partnerIdentity>' +
    '<ord:note>' + x_('Platba: ' + o.paymentLabel + (o.note ? ' | ' + o.note : '')) + '</ord:note>' +
    '</ord:orderHeader><ord:orderDetail>' + itemsXml + '</ord:orderDetail></ord:order></dat:dataPackItem></dat:dataPack>'
  );
}

function sendOrderEmail_(order, xml, fileName) {
  const customerName = order.name || 'Zákazník';
  const subject =
    customerName +
    ' – Objednávka ' +
    order.orderId +
    (order.store ? ' – ' + order.store : '') +
    (order.pickupDate ? ' (' + order.pickupDate + ')' : '');

  const rowsHtml = order.lines.map(function (l) {
    return (
      '<tr>' +
      '<td style="padding:8px;border-bottom:1px solid #e5e7eb;">' + x_(l.name) + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">' + l.quantity + ' ks</td>' +
      '<td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">' + l.unitPrice + ' Kč</td>' +
      '<td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;"><strong>' + l.lineTotal + ' Kč</strong></td>' +
      '</tr>'
    );
  }).join('');

  const htmlBody =
    '<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">' +
    '<h2 style="margin:0 0 8px 0;">Nová objednávka ' + x_(order.orderId) + '</h2>' +
    '<p style="margin:0 0 16px 0;color:#4b5563;">' +
    'Zákazník: <strong>' + x_(customerName) + '</strong> | ' +
    'Prodejna: <strong>' + x_(order.store) + '</strong> | ' +
    'Vyzvednutí: <strong>' + x_(order.pickupDate) + '</strong>' +
    '</p>' +
    '<p style="margin:0 0 16px 0;">' +
    '<strong>Telefon:</strong> ' + x_(order.phone) + '<br>' +
    '<strong>E-mail:</strong> ' + x_(order.email) + '<br>' +
    '<strong>Platba:</strong> ' + x_(order.paymentLabel) +
    (order.note ? '<br><strong>Poznámka:</strong> ' + x_(order.note) : '') +
    '</p>' +
    '<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">' +
    '<thead><tr style="background:#f9fafb;text-align:left;">' +
    '<th style="padding:8px;border-bottom:1px solid #d1d5db;">Položka</th>' +
    '<th style="padding:8px;border-bottom:1px solid #d1d5db;text-align:center;">Množství</th>' +
    '<th style="padding:8px;border-bottom:1px solid #d1d5db;text-align:right;">Cena/ks</th>' +
    '<th style="padding:8px;border-bottom:1px solid #d1d5db;text-align:right;">Celkem</th>' +
    '</tr></thead><tbody>' + rowsHtml + '</tbody></table>' +
    '<p style="font-size:16px;text-align:right;margin:0 0 16px 0;"><strong>Celkem s DPH: ' + order.total + ' Kč</strong></p>' +
    '<p style="font-size:13px;color:#4b5563;">XML soubor <code>' + x_(fileName) + '</code> byl uložen na Google Disk a přiložen k e-mailu.</p>' +
    '</div>';

  const plainBody =
    'Zákazník: ' + customerName + '\n' +
    'Objednávka: ' + order.orderId + '\n' +
    'Prodejna: ' + order.store + '\n' +
    'Vyzvednutí: ' + order.pickupDate + '\n' +
    'Telefon: ' + order.phone + '\n' +
    'E-mail: ' + order.email + '\n' +
    'Platba: ' + order.paymentLabel + '\n' +
    'Celkem: ' + order.total + ' Kč\n' +
    (order.itemsText ? '\nPoložky:\n' + order.itemsText + '\n' : '') +
    (order.note ? '\nPoznámka: ' + order.note + '\n' : '');

  const options = {
    to: CONFIG.NOTIFY_EMAIL,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    attachments: [Utilities.newBlob(xml, 'text/xml', fileName)],
  };

  if (order.email) {
    options.replyTo = order.email;
  }

  MailApp.sendEmail(options);
}
