import { expect, test } from '@playwright/test';
import { seed } from './helpers';

test('өзіңді тексер: навигатор, аяқтау, нәтиже', async ({ page }) => {
  await seed(page, { session: 'child' });
  await page.goto('/child/subject/math');
  await page.getByRole('link', { name: /Өзіңді тексер/ }).click();
  await page.waitForURL('**/child/exam/math');
  await expect(page.getByRole('timer')).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Сұрақтар' });
  await expect(nav.getByRole('button')).toHaveCount(10);
  await nav.getByRole('button', { name: '3-сұрақ' }).click();
  await expect(nav.getByRole('button', { name: '3-сұрақ' })).toHaveAttribute('aria-current', 'step');
  await page.getByRole('button', { name: 'Аяқтау' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Аяқтау' }).click();
  await expect(page.getByRole('heading', { name: 'Тақырыптар бойынша' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Нәтиже: 0 \/ 10/ })).toBeVisible();
  const log = await page.evaluate(() => JSON.parse(localStorage.getItem('qadam.db.v1')!).progress.c1.examLog);
  expect(log).toHaveLength(1);
});
