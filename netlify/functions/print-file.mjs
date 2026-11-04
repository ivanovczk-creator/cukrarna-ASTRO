/**
 * GET /tisk-soubory/<id>/<nazev>
 * Veřejné stažení souboru nahraného přes upload-print (odkaz z e-mailového upozornění).
 * Id je náhodné UUID (nelze uhodnout); soubor se stahuje rovnou (Content-Disposition: attachment).
 */
import { getStore } from '@netlify/blobs';
import { PRINT_STORE } from '../lib/print-files.mjs';

export default async (req) => {
  const match = /^\/tisk-soubory\/([0-9a-f-]{36})\/([A-Za-z0-9_.-]+)$/.exec(new URL(req.url).pathname);
  if (!match) return new Response('Not found', { status: 404 });

  const [, id, name] = match;
  const result = await getStore(PRINT_STORE).getWithMetadata(`${id}/${name}`, { type: 'arrayBuffer' });
  if (!result) return new Response('Not found', { status: 404 });

  return new Response(result.data, {
    headers: {
      'Content-Type': result.metadata?.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'private, max-age=0, no-store',
      'X-Robots-Tag': 'noindex',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};

export const config = { path: '/tisk-soubory/*' };
