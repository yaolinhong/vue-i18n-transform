/**
 * 调试嵌套 $lang 问题
 */

const { astReplaceVueTemplate } = require('./lib/core/ast');
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

// 测试用例
const testCases = [
    // 文本中已包含 $lang
    `<template><div>{{$lang('您好，您订阅的IDEAFUSION')}}</div></template>`,

    // 属性中已包含 $lang
    `<template><div :title="$lang('中文标题')"></div></template>`,

    // 混合内容中已包含 $lang
    `<template><div>前缀 {{$lang('已有内容')}} 后缀</div></template>`,
];

console.log('========================================');
console.log('  嵌套 $lang 调试');
console.log('========================================\n');

testCases.forEach((input, i) => {
    console.log(`测试 ${i + 1}:`);
    console.log(`输入: ${input}`);
    console.log('');

    try {
        const result = astReplaceVueTemplate(input, `test${i}.vue`, VueI18nInstance, msg);
        console.log(`输出: ${result}`);
        console.log('');

        // 检查是否有嵌套
        if (result.includes('$lang($lang(') || result.includes("$lang('${$lang(")) {
            console.log('❌ 发现嵌套 $lang！');
        } else {
            console.log('✅ 没有嵌套');
        }
    } catch (e) {
        console.log(`❌ 错误: ${e.message}`);
    }

    console.log('---');
    console.log('');
});
