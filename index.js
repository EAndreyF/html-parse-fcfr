const fs = require('fs');
const {JSDOM} = require('jsdom');
const util = require('util');

const content = fs.readFileSync('./init.htm', 'utf8');
const body = new JSDOM(content).window.document.querySelector('body');
const result = [];

let stack = Array.from(body.children).reverse();
let total = 0;

const NUMBERS = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII',
    9: 'IX',
    10: 'X',
}

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
        break;
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
                const tmpNode = createElementFromHTML(`<p>Код вопроса: ${tmp[1]}</p>`);
                stack.push(tmpNode);
            }

            const subs = getQuestion()
            const newNode = {
                index: theme.length,
                type: 'node',
                name,
                subs,
            }
            theme.push(newNode);
            return theme;
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
                const tmpNode = createElementFromHTML(`<p>${name.slice(idx)}</p>`);
                name = name.slice(0, idx);
                stack.push(tmpNode);
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
            if (questions.length > 3) {
                return questions;
            }
        }
    }

    return questions;
}

function getText() {
    let text = [];
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
            const tmpNode = createElementFromHTML(`<p>Ответы: ${tmp[1]}</p>`);
            stack.push(tmpNode);
        }

        if (name.length === 0) {
            continue;
        }

        text.push(name);
    }

    if (text.length === 1) {
        return text[0];
    }

    text = text.map((el, i) => {
        if (i === 0) {
            return el;
        }

        return `${NUMBERS[i]}. ${el}`;
    })

    return text.join('\n');
}

function getCases() {
    const text = [];
    stack.pop();
    return {};
}

function createElementFromHTML(htmlString) {
    const tmpNode = new JSDOM(htmlString);
    return tmpNode.window.document.body.children[0];
}

console.log(util.inspect(result, {depth: 5}))
console.log(total);
