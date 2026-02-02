/**
 * AST 调试脚本 4
 * 查看 $lang 调用的结构
 */

const { compile } = require('@vue/compiler-dom');

const testTemplate = `<template><div>{{$lang('已处理的文本')}}</div></template>`;

console.log('========================================');
console.log('  $lang 调用结构调试');
console.log('========================================\n');

try {
    const result = compile(testTemplate, { mode: 'module' });
    const ast = result.ast;

    const template = ast.children[0];
    const div = template.children[0];

    console.log('div.children:');
    console.log(JSON.stringify(div.children, null, 2));

    const interpolation = div.children[0];
    console.log('\n插值节点的 content:');
    console.log(JSON.stringify(interpolation.content, null, 2));

    console.log('\ncontent.content:', interpolation.content.content);
    console.log('content.type:', interpolation.content.type);
    console.log('是否包含 $lang:', interpolation.content.content.includes('$lang'));

} catch (error) {
    console.error('错误:', error.message);
    console.error(error.stack);
}
