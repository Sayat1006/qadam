import { expect, test } from '@playwright/test';

test('толық жол: әкімші → тіркеу → бала сабағы → ата-ана есебі', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'толық жол бір рет тексеріледі');
  await page.goto('/login');
  await page.getByLabel('Аты-жөні').fill('Мектеп әкімшісі');
  await page.getByLabel('Құпиясөз (кемінде 8 таңба)').fill('admin12345');
  await page.getByLabel('Құпиясөзді қайталаңыз').fill('admin12345');
  await page.getByRole('button', { name: 'Әкімшіні құру' }).click();
  await page.waitForURL('**/admin');

  await page.getByRole('tab', { name: 'Ата-ана мен мұғалімдер' }).click();
  await page.getByLabel('Аты-жөні').fill('Гүлнар');
  await page.getByLabel('Логин').fill('gulnar');
  await page.getByLabel('Бастапқы құпиясөз').fill('parent123');
  await page.getByRole('button', { name: 'Тіркелгі ашу' }).click();
  await expect(page.getByText('Логин: gulnar')).toBeVisible();

  await page.getByRole('tab', { name: 'Балалар' }).click();
  await page.getByLabel('Аты (немесе лақап аты)').fill('Ерлан');
  for (const p of ['🍎', '⭐', '🐟']) await page.getByRole('button', { name: `Сурет ${p} қосу` }).click();
  await page.getByLabel('Гүлнар').check();
  await page.getByRole('button', { name: 'Баланы тіркеу' }).click();
  await expect(page.getByText('Ерлан тіркелді')).toBeVisible();
  await page.getByRole('button', { name: 'Шығу' }).first().click();

  await page.goto('/child-login');
  await page.getByRole('button', { name: /Ерлан/ }).click();
  for (const p of ['🍎', '⭐', '🐟']) await page.getByRole('button', { name: `Сурет ${p}`, exact: true }).click();
  await page.waitForURL('**/child');

  // Сабақты соңына дейін орындау: дұрыс жауап 3 қатеден кейін белгіленеді
  await page.goto('/child/lesson/math');
  for (let step = 0; step < 80 && !(await page.locator('.result-hero').count()); step++) {
    const next = page.getByRole('button', { name: /Келесі/ });
    if (await next.count()) {
      await next.click();
      continue;
    }
    if (await page.locator('.numpad').count()) {
      const hint = page.locator('.numpad-display .muted').first();
      const t = ((await hint.count()) ? await hint.textContent() : '')?.trim() ?? '';
      if (/^\d+$/.test(t)) {
        for (const ch of t) await page.getByRole('button', { name: ch, exact: true }).click();
      } else await page.getByRole('button', { name: '1', exact: true }).click();
      await page.getByRole('button', { name: 'Тексеру' }).click();
      continue;
    }
    const sel = page.locator('.task-card .opt.selected:not([disabled]), .task-card .sort-group.selected');
    const opts = (await sel.count()) ? sel : page.locator('.task-card .opt:not([disabled]), .task-card .sort-group');
    const n = await opts.count();
    if (n) await opts.nth(step % n).click();
  }
  await expect(page.locator('.result-hero')).toBeVisible();
  await expect(page.getByText('Бірден дұрыс').first()).toBeVisible();

  await page.getByRole('button', { name: /Шығу/ }).first().click();
  await page.goto('/login');
  await page.getByLabel('Логин').fill('gulnar');
  await page.getByLabel('Құпиясөз').fill('parent123');
  await page.getByRole('button', { name: 'Кіру', exact: true }).click();
  await page.waitForURL('**/parent');
  await expect(page.getByRole('heading', { name: 'Ерлан' })).toBeVisible();
  await expect(page.getByText('Аяқталған сабақ')).toBeVisible();
});
