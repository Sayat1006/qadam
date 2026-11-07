/* Сыныпты топпен тіркеу: жолдарды талдау, логин жасау, сурет-құпиясөз */
const MAP: Record<string, string> = {
  а: 'a', ә: 'a', б: 'b', в: 'v', г: 'g', ғ: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', қ: 'q',
  л: 'l', м: 'm', н: 'n', ң: 'n', о: 'o', ө: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ұ: 'u', ү: 'u', ф: 'f', х: 'h',
  һ: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', і: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function translit(s: string) {
  return s
    .toLowerCase()
    .split('')
    .map((c) => (c in MAP ? MAP[c] : /[a-z0-9]/.test(c) ? c : ''))
    .join('');
}

export interface BulkRow {
  name: string;
  birthYear: number;
  parentName: string;
  error?: string;
}

/** «Аты; туған жылы; ата-ананың аты-жөні» — үтір, нүктелі үтір немесе таб арқылы */
export function parseBulk(text: string, nowYear = new Date().getFullYear()): BulkRow[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = '', year = '', parent = ''] = line.split(/[;\t,]/).map((x) => x.trim());
      const y = Number(year);
      const row: BulkRow = { name, birthYear: y, parentName: parent };
      if (!name) row.error = 'Аты жоқ';
      else if (!Number.isInteger(y) || y < nowYear - 18 || y > nowYear - 4) row.error = 'Туған жылы қате';
      return row;
    });
}

export function makeUsername(fullName: string, taken: Set<string>) {
  const parts = fullName.trim().split(/\s+/);
  const base = (translit(parts[0] ?? '') + (parts[1] ? '.' + translit(parts[1]).slice(0, 1) : '')).slice(0, 16) || 'parent';
  let u = base;
  for (let i = 2; taken.has(u.toLowerCase()); i++) u = `${base}${i}`;
  taken.add(u.toLowerCase());
  return u;
}

export function makePassword(len = 8, rnd = Math.random) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: len }, () => chars[Math.floor(rnd() * chars.length)]).join('');
}

export function makePicPass(pics: string[], rnd = Math.random) {
  return Array.from({ length: 3 }, () => pics[Math.floor(rnd() * pics.length)]);
}
