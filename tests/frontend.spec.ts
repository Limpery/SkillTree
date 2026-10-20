import { test, expect, type Page } from '@playwright/test';

const map = (page: Page) => page.getByRole('region', { name: 'Карта траектории' });
const switcher = (page: Page) => page.getByRole('navigation', { name: 'Специальности' });
async function ready(page: Page, role = '') {
  await expect(map(page)).toHaveAttribute('data-active-career', role);
  await expect(map(page)).toHaveAttribute('aria-busy', 'false');
}
test.beforeEach(async ({ page }) => { await page.goto('/'); await ready(page); });

test('обзор содержит только начало и две специальности без колец и полей', async ({ page }) => {
  await expect(page.locator('[data-topic-id]')).toHaveCount(3);
  await expect(map(page).getByRole('button', { name: 'Начало', exact: true })).toBeVisible();
  await expect(map(page).getByRole('button', { name: 'Middle React-разработчик', exact: true })).toBeVisible();
  await expect(page.locator('.level-band, .curriculum-nav')).toHaveCount(0);
});

test('нажатие специальности раскрывает только её полный путь', async ({ page }) => {
  await map(page).getByRole('button', { name: 'Middle React-разработчик', exact: true }).click();
  await ready(page, 'role:middle-react');
  await expect(page.locator('[data-topic-id]')).toHaveCount(24);
  await expect(page.locator('[data-topic-id="group:react"]')).toHaveCount(1);
  await expect(page.locator('[data-topic-id="group:vue"]')).toHaveCount(0);
  await expect(page.getByTestId('detail-panel')).toContainText('51');
});

test('смена специальности удаляет предыдущие технологии и подбирает новый масштаб', async ({ page }) => {
  await switcher(page).getByRole('button', { name: 'React · Middle', exact: true }).click();
  await ready(page, 'role:middle-react');
  const previous = await page.locator('.react-flow__viewport').getAttribute('style');
  await switcher(page).getByRole('button', { name: 'Vue · Middle', exact: true }).click();
  await ready(page, 'role:middle-vue');
  await expect(page.locator('[data-topic-id]')).toHaveCount(24);
  await expect(page.locator('[data-topic-id="group:react"]')).toHaveCount(0);
  await expect(page.locator('[data-topic-id="group:vue"]')).toHaveCount(1);
  await expect.poll(() => page.locator('.react-flow__viewport').getAttribute('style')).not.toBe(previous);
});

test('быстрые переключения применяют последнюю выбранную профессию', async ({ page }) => {
  await switcher(page).getByRole('button', { name: 'React · Middle', exact: true }).click();
  await switcher(page).getByRole('button', { name: 'Vue · Middle', exact: true }).click();
  await switcher(page).getByRole('button', { name: 'React · Middle', exact: true }).click();
  await ready(page, 'role:middle-react');
  await expect(page.locator('[data-topic-id="group:vue"]')).toHaveCount(0);
  await expect(page.locator('[data-topic-id]')).toHaveCount(24);
});

test('поиск открывает профессию и нужную вкладку, группы не разделяются', async ({ page }) => {
  const search = page.getByRole('textbox', { name: 'Найти компетенцию' });
  await search.fill('эффекты'); await search.press('Enter');
  await ready(page, 'role:middle-react');
  await expect(page.getByTestId('selected-title')).toHaveText('Эффекты и refs');
  const tabs = page.getByRole('tablist', { name: 'Темы группы' });
  await expect(tabs.getByRole('tab')).toHaveCount(5);
  await tabs.getByRole('tab', { name: 'Основы React', exact: true }).click();
  await expect(page.getByTestId('selected-title')).toHaveText('Основы React');
  await tabs.getByRole('tab', { name: 'Основы React', exact: true }).press('ArrowRight');
  await expect(page.getByTestId('selected-title')).toHaveText('Состояние и Hooks');
  await page.getByRole('button', { name: 'Приблизить', exact: true }).click();
  await expect(page.locator('[data-topic-id]')).toHaveCount(24);
});

test('карточка содержит все предпосылки API и переходы к связанным темам', async ({ page }) => {
  const search = page.getByRole('textbox', { name: 'Найти компетенцию' });
  await search.fill('Запросы к API'); await search.press('Enter');
  await ready(page, 'role:middle-react');
  const panel = page.getByTestId('detail-panel');
  await expect(page.getByTestId('selected-title')).toHaveText('Запросы к API');
  await expect(panel.getByRole('button', { name: 'HTTP и HTTPS', exact: true })).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Асинхронность', exact: true })).toBeVisible();
  await panel.getByRole('button', { name: 'HTTP и HTTPS', exact: true }).click();
  await expect(page.getByTestId('selected-title')).toHaveText('HTTP и HTTPS');
});

test('выбор темы сохраняет короткие переходы и не возвращает дальние линии', async ({ page }) => {
  await switcher(page).getByRole('button', { name: 'React · Middle', exact: true }).click();
  await ready(page, 'role:middle-react');
  const initialEdges = await page.locator('.react-flow__edge').count();
  await page.getByRole('textbox', { name: 'Найти компетенцию' }).fill('Сборка и инструменты');
  await page.getByRole('textbox', { name: 'Найти компетенцию' }).press('Enter');
  await expect(page.getByTestId('selected-title')).toHaveText('Сборка и инструменты');
  await expect(page.getByRole('tablist', { name: 'Темы группы' }).getByRole('tab')).toHaveCount(3);
  await expect(page.locator('.react-flow__edge')).toHaveCount(initialEdges);
  await expect(page.getByTestId('detail-panel').getByRole('button', { name: 'Модули и npm', exact: true })).toBeVisible();
});

test('начало закрывает ветку и возвращает обзор', async ({ page }) => {
  await switcher(page).getByRole('button', { name: 'Vue · Middle', exact: true }).click();
  await ready(page, 'role:middle-vue');
  await map(page).getByRole('button', { name: 'Специальности', exact: true }).click();
  await ready(page);
  await expect(page.locator('[data-topic-id]')).toHaveCount(3);
});

test('поиск на узком экране не создаёт горизонтального переполнения', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('textbox', { name: 'Найти компетенцию' }).fill('Vue с TypeScript');
  await page.getByRole('textbox', { name: 'Найти компетенцию' }).press('Enter');
  await ready(page, 'role:middle-vue');
  await expect(page.getByTestId('selected-title')).toHaveText('Vue с TypeScript');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
