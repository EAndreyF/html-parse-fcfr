const fs = require('fs');
const {JSDOM} = require('jsdom');
const util = require('util');

const content = fs.readFileSync('./init.htm', 'utf8');
const body = new JSDOM(content).window.document.querySelector('body');
const result = [];

let stack = Array.from(body.children).reverse();
let total = 0;

while (stack.length) {
    const node = stack.pop();
    if (node.children.length > 0) {
        stack = stack.concat(Array.from(node.children).reverse())
        continue;
    }

    if (node.textContent.indexOf('Глава ') === 0) {
        const subs = getTheme()
        const newNode = {
            index: result.length,
            type: 'node',
            name: node.textContent.trim(),
            subs,
        }
        result.push(newNode);
    }
}

function getTheme() {
    const theme = [];

    while (stack.length) {
        const node = stack.pop();
        if (node.children.length > 0) {
            stack = stack.concat(Array.from(node.children).reverse())
            continue;
        }

        if (node.textContent.indexOf('Глава ') === 0) {
            stack.push(node);
            break;
        }

        let name = node.textContent.trim();
        if (name.indexOf('Тема ') === 0) {

            if (name.indexOf('Код вопроса') !== -1) {
                const tmp = name.split(' Код вопроса: ');
                name = tmp[0];
                const tmpNode = new JSDOM(`<p>Код вопроса: ${tmp[1]}</p>`);
                stack.push(tmpNode.window.document.body.children[0]);
            }

            const subs = getQuestion()
            const newNode = {
                index: theme.length,
                type: 'node',
                name,
                subs,
            }
            theme.push(newNode);
        }
    }

    return theme;
}

function getQuestion() {
    const questions = [];

    while (stack.length) {
        const node = stack.pop();
        if (node.children.length > 0) {
            stack = stack.concat(Array.from(node.children).reverse())
            continue;
        }

        if (node.textContent.indexOf('Тема ') === 0) {
            stack.push(node);
            break;
        }

        let name = node.textContent;
        if (name.indexOf('Код вопроса') === 0) {
            name = name.split('Код вопроса: ')[1];

            if (name.indexOf(' ') !== -1) {
                const idx = name.indexOf(' ');
                const tmpNode = new JSDOM(`<p>${name.slice(idx)}</p>`);
                name = name.slice(0, idx);
                stack.push(tmpNode.window.document.body.children[0]);
            }

            const text = getText();
            const {cases, answer} = getCases();
            const newNode = {
                index: questions.length,
                type: 'question',
                name,
                text,
                cases,
                answer,
            }
            questions.push(newNode);
            total++;
        }
    }

    return questions;
}

function getText() {
    const text = [];

    while (stack.length) {
        const node = stack.pop();
        if (node.children.length > 0) {
            stack = stack.concat(Array.from(node.children).reverse())
            continue;
        }

        let name = node.textContent;
        if (name.indexOf('Ответы:') === 0) {
            stack.push(node);
            break;
        }

        if (name.indexOf('Ответы:') !== -1) {
            const tmp = name.split('Ответы:');
            name = tmp[0];
            const tmpNode = new JSDOM(`<p>Ответы: ${tmp[1]}</p>`);
            stack.push(tmpNode.window.document.body.children[0]);
        }

        if (name.length === 0) {
            continue;
        }

        text.push(name);
    }

    return text.join('\n');
}

function getCases() {
    stack.pop();
    return {};
}

console.log(util.inspect(result, {depth: 5}))
console.log(total);
