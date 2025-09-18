import { test, expect } from '@playwright/test';

async function readDownload(download: import('@playwright/test').Download) {
  const stream = await download.createReadStream();
  if (!stream) {
    const path = await download.path();
    if (!path) throw new Error('Unable to read download');
    const fs = await import('fs/promises');
    return fs.readFile(path, 'utf8');
  }
  let content = '';
  for await (const chunk of stream) {
    content += chunk.toString();
  }
  return content;
}

test.describe('Collaboration Board', () => {
  test('renders seed, drag, link, export', async ({ page }) => {
    await page.goto('/');

    const labButton = page.getByRole('button', { name: 'Lab' });
    await expect(labButton).toBeVisible();
    await labButton.click();

    await expect(page.getByText('Collaboration Board')).toBeVisible();

    const productionNode = page.locator('[data-node-id="production-tail-plan"]');
    const financeNode = page.locator('[data-node-id="finance-review"]');
    await expect(productionNode).toBeVisible();
    await expect(financeNode).toBeVisible();

    const initialTransform = await productionNode.evaluate((el) => el.getAttribute('style'));
    await productionNode.dragTo(financeNode, { targetPosition: { x: 180, y: 160 } });
    await expect.poll(async () => productionNode.evaluate((el) => el.getAttribute('style'))).not.toBe(initialTransform);

    await page.getByRole('button', { name: 'Link Mode' }).click();
    await productionNode.click();
    await financeNode.click();

    const labelInput = page.getByLabel('Label');
    await expect(labelInput).toBeVisible();
    await labelInput.fill('Budget sync test');
    const typeInput = page.getByLabel('Type');
    await typeInput.fill('handoff');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Budget sync test').first()).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export JSON' }).click();
    const download = await downloadPromise;
    const content = await readDownload(download);

    expect(content).toContain('production-tail-plan');
    expect(content).toContain('finance-review');
    expect(content).toContain('Budget sync test');
  });
});
