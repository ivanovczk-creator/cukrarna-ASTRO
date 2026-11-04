/**
 * Netlify "event function" – spustí se automaticky po každém odeslání Netlify Formu.
 * Pro formulář "objednavka" sestaví strukturovanou objednávku (+ mXML pro POHODU)
 * a pošle ji do Make.com webhooku jako událost "order.created".
 *
 * Ostatní formuláře (dort na přání, jedlý tisk, B2B) se ignorují.
 */
import { forwardToMake } from '../lib/make.mjs';
import { buildPohodaOrderXml } from '../lib/pohoda.mjs';
import { priceItems } from '../lib/catalog.mjs';

export const handler = async (event) => {
  const { payload } = JSON.parse(event.body || '{}');
  if (payload?.form_name !== 'objednavka') return { statusCode: 200, body: 'ignored' };

  const d = payload.data || {};

  let items = [];
  try {
    items = JSON.parse(d['Produkty-JSON'] || '[]');
  } catch {
    /* necháme prázdné – objednávka se přepošle bez položek */
  }

  // Ceny vždy z katalogu (data.json); při neznámé položce pošleme objednávku k ručnímu zpracování.
  let priced = null;
  try {
    priced = priceItems(items);
  } catch (e) {
    console.warn('[submission-created] nelze ocenit objednávku:', e.message);
  }

  const order = {
    orderId: d['Cislo-Objednavky'] || `BL-${Date.now()}`,
    name: d.Jmeno,
    email: d.Email,
    phone: d.Telefon,
    store: d.Prodejna,
    pickupDate: d.Datum,
    note: d.Poznamka,
    paymentMethod: d['Zpusob-Platby'] === 'online' ? 'online' : 'cash',
    paymentStatus: d['Zpusob-Platby'] === 'online' ? 'PENDING' : 'ON_PICKUP',
    lines: priced?.lines ?? [],
    total: priced?.total ?? null,
  };

  const pohodaXml = priced ? buildPohodaOrderXml(order) : null;

  try {
    await forwardToMake({
      event: 'order.created',
      order,
      pohodaXml, // hotové mXML – v Make stačí poslat HTTP modulem na POHODA mServer
      submittedAt: payload.created_at,
    });
  } catch (e) {
    console.error('[submission-created] Make selhal', e);
    return { statusCode: 502, body: 'forward failed' };
  }

  return { statusCode: 200, body: 'ok' };
};
