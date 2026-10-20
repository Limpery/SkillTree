import { test, expect, type Page } from '@playwright/test';

// Keep functional click targets stable; live floating is checked separately from these flows.
test.use({ reducedMotion: 'reduce' });

const map = (page: Page) => page.getByRole('region', { name: 'Карта траектории' });
const switcher = (page: Page) => page.getByRole('navigation', { name: 'Специальности' });
async function ready(page: Page, role = '') {
  await expect(map(page)).toHaveAttribute('data-active-career', role);
  await expect(map(page)).toHaveAttribute('aria-busy', 'false');
}
async function expectMapNotPainted(page: Page) {
  // Check actual descendant visibility: React Flow can override a hidden ancestor.
  const painted = await page.locator('.react-flow__node, .react-flow__edge, .map-toolbar, .node-drawer, .viewport-controls').evaluateAll(elements =>
    elements.filter(element => {
      if (getComputedStyle(element).visibility !== 'visible') return false;
      for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        if (style.display === 'none' || Number(style.opacity) === 0) return false;
      }
      return true;
    }).length,
  );
  expect(painted).toBe(0);
}
test.beforeEach(async ({ page }) => { await page.goto('/'); await ready(page); });

test('обзор содержит только начало и пять специальностей без колец и полей', async ({ page }) => {
  await expect(page.locator('[data-topic-id]')).toHaveCount(6);
  await expect(map(page).getByRole('button', { name: 'Начало', exact: true })).toBeVisible();
  await expect(map(page).getByRole('button', { name: 'Middle React-разработчик', exact: true })).toBeVisible();
  await expect(page.locator('.level-band, .curriculum-nav')).toHaveCount(0);
});

test('нажатие специальности раскрывает только её полный путь', async ({ page }) => {
  await map(page).getByRole('button', { name: 'Middle React-разработчик', exact: true }).click();
  await ready(page, 'role:middle-react');
  await expect(page.locator('[data-topic-id]')).toHaveCount(27);
  await expect(page.locator('[data-topic-id="group:react"]')).toHaveCount(1);
  await expect(page.locator('[data-topic-id="group:vue"]')).toHaveCount(0);
  await expect(map(page).getByRole('heading', { name: 'Middle React-разработчик', exact: true })).toBeVisible();
  await expect(page.getByTestId('detail-panel')).toHaveCount(0);
});

test('смена специальности удаляет предыдущие технологии и подбирает новый масштаб', async ({ page }) => {
  await switcher(page).getByRole('button', { name: 'React · Middle', exact: true }).click();
  await ready(page, 'role:middle-react');
  const previous = await page.locator('.react-flow__viewport').getAttribute('style');
  await switcher(page).getByRole('button', { name: 'Vue · Middle', exact: true }).click();
  await ready(page, 'role:middle-vue');
  await expect(page.locator('[data-topic-id]')).toHaveCount(27);
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
  await expect(page.locator('[data-topic-id]')).toHaveCount(27);
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
  await expect(page.locator('[data-topic-id]')).toHaveCount(27);
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
  await expect(page.locator('[data-topic-id]')).toHaveCount(6);
});

test('поиск на узком экране не создаёт горизонтального переполнения', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('textbox', { name: 'Найти компетенцию' }).fill('Vue с TypeScript');
  await page.getByRole('textbox', { name: 'Найти компетенцию' }).press('Enter');
  await ready(page, 'role:middle-vue');
  await expect(page.getByTestId('selected-title')).toHaveText('Vue с TypeScript');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const panel = await page.getByTestId('detail-panel').boundingBox();
  const canvas = await map(page).boundingBox();
  await expect.poll(async () => (await page.locator('[data-topic-id="group:vue"]').boundingBox())!.y + (await page.locator('[data-topic-id="group:vue"]').boundingBox())!.height).toBeLessThan(panel!.y);
  expect(panel!.y + panel!.height).toBeLessThanOrEqual(canvas!.y + canvas!.height);
});

