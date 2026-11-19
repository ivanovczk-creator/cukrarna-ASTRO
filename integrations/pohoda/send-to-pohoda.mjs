#!/usr/bin/env node
/**
 * Vzorový skript: objednávka (JSON) → mXML → POHODA mServer.
 *
 *   node integrations/pohoda/send-to-pohoda.mjs integrations/pohoda/sample-order.json
 *   node integrations/pohoda/send-to-pohoda.mjs order.json --out objednavka.xml
 *
 * Bez POHODA_MSERVER_URL jen vypíše XML (dry-run) – to lze ručně naimportovat v POHODĚ
 * (Soubor → Datová komunikace → XML import).
 *
 * ENV:
 *   POHODA_ICO            IČO účetní jednotky
 *   POHODA_RATE_VAT       none | low | high | third (výchozí low)
 *   POHODA_MSERVER_URL    např. http://192.168.1.10:444/xml   (mServer musí být spuštěn a dostupný)
 *   POHODA_USER / POHODA_PASSWORD   přihlašovací údaje mServeru (Základní → Uživatelé)
 *   POHODA_CHECK_DUPLICITY  "false" vypne kontrolu duplicity (výchozí zapnuto – stejné číslo objednávky se nenaimportuje 2×)
 *
 * Formát objednávky viz integrations/pohoda/sample-order.json.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { buildPohodaOrderXml } from '../../netlify/lib/pohoda.mjs';

const [, , file, ...flags] = process.argv;
if (!file) {
  console.error('Použití: node send-to-pohoda.mjs <order.json> [--out soubor.xml]');
  process.exit(1);
}

const order = JSON.parse(await readFile(file, 'utf8'));
const xml = buildPohodaOrderXml(order);

const outIdx = flags.indexOf('--out');
if (outIdx !== -1) {
  await writeFile(flags[outIdx + 1], xml, 'utf8');
  console.log(`XML uloženo do ${flags[outIdx + 1]}`);
}

const url = process.env.POHODA_MSERVER_URL;
if (!url) {
  if (outIdx === -1) console.log(xml);
  console.error('\n(dry-run: POHODA_MSERVER_URL není nastavena, nic se neodeslalo)');
  process.exit(0);
}

const auth = Buffer.from(`${process.env.POHODA_USER ?? ''}:${process.env.POHODA_PASSWORD ?? ''}`).toString('base64');
const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml; charset=UTF-8',
    'STW-Authorization': `Basic ${auth}`,
    'STW-Application': 'cukrarstviblahutovi.cz',
    'STW-Check-Duplicity': process.env.POHODA_CHECK_DUPLICITY === 'false' ? 'false' : 'true',
  },
  body: xml,
});

const text = await res.text();
console.log(`mServer: HTTP ${res.status}`);
console.log(text);
// Odpověď je XML s <rsp:responsePackItem state="ok|error" note="...">
if (!res.ok || /state="error"/i.test(text)) process.exit(2);
