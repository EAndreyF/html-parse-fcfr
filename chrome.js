const puppeteer = require('puppeteer');
const path = require('path');

const result = [];
let total = 0;
let stack = [];

(async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto(`file:${path.join(__dirname, 'init.htm')}`);

    const children = await page.evaluateHandle(() => Array.from(document.body.children));
    stack = stack.concat(children.reverse())

    while (stack.length) {
        const node = stack.pop();
        const children = await page.evaluateHandle(node => Array.from(node.children), node)

        if (children.length > 0) {
            stack = stack.concat(children.reverse())
            continue;
        }
    }

    await browser.close();
})();
