/**
 * Generátor mXML pro import do POHODY (Stormware) – "Přijatá objednávka".
 *
 * Výstup lze:
 *  - poslat do POHODA mServeru (viz integrations/pohoda/send-to-pohoda.mjs),
 *  - nebo uložit jako .xml a naimportovat ručně (Soubor → Datová komunikace → XML import).
 *
 * VZOROVÁ IMPLEMENTACE: před ostrým provozem ji ověřte na testovací účetní jednotce
 * (zejména sazbu DPH, číselnou řadu objednávek a středisko/činnost).
 *
 * Konfigurace přes proměnné prostředí:
 *   POHODA_ICO        IČO účetní jednotky (povinné pro dataPack)
 *   POHODA_RATE_VAT   none | low | high | third   (výchozí "low"; potraviny = snížená sazba)
 */

const NS = {
  dat: 'http://www.stormware.cz/schema/version_2/data.xsd',
  ord: 'http://www.stormware.cz/schema/version_2/order.xsd',
  typ: 'http://www.stormware.cz/schema/version_2/type.xsd',
};

export function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * @typedef {Object} Order
 * @property {string} orderId              např. BL-20261104-7K3F
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 * @property {string} [store]              prodejna výdeje
 * @property {string} [pickupDate]         YYYY-MM-DD
 * @property {string} [note]
 * @property {'cash'|'online'} paymentMethod
 * @property {{name:string, quantity:number, unitPrice:number}[]} lines   jednotkové ceny VČETNĚ DPH
 */

/** @param {Order} order @param {{ico?: string, rateVAT?: string, createdAt?: Date}} [opts] */
export function buildPohodaOrderXml(order, opts = {}) {
  const ico = opts.ico ?? process.env.POHODA_ICO ?? '00000000';
  const rateVAT = opts.rateVAT ?? process.env.POHODA_RATE_VAT ?? 'low';
  const created = (opts.createdAt ?? new Date()).toISOString().slice(0, 10);
  const pay = order.paymentMethod === 'online' ? 'Online kartou (Comgate)' : 'Při převzetí';
  const headerText = `Web objednávka ${order.orderId} – ${order.store || 'prodejna neuvedena'}`;
  const note = [`Platba: ${pay}`, order.note].filter(Boolean).join(' | ');

  const items = order.lines
    .map(
      (l) => `
      <ord:orderItem>
        <ord:text>${xmlEscape(l.name)}</ord:text>
        <ord:quantity>${Number(l.quantity)}</ord:quantity>
        <ord:unit>ks</ord:unit>
        <ord:payVAT>true</ord:payVAT>
        <ord:rateVAT>${xmlEscape(rateVAT)}</ord:rateVAT>
        <ord:homeCurrency>
          <typ:unitPrice>${Number(l.unitPrice)}</typ:unitPrice>
        </ord:homeCurrency>
      </ord:orderItem>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack id="${xmlEscape(order.orderId)}" ico="${xmlEscape(ico)}" application="cukrarstviblahutovi.cz" version="2.0" note="Import objednavky z webu"
  xmlns:dat="${NS.dat}" xmlns:ord="${NS.ord}" xmlns:typ="${NS.typ}">
  <dat:dataPackItem id="${xmlEscape(order.orderId)}" version="2.0">
    <ord:order version="2.0">
      <ord:orderHeader>
        <ord:orderType>receivedOrder</ord:orderType>
        <ord:numberOrder>${xmlEscape(order.orderId)}</ord:numberOrder>
        <ord:date>${created}</ord:date>${order.pickupDate ? `\n        <ord:dateDelivery>${xmlEscape(order.pickupDate)}</ord:dateDelivery>` : ''}
        <ord:text>${xmlEscape(headerText)}</ord:text>
        <ord:partnerIdentity>
          <typ:address>
            <typ:name>${xmlEscape(order.name)}</typ:name>${order.email ? `\n            <typ:email>${xmlEscape(order.email)}</typ:email>` : ''}${order.phone ? `\n            <typ:mobilPhone>${xmlEscape(order.phone)}</typ:mobilPhone>` : ''}
          </typ:address>
        </ord:partnerIdentity>
        <ord:note>${xmlEscape(note)}</ord:note>
      </ord:orderHeader>
      <ord:orderDetail>${items}
      </ord:orderDetail>
    </ord:order>
  </dat:dataPackItem>
</dat:dataPack>
`;
}
