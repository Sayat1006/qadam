import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { seed } from './helpers';

const pages: { path: string; session: 'child' | 'parent' | 'teacher' | 'admin' | null }[] = [
  { path: '/', session: null },
  { path: '/login', session: null },
  { path: '/child-login', session: null },
  { path: '/child', session: 'child' },
  { path: '/child/subjects', session: 'child' },
  { path: '/child/subject/math', session: 'child' },
  { path: '/child/lesson/math', session: 'child' },
  { path: '/child/lesson/digital', session: 'child' },
  { path: '/child/lesson/reading', session: 'child' },
  { path: '/child/placement/math', session: 'child' },
  { path: '/child/games', session: 'child' },
  { path: '/child/games/memory', session: 'child' },
  { path: '/child/achievements', session: 'child' },
  { path: '/child/village', session: 'child' },
  { path: '/child/calm', session: 'child' },
  { path: '/parent', session: 'parent' },
  { path: '/teacher', session: 'teacher' },
  { path: '/admin', session: 'admin' },
];

for (const theme of ['soft', 'dark']) {
  for (const p of pages) {
    test(`a11y ${theme} ${p.path}`, async ({ page }) => {
      await seed(page, { theme, session: p.session });
      await page.goto(p.path);
      await page.waitForTimeout(400);
      // Reveal анимациясын аяқтау
      await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
      await page.waitForTimeout(700);
      const res = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('canvas')
        .analyze();
      const bad = res.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      const report = bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`).join('\n');
      expect(bad, report).toEqual([]);
    });
  }
}

test('ауыл нысандарын пернетақтамен басуға болады', async ({ page }) => {
  await seed(page, { session: 'child' });
  await page.goto('/child/village');
  const item = page.getByRole('button', { name: 'Киіз үй', exact: true });
  await item.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Киіз үйге қош келдің!')).toBeVisible();
});

test('жаңа белгі ашылғанда хабар шығады, бір рет қана', async ({ page }) => {
  await seed(page, { session: 'child' });
  // seenBadges бос — «Бірінші қадам» белгісі әлі хабарланбаған
  await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('qadam.db.v1')!);
    db.progress.c1.seenBadges = [];
    localStorage.setItem('qadam.db.v1', JSON.stringify(db));
  });
  await page.goto('/child');
  await expect(page.getByText('Жаңа белгі ашылды!')).toBeVisible();
  await expect(page.locator('.toast strong')).toHaveText('Бірінші қадам');
  await page.getByRole('button', { name: 'Жабу' }).click();
  await page.reload();
  await page.waitForTimeout(800);
  await expect(page.getByText('Жаңа белгі ашылды!')).toHaveCount(0);
});

test('диагностика деңгейді анықтап, сақтайды', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile');
  await seed(page, { session: 'child' });
  await page.goto('/child/placement/science');
  await page.getByRole('button', { name: /Бастау/ }).click();
  // Бірінші тапсырмада әдейі қателесеміз → 1-деңгейде тоқтайды
  for (let i = 0; i < 40 && !(await page.getByText('деңгей анықталды').count()); i++) {
    const next = page.getByRole('button', { name: /Келесі/ });
    if (await next.count()) { await next.click(); continue; }
    const opts = page.locator('.task-card .opt:not([disabled]), .task-card .sort-group');
    const n = await opts.count();
    if (n) await opts.nth(i % n).click();
  }
  await expect(page.getByText('деңгей анықталды')).toBeVisible();
  const placement = await page.evaluate(() => JSON.parse(localStorage.getItem('qadam.db.v1')!).progress.c1.placement);
  expect(placement.science.level).toBeGreaterThanOrEqual(1);
});
