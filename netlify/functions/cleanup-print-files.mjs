/**
 * Naplánovaná funkce (1× denně): maže soubory k jedlému tisku / inspirační fotky starší než RETENTION_DAYS.
 *
 * GDPR – zásada omezení uložení: nahrané fotografie se uchovávají jen po dobu nutnou k vyřízení objednávky.
 * Lhůta musí odpovídat textu v Zásadách ochrany osobních údajů (/ochrana-osobnich-udaju).
 */
import { getStore } from '@netlify/blobs';
import { PRINT_STORE } from '../lib/print-files.mjs';

const RETENTION_DAYS = 90;

export default async () => {
  const store = getStore(PRINT_STORE);
  const limit = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  let checked = 0;
  let deleted = 0;

  for await (const page of store.list({ paginate: true })) {
    for (const { key } of page.blobs) {
      checked += 1;
      const entry = await store.getMetadata(key);
      const uploadedAt = Date.parse(entry?.metadata?.uploadedAt ?? '');
      // soubory bez data nahrání ponecháme (nelze určit stáří) – ať je případně smaže správce ručně
      if (Number.isFinite(uploadedAt) && uploadedAt < limit) {
        await store.delete(key);
        deleted += 1;
      }
    }
  }

  console.log(`[cleanup-print-files] zkontrolováno ${checked}, smazáno ${deleted} (starší než ${RETENTION_DAYS} dnů)`);
};

export const config = { schedule: '@daily' };
