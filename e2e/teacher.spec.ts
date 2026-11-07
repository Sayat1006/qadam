import { expect, test } from '@playwright/test';
import { seed } from './helpers';

test.describe('мұғалім мен әкімші', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name === 'mobile', 'бір рет тексеру жеткілікті'));

  test('тапсырма беріледі, бала көреді, орындалуы есептеледі', async ({ page }) => {
    await seed(page, { session: 'teacher' });
    await page.goto('/teacher');
    await page.getByLabel('Дана').check();
    await page.getByLabel('Пән').selectOption('math');
    await page.getByLabel('Тақырып').selectOption('count');
    await page.getByLabel('Тапсырма саны').selectOption('5');
    await page.getByRole('button', { name: 'Тапсырма беру' }).click();
    await expect(page.getByText('Тапсырма 1 оқушыға берілді.')).toBeVisible();
    await expect(page.getByText('Дана: 0/5')).toBeVisible();

    await page.evaluate(() => sessionStorage.setItem('qadam.session', JSON.stringify({ kind: 'child', id: 'c1' })));
    await page.goto('/child');
    await expect(page.getByText('Мұғалімнің тапсырмасы')).toBeVisible();
    await page.getByRole('link', { name: 'Орындау' }).click();
    await expect(page).toHaveURL(/topic=count/);
    await expect(page.getByText(/Неше .* бар\?/).first()).toBeVisible();
  });

  test('ЖДБ мақсаты қойылады және ата-анаға көрінеді', async ({ page }) => {
    await seed(page, { session: 'teacher' });
    await page.goto('/teacher');
    await page.getByRole('button', { name: 'Толығырақ' }).click();
    await page.getByRole('tab', { name: 'Мақсаттар' }).click();
    await page.getByLabel('Мақсатты дәлдік').selectOption('70');
    await page.getByRole('button', { name: 'Мақсат қою' }).click();
    await expect(page.getByText(/— 70%/)).toBeVisible();
    await page.evaluate(() => sessionStorage.setItem('qadam.session', JSON.stringify({ kind: 'adult', id: 'u2' })));
    await page.goto('/parent');
    await page.getByRole('tab', { name: 'Мақсаттар' }).click();
    await expect(page.getByText(/— 70%/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Мақсат қою' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Есепті басып шығару/ })).toBeVisible();
  });

  test('сыныпты топпен тіркеу және кіру карточкалары', async ({ page }) => {
    await seed(page, { session: 'admin' });
    await page.goto('/admin');
    await page.getByRole('tab', { name: 'Топпен тіркеу' }).click();
    await page.getByLabel('Оқушылар тізімі').fill('Ерлан; 2017; Гүлнар Ахметова\nАйгерім; 2016\nҚате; 1990');
    await expect(page.getByText('Туған жылы қате')).toBeVisible();
    await page.getByRole('button', { name: '2 оқушыны тіркеу' }).click();
    await expect(page.getByText('2 оқушы тіркелді.')).toBeVisible();
    await expect(page.locator('.login-card')).toHaveCount(2);
    await expect(page.getByText('gulnar.a')).toBeVisible();
    const n = await page.evaluate(() => JSON.parse(localStorage.getItem('qadam.db.v1')!).children.length);
    expect(n).toBe(3);
  });
});
