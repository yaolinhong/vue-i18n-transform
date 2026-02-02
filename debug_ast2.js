/**
 * AST 调试脚本 2
 * 查看属性值的结构
 */

const { compile } = require('@vue/compiler-dom');

const testTemplate = `<template><div title="中文标题">内容</div></template>`;

console.log('========================================');
console.log('  属性值结构调试');
console.log('========================================\n');

try {
    const result = compile(testTemplate, { mode: 'module' });
    const ast = result.ast;

    // 找到 div 元素
    const template = ast.children[0];
    const div = template.children[0];

    console.log('div 元素:');
    console.log(JSON.stringify(div, null, 2));
    console.log('\n');

    console.log('div.props:');
    console.log(JSON.stringify(div.props, null, 2));

} catch (error) {
    console.error('错误:', error.message);
    console.error(error.stack);
}