test('карта заполняет экран под навигацией, карточка открывается внутри карты', async ({ page }) => {
  await expect(page.locator('.sidebar, .page-heading, .page-footer')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Модули платформы' }).getByRole('link')).toHaveCount(6);
  const canvas = await map(page).boundingBox();
  const header = await page.locator('.platform-header').boundingBox();
  const viewport = page.viewportSize()!;
  expect(canvas!.x).toBeCloseTo(0, 1);
  expect(canvas!.width).toBeCloseTo(viewport.width, 1);
  expect(canvas!.y).toBeCloseTo(header!.height, 1);
  expect(canvas!.y + canvas!.height).toBeCloseTo(viewport.height, 1);
  await page.getByRole('textbox', { name: 'Найти компетенцию' }).fill('эффекты');
  await page.getByRole('textbox', { name: 'Найти компетенцию' }).press('Enter');
  await ready(page, 'role:middle-react');
  const panel = map(page).getByTestId('detail-panel');
  await expect(panel).toBeVisible();
  const drawer = await panel.boundingBox();
  expect(drawer!.x + drawer!.width).toBeLessThanOrEqual(canvas!.width);
  await expect.poll(async () => { const node = await page.locator('[data-topic-id="group:react"]').boundingBox(); return node!.x + node!.width; }).toBeLessThan(drawer!.x);
  await panel.getByRole('button', { name: 'Закрыть карточку', exact: true }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.locator('[data-topic-id]')).toHaveCount(27);
});

test('другие модули полностью скрывают карту и сохраняют выбранную тему при возврате', async ({ page }) => {
  const search = page.getByRole('textbox', { name: 'Найти компетенцию' });
  await search.fill('Vue с TypeScript');
  await search.press('Enter');
  await ready(page, 'role:middle-vue');
  await expect(page.getByTestId('selected-title')).toHaveText('Vue с TypeScript');
  const canvas = await map(page).boundingBox();
  const navigation = page.getByRole('navigation', { name: 'Модули платформы' });
  for (const name of ['Мои графы', 'Сообщество', 'Курсы', 'Пет-проекты', 'Профиль']) {
    await navigation.getByRole('link', { name, exact: true }).click();
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    await expect(navigation.getByRole('link', { name, exact: true })).toHaveAttribute('aria-current', 'page');
    await expectMapNotPainted(page);
    const retained = await page.locator('.career-map').boundingBox();
    expect(retained!.width).toBeCloseTo(canvas!.width, 1);
    expect(retained!.height).toBeCloseTo(canvas!.height, 1);
    expect(await page.locator('.module-placeholder').evaluate(element => {
      const bounds = element.getBoundingClientRect();
      return [[.1, .1], [.5, .5], [.9, .9]].every(([x, y]) => element.contains(document.elementFromPoint(bounds.x + bounds.width * x, bounds.y + bounds.height * y)));
    })).toBe(true);
  }
  await page.getByRole('link', { name: 'Вернуться к карте' }).click();
  await ready(page, 'role:middle-vue');
  await expect(map(page)).toBeVisible();
  await expect(page.locator('[data-topic-id="group:vue"]')).toHaveCount(1);
  await expect(page.getByTestId('selected-title')).toHaveText('Vue с TypeScript');
  await expect(page.getByLabel('Масштаб', { exact: true })).not.toContainText('NaN');
  await expect(page.locator('.react-flow__viewport')).not.toHaveAttribute('style', /NaN/);
});

test('переключение модуля во время построения ветки не оставляет вершины на новом экране', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await switcher(page).getByRole('button', { name: 'React · Middle', exact: true }).click();
  const navigation = page.getByRole('navigation', { name: 'Модули платформы' });
  await navigation.getByRole('link', { name: 'Курсы', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Курсы', exact: true })).toBeVisible();
  await expect(page.locator('.career-map')).toHaveAttribute('aria-busy', 'false');
  await expectMapNotPainted(page);
  await navigation.getByRole('link', { name: 'Карта', exact: true }).click();
  await ready(page, 'role:middle-react');
  await expect(page.locator('[data-topic-id]')).toHaveCount(27);
  await expect(page.locator('.react-flow__viewport')).not.toHaveAttribute('style', /NaN/);
});

for (const profile of [
  { id: 'nodejs', label: 'Node.js', nodes: 27, topic: 'group:nestjs' },
  { id: 'python', label: 'Python', nodes: 26, topic: 'group:fastapi' },
  { id: 'java', label: 'Java', nodes: 26, topic: 'group:spring' },
]) test(`${profile.label}: поиск профессии раскрывает собственный серверный путь`, async ({ page }) => {
  const search = page.getByRole('textbox', { name: 'Найти компетенцию' });
  await search.fill(profile.id + ' разработчик');
  await search.press('Enter');
  await ready(page, 'role:middle-' + profile.id);
  await expect(map(page).getByRole('heading', { name: `Middle ${profile.label}-разработчик`, exact: true })).toBeVisible();
  await expect(page.locator('[data-topic-id]')).toHaveCount(profile.nodes);
  await expect(page.locator(`[data-topic-id="${profile.topic}"]`)).toHaveCount(1);
  await expect(page.locator('[data-topic-id="group:react"], [data-topic-id="group:vue"]')).toHaveCount(0);
  await expect(page.locator('.react-flow__viewport')).not.toHaveAttribute('style', /NaN/);
});
