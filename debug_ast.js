/**
 * AST 调试脚本
 * 查看 Vue 编译器的输出
 */

const { compile, generate } = require('@vue/compiler-dom');

const testTemplate = `<template><div>这是中文文本</div></template>`;

console.log('========================================');
console.log('  Vue 编译器调试');
console.log('========================================\n');

console.log('输入模板:');
console.log(testTemplate);
console.log('\n');

try {
    // 编译模板
    const ast = compile(testTemplate, {
        mode: 'module'
    });

    console.log('编译后的 AST:');
    console.log(JSON.stringify(ast, null, 2));
    console.log('\n');

    // 生成代码
    const generated = generate(ast, { mode: 'module' });
    console.log('生成的代码:');
    console.log(generated.code);
    console.log('\n');

    // 尝试直接生成
    const code = generate(ast);
    console.log('直接生成:');
    console.log(JSON.stringify(code, null, 2));

} catch (error) {
    console.error('错误:', error.message);
    console.error(error.stack);
}
