/**
 * AST 调试脚本 3
 * 查看插值节点的结构
 */

const { compile } = require('@vue/compiler-dom');

const testCases = [
    `<template><div>{{ '中文插值' }}</div></template>`,
    `<template><div>{{ \`中文\${变量}更多中文\` }}</div></template>`,
    `<template><div>中文前缀 {{ variable }} 后缀中文</div></template>`
];

console.log('========================================');
console.log('  插值节点结构调试');
console.log('========================================\n');

testCases.forEach((testTemplate, index) => {
    console.log(`测试 ${index + 1}: ${testTemplate}`);
    console.log('');

    try {
        const result = compile(testTemplate, { mode: 'module' });
        const ast = result.ast;

        const template = ast.children[0];
        const div = template.children[0];

        console.log('div.children:');
        console.log(JSON.stringify(div.children, null, 2));
        console.log('\n');

        // 查找插值节点
        function findInterpolation(node, path = '') {
            if (node.type === 5) {
                console.log(`找到插值节点 (${path}):`);
                console.log(JSON.stringify(node, null, 2));
                console.log('');
                return;
            }
            if (node.children) {
                node.children.forEach((child, i) => {
                    findInterpolation(child, `${path}.children[${i}]`);
                });
            }
        }

        findInterpolation(div, 'div');

    } catch (error) {
        console.error('错误:', error.message);
    }

    console.log('---');
    console.log('');
});
