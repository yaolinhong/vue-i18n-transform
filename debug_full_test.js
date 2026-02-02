/**
 * 全面测试 $lang 跳过逻辑
 */

const { astReplaceVueTemplate } = require('./lib/core/ast');
const replaceJavaScript = require('./lib/core/replaceJavaScript').default;
const VueI18nInstance = require('./lib/i18nFile').VueI18nInstance;

// 初始化
VueI18nInstance.mergeConfig({
    single: false,
    filename: 'zh_cn',
    entry: 'src',
    outdir: 'src/locales',
    exclude: ['src/locales'],
    extensions: ['.js', '.vue', '.ts'],
    useChineseKey: true,
    projectDirname: __dirname
});

const msg = {
    warn: console.warn,
    info: console.info
};

// 测试用例 - 模拟用户实际场景
const vueTests = [
    {
        name: 'Vue: 插值中的 $lang',
        input: `<template><div>{{$lang('您好，您订阅的IDEAFUSION')}}</div></template>`,
    },
    {
        name: 'Vue: 属性绑定中的 $lang',
        input: `<template><div :title="$lang('中文标题')">内容</div></template>`,
    },
    {
        name: 'Vue: 静态属性中的 $lang (不应该存在，但测试)',
        input: `<template><div title="{{$lang('xxx')}}"></div></template>`,
    },
    {
        name: 'Vue: 文本中直接有 $lang 字符串',
        input: `<template><div>$lang('直接文本')</div></template>`,
    },
];

const jsTests = [
    {
        name: 'JS: 字符串中的 $lang 调用',
        input: `const msg = $lang('您好，您订阅的IDEAFUSION');`,
    },
    {
        name: 'JS: 模板字符串中的 $lang',
        input: `const msg = \`前缀 \${$lang('中文')} 后缀\`;`,
    },
    {
        name: 'JS: 对象属性中的 $lang',
        input: `const obj = { title: $lang('标题') };`,
    },
];

console.log('========================================');
console.log('  Vue 模板测试');
console.log('========================================\n');

vueTests.forEach(({ name, input }) => {
    console.log(`${name}:`);
    console.log(`输入: ${input}`);

    try {
        const result = astReplaceVueTemplate(input, 'test.vue', VueI18nInstance, msg);
        console.log(`输出: ${result}`);

        // 检查嵌套
        const hasNested = result.includes('$lang($lang(') ||
                          result.includes("$lang('${$lang(") ||
                          result.includes('{{ $lang(');
        console.log(hasNested ? '❌ 有问题' : '✅ 正常');
    } catch (e) {
        console.log(`❌ 错误: ${e.message}`);
    }
    console.log('');
});

console.log('\n========================================');
console.log('  JavaScript 测试');
console.log('========================================\n');

jsTests.forEach(({ name, input }) => {
    console.log(`${name}:`);
    console.log(`输入: ${input}`);

    try {
        const result = replaceJavaScript(input, 'test.js', VueI18nInstance, msg);
        console.log(`输出: ${result}`);

        // 检查嵌套
        const hasNested = result.includes('$lang($lang(') ||
                          result.includes("$lang('${$lang(");
        console.log(hasNested ? '❌ 有问题' : '✅ 正常');
    } catch (e) {
        console.log(`❌ 错误: ${e.message}`);
    }
    console.log('');
});
