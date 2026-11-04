// Serverové ceny produktů z data.json – ceně z prohlížeče se nevěří.
import data from '../../data.json' with { type: 'json' };

export function parsePrice(price) {
  if (typeof price === 'number') return Number.isFinite(price) ? price : null;
  const m = String(price ?? '').replace(/\s/g, '').match(/^(\d+(?:[.,]\d+)?)/);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}

const norm = (s) => String(s ?? '').trim().toLowerCase();

const catalog = new Map();
for (const list of [data.cakes, data.desserts, data.toppers, data.coldKitchen]) {
  for (const p of list || []) {
    const price = parsePrice(p.cena);
    if (p.title && price !== null && !catalog.has(norm(p.title))) {
      catalog.set(norm(p.title), { title: p.title, unitPrice: price });
    }
  }
}

/**
 * Přepočítá položky košíku podle katalogu.
 * @returns {{ lines: {name:string, quantity:number, unitPrice:number}[], total: number }}
 * @throws Error s českou zprávou, když je položka neznámá nebo nemá spočitatelnou cenu.
 */
export function priceItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Prázdný košík');
  const lines = items.map((item) => {
    const found = catalog.get(norm(item?.name));
    const quantity = Math.floor(Number(item?.quantity));
    if (!found) throw new Error(`Neznámá položka: ${item?.name}`);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 100) {
      throw new Error(`Neplatné množství u: ${item?.name}`);
    }
    return { name: found.title, quantity, unitPrice: found.unitPrice };
  });
  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  return { lines, total };
}
