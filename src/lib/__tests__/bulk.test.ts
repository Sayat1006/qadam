import { describe, expect, it } from 'vitest';
import { makePassword, makeUsername, parseBulk, translit } from '../bulk';

describe('bulk', () => {
  it('қазақ әріптерін латынға айналдырады', () => {
    expect(translit('Әлібек')).toBe('alibek');
    expect(translit('Жұлдыз Қасымова')).toBe('zhuldyzqasymova');
    expect(translit('Шыңғыс')).toBe('shyngys');
  });
  it('жолдарды талдап, қателерді белгілейді', () => {
    const rows = parseBulk('Ерлан; 2017; Гүлнар Ахметова\nДана,2016\n;2015\nАйбек;1990', 2026);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ name: 'Ерлан', birthYear: 2017, parentName: 'Гүлнар Ахметова' });
    expect(rows[1].error).toBeUndefined();
    expect(rows[2].error).toBe('Аты жоқ');
    expect(rows[3].error).toBe('Туған жылы қате');
  });
  it('логин қайталанбайды', () => {
    const taken = new Set<string>(['gulnar.a']);
    expect(makeUsername('Гүлнар Ахметова', taken)).toBe('gulnar.a2');
    expect(makeUsername('Гүлнар Ахметова', taken)).toBe('gulnar.a3');
  });
  it('құпиясөз ұзындығы мен таңбалары', () => {
    const p = makePassword(8);
    expect(p).toMatch(/^[a-z2-9]{8}$/);
  });
});
