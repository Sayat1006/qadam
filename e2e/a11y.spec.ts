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
