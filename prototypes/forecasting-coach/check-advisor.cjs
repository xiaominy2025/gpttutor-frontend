const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { join } = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const base = "http://127.0.0.1:4200";
const route = base + "/api/platform/forecasting/communication";
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4200", "--strictPort", "--mode", "advisor-mock"]);
(async () => {
  let browser;
  try {
    for (let i = 0; i < 45; i++) {
      if (await fetch(base).then(response => response.ok, () => false)) break;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert.equal((await fetch(route, { method: "POST", headers: { Origin: "https://other.example" } })).status, 403);
    assert.equal((await fetch(route, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: "{" })).status, 400);
    browser = await chromium.launch({ channel: "chrome" });
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, hasTouch: width === 390 });
      page.setDefaultTimeout(8000);
      const requests = [];
      page.on("request", request => { if (request.url() === route) requests.push(request.postDataJSON()); });
      await page.goto(base);
      await page.locator("#sample").click();
      await page.locator("#run").click();
      await page.locator("#goal").fill("Review operating capacity without changing staffing commitments.");
      await page.locator("#reflection").fill("My own proposed actions");
      const run = page.getByRole("button", { name: "Generate Management Insights", exact:true });
      assert.equal(await run.locator("svg").count(),1);
      assert.equal(await run.evaluate(el => el.getBoundingClientRect().width),44);
      if (width === 390) await run.tap();
      else {
        await page.locator("#goal").press("Tab");
        assert.equal(await run.evaluate(el=>document.activeElement===el),true);
        await page.getByRole("tooltip", {name:"Generate Management Insights"}).waitFor();
        await run.press("Enter");
      }
      await page.locator("#advisor-result").waitFor();
      assert.equal(await page.locator("#reflection").inputValue(), "My own proposed actions");
      assert.equal(requests.length, 1);
      assert.equal(requests[0].objective, "Review operating capacity without changing staffing commitments.");
      assert.ok(!JSON.stringify(requests[0]).includes("My own proposed actions"));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (process.env.FORECASTING_SCREENSHOT_DIR) {
        await page.locator("#communicate-panel").screenshot({ path: join(process.env.FORECASTING_SCREENSHOT_DIR, "forecasting-management-mock-" + width + ".png") });
      }
      for (const [status, message] of [[429, /usage limit/], [503, /unavailable/]]) {
        await page.route(route, request => request.fulfill({ status, body: "{}" }), { times: 1 });
        await run.click();
        await page.locator("#advisor-status").getByText(message).waitFor();
        assert.equal(await page.locator("#advisor-result").isVisible(), false);
        assert.equal(await page.locator("#reflection").inputValue(), "My own proposed actions");
      }
      await page.close();
      console.log("Mock Advisor passed at " + width + "px");
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
