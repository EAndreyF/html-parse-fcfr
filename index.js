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

const LETTERS = {
    0: 'A',
    1: 'B',
    2: 'C',
    3: 'D',
    4: 'E',
    5: 'F',
}

while (stack.length) {
    const node = stack.pop();
    if (node.children.length > 0) {
        stack = stack.concat(Array.from(node.children).reverse())
        continue;
    }

    if (ihead(node.textContent) === 0) {
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

        let name = node.textContent.trim();
        if (ihead(name) === 0) {
            stack.push(node);
            break;
        }

        if (itheme(name) === 0) {
            if (iquest(name) !== -1) {
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

        if (itheme(node.textContent) === 0) {
            stack.push(node);
            break;
        }

        let name = node.textContent.trim();
        if (iquest(name) === 0) {
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

        let name = node.textContent.trim();
        if (ianswer(name) === 0) {
            break;
        }

        if (ianswer(name) !== -1) {
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
    let cases = [];
    let answer;

    while (stack.length) {
        const node = stack.pop();
        if (node.children.length > 0) {
            stack = stack.concat(Array.from(node.children).reverse())
            continue;
        }

        const text = node.textContent.trim();
        if (ihead(text) !== -1 || itheme(text) !== -1 || iquest(text) !== -1) {
            stack.push(node);
            break;
        }

        if (text.length === 0) {
            continue;
        }

        cases.push(text);

        if (node.tagName === 'H1') {
            answer = cases.length;
        }
    }

    if (!answer) {
        console.log(cases)
    }

    cases = cases.map((el, i) => `${LETTERS[i]}. ${el}`)

    return {cases, answer};
}

function createElementFromHTML(htmlString) {
    const tmpNode = new JSDOM(htmlString);
    return tmpNode.window.document.body.children[0];
}

function ihead(str) {
    return str.indexOf('Глава ');
}

function itheme(str) {
    return str.indexOf('Тема ');
}

function iquest(str) {
    return str.indexOf('Код вопроса:');
}

function ianswer(str) {
    return str.indexOf('Ответы:');
}

fs.writeFileSync('./answer.json', JSON.stringify(result, null, 4), 'utf8');
console.log(util.inspect(result, {depth: 8}))
console.log(total);
