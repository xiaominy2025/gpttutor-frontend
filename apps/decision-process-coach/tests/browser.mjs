import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const url = 'http://127.0.0.1:5184/decision-process';
const browser = await chromium.launch({ channel: 'msedge' });

try {
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const payloads = [];
    await page.route('**/api/decision-process/chat', async route => {
      payloads.push(route.request().postDataJSON().messages);
      if (payloads.length === 2) {
        return route.fulfill({ status: 502, json: { error: 'Simulated recoverable failure' } });
      }
      await route.continue();
    });
    await page.goto(url);
    await page.getByRole('heading', { name: 'Decision Process Coach' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Send', exact: true }).isDisabled(), true);
    const input = page.getByRole('textbox', { name: 'Your message' });
    await input.fill('Should we expand into a second city?');
    await input.press('Enter');
    const question = 'What would make an option worth testing first?';
    await page.getByRole('button', { name: question }).click();
    await page.getByRole('alert').waitFor();
    await page.getByRole('button', { name: 'Retry message' }).click();
    await page.getByText(/Let’s connect/).waitFor();
    assert.equal(await page.getByText(question, { exact: true }).count(), 1);
    assert.deepEqual(payloads[1], payloads[2]);
    assert.deepEqual(payloads[2].map(message => message.role), ['user', 'assistant', 'user']);
    assert.equal(payloads[2][0].content, 'Should we expand into a second city?');
    assert.equal(payloads[2][2].content, question);

    await page.route('**/api/decision-process/chat', async route => {
      if (route.request().postDataJSON().messages.at(-1).content !== 'Reset this pending request') {
        return route.fallback();
      }
      await new Promise(resolve => setTimeout(resolve, 600));
      await route.fulfill({ json: { reply: 'Stale turn', questions: [], tools: [] } }).catch(() => {});
    });
    await input.fill('Reset this pending request');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.getByRole('status').waitFor();
    await page.getByRole('button', { name: 'New conversation' }).click();
    await page.getByRole('heading', { name: 'What are you deciding?' }).waitFor();
    await input.fill('Should I take a new role?');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.getByRole('button', { name: question }).waitFor();
    assert.deepEqual(payloads.at(-1), [{ role: 'user', content: 'Should I take a new role?' }]);
    assert.equal(await page.getByText(/second city|Stale turn/).count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.reload();
    await page.getByRole('heading', { name: 'What are you deciding?' }).waitFor();
    await page.close();
    console.log(`Passed conversation and route checks at ${viewport.width}×${viewport.height}.`);
  }
} finally {
  await browser.close();
}
