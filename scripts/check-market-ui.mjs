import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import handler from '../netlify/functions/mcp.mjs';
const fixture = { total_potential_companies: 10000, average_contract_value: 5000, icp_percentage: 40, year1_market_share_target: 2, data_sources: 'Synthetic test inputs only, not company or market findings', segment_name: 'B2B software test segment', product_category: 'CRM software', company: 'HubSpot' };
const html = readFileSync('public/lab/market-sizing/index.html', 'utf8');
const origin = 'https://synthetic.helix.invalid';
const hostHtml = '<!doctype html><title>Synthetic MCP host test harness</title><iframe title="Helix market sizing" src="/component" style="width:100%;height:1800px;border:0"></iframe>';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const receipts = [];
let failures = 0;
mkdirSync('work/market-sizing/screenshots', { recursive: true });
async function rpc(params) { const response = await handler(new Request('http://localhost/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params }) })); return (await response.json()).result; }
try {
    for (const hosted of [false, true]) {
        const mode = hosted ? 'mcp' : 'standalone';
        const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
        const errors = [], external = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('request', r => { if (!r.url().startsWith(origin) && !r.url().startsWith('data:'))
            external.push(r.url()); });
        await page.route(origin + '/**', route => route.fulfill({ contentType: 'text/html', body: route.request().url().endsWith('/host') ? hostHtml : html }));
        await page.exposeFunction('callCalculator', rpc);
        if (hosted)
            await page.addInitScript(() => { if (window.parent !== window)
                return; window.calls = []; window.initialized = false; window.addEventListener('message', async (e) => { const frame = document.querySelector('iframe'); if (e.source !== frame?.contentWindow)
                return; const m = e.data; if (m.method === 'ui/initialize')
                e.source.postMessage({ jsonrpc: '2.0', id: m.id, result: { protocolVersion: '2026-01-26', hostInfo: { name: 'Synthetic review harness', version: '1' }, hostCapabilities: {} } }, '*'); if (m.method === 'ui/notifications/initialized')
                window.initialized = true; if (m.method === 'tools/call') {
                window.calls.push(m.params);
                try {
                    e.source.postMessage({ jsonrpc: '2.0', id: m.id, result: await window.callCalculator(m.params) }, '*');
                }
                catch {
                    e.source.postMessage({ jsonrpc: '2.0', id: m.id, error: { code: -1, message: 'Synthetic error' } }, '*');
                }
            } }); });
        await page.goto(origin + (hosted ? '/host' : '/component'));
        const frame = hosted ? page.frames().find(f => f.parentFrame()) : page.mainFrame();
        await frame.waitForSelector('#calculator');
        assert.equal(await frame.locator('[name="total_potential_companies"]').evaluate(e => e.validity.valueMissing), true);
        assert.equal(await frame.locator('#results').isVisible(), false);
        if (hosted) {
            await page.waitForFunction(() => window.initialized);
            await page.evaluate(args => { const w = document.querySelector('iframe').contentWindow; w.postMessage({ jsonrpc: '2.0', method: 'ui/notifications/tool-input', params: { arguments: args } }, '*'); }, fixture);
            const result = await rpc({ name: 'tam_sam_som_calculator', arguments: fixture });
            await page.evaluate(result => document.querySelector('iframe').contentWindow.postMessage({ jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: result }, '*'), result);
        }
        else {
            for (const [key, value] of Object.entries(fixture))
                await frame.locator('[name="' + key + '"]').fill(String(value));
            await frame.locator('button').click();
        }
        await frame.waitForSelector('#results:not([hidden])');
        assert.equal(await frame.locator('#tam').textContent(), 'USD 50,000,000.00');
        assert.equal(await frame.locator('#sam').textContent(), 'USD 20,000,000.00');
        assert.equal(await frame.locator('#som').textContent(), 'USD 400,000.00');
        assert.match(await frame.locator('#source').textContent(), /Synthetic test inputs only/);
        assert.match(await frame.locator('#scenarios').textContent(), /200,000.00.*400,000.00.*600,000.00/s);
        assert.match(await frame.locator('#trace').textContent(), /10,000 companies/);
        await page.screenshot({ path: 'work/market-sizing/screenshots/' + mode + '-fixture.png', fullPage: true });
        await frame.locator('[name="total_potential_companies"]').fill('20000');
        assert.equal(await frame.locator('#results').isVisible(), false);
        await frame.locator('button').click();
        await frame.waitForSelector('#results:not([hidden])');
        assert.equal(await frame.locator('#som').textContent(), 'USD 800,000.00');
        assert.match(await frame.locator('#scenarios').textContent(), /1,200,000.00/);
        assert.match(await frame.locator('#trace').textContent(), /20,000 companies/);
        if (hosted) {
            const calls = await page.evaluate(() => window.calls);
            assert.equal(calls.length, 1);
            assert.equal(calls[0].name, 'tam_sam_som_calculator');
            assert.equal(calls[0].arguments.total_potential_companies, 20000);
        }
        await page.screenshot({ path: 'work/market-sizing/screenshots/' + mode + '-changed.png', fullPage: true });
        await frame.locator('[name="icp_percentage"]').fill('0');
        await frame.locator('button').click();
        await frame.waitForSelector('#results:not([hidden])');
        assert.equal(await frame.locator('#som').textContent(), 'USD 0.00');
        await frame.locator('[name="icp_percentage"]').fill('');
        await frame.locator('[name="year1_market_share_target"]').fill('');
        await frame.locator('button').click();
        await frame.waitForSelector('#results:not([hidden])');
        assert.match(await frame.locator('#assumptions').textContent(), /Example assumptions used/);
        await frame.locator('[name="icp_percentage"]').fill('101');
        assert.equal(await frame.locator('[name="icp_percentage"]').evaluate(e => e.validity.rangeOverflow), true);
        await frame.locator('[name="icp_percentage"]').fill('40');
        await frame.locator('[name="average_contract_value"]').fill('0');
        await frame.locator('button').click();
        assert.match(await frame.locator('#status').textContent(), /greater than 0/);
        assert.equal(await frame.locator('#results').isVisible(), false);
        await frame.locator('[name="average_contract_value"]').fill('5000');
        await frame.locator('[name="segment_name"]').fill('<img src=x onerror="alert(1)">');
        await frame.locator('button').click();
        await frame.waitForSelector('#results:not([hidden])');
        assert.equal(await frame.locator('#segment img').count(), 0);
        // A forged message from the child itself must be ignored.
        const before = await frame.locator('#segment').textContent();
        await frame.evaluate(() => window.postMessage({ jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: { structuredContent: { inputs: { total_potential_companies: 1, average_contract_value: 1, segment_name: 'FORGED' } } } }, '*'));
        await page.waitForTimeout(50);
        assert.equal(await frame.locator('#segment').textContent(), before);
        if (hosted) {
            await page.evaluate(() => document.querySelector('iframe').contentWindow.postMessage({ jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: { isError: true } }, '*'));
            await frame.waitForSelector('#results[hidden]', { state: 'attached' });
            assert.match(await frame.locator('#status').textContent(), /returned an error/);
        }
        for (const [key, value] of Object.entries(fixture)) {
            await frame.locator('[name="' + key + '"]').fill(String(value));
        }
        await frame.locator('button').click();
        await frame.waitForSelector('#results:not([hidden])');
        await page.setViewportSize({ width: 390, height: 844 });
        assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.screenshot({ path: 'work/market-sizing/screenshots/' + mode + '-mobile.png', fullPage: true });
        await frame.locator('[name="total_potential_companies"]').focus();
        await page.keyboard.press('Tab');
        assert.equal(await frame.locator('[name="average_contract_value"]').evaluate(e => e === document.activeElement), true);
        assert.equal(await frame.evaluate(() => localStorage.length + sessionStorage.length), 0);
        assert.deepEqual(await page.context().cookies(), []);
        assert.deepEqual(errors, []);
        assert.deepEqual(external, []);
        receipts.push({ mode, pass: 1, fail: 0, checks: ['exact labelled fixture', 'changed count and scenarios and trace', 'zero rate', 'blank example assumptions', 'zero ACV refusal', 'inert untrusted values', 'forged source ignored', '390px no horizontal overflow', 'keyboard tab order', 'no external requests or page errors'], hostedErrorChecked: hosted });
        await page.close();
    }
}
catch (e) {
    failures++;
    receipts.push({ error: e.stack });
}
finally {
    await browser.close();
    writeFileSync('work/market-sizing/browser.json', JSON.stringify({ pass: receipts.filter(x => x.pass).length, fail: failures, skip: 0, receipts }, null, 2));
    console.log(JSON.stringify(receipts, null, 2));
}
if (failures)
    process.exitCode = 1;
