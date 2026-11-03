export function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Массивтен қайталанбайтын n элемент */
export function sample<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

/** Дұрыс санға жақын, бірақ одан өзгеше алаңдатқыш сандар */
export function numberDistractors(answer: number, count: number, min = 0, spread = 3): number[] {
  const out = new Set<number>();
  let guard = 0;
  while (out.size < count && guard++ < 200) {
    const d = answer + rand(-spread, spread);
    if (d !== answer && d >= min) out.add(d);
  }
  let k = 1;
  while (out.size < count) {
    if (answer + k !== answer) out.add(answer + k);
    k++;
  }
  return [...out];
}
