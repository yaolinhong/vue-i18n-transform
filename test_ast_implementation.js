/**
 * AST 实现验证测试
 * 测试 Vue AST 解析器的各项功能
 */

const VueI18nInstance = require('./lib/i18nFile').VueI18nInstance;
const { astReplaceVueTemplate } = require('./lib/core/ast');

// 初始化 VueI18nInstance
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

// 模拟消息对象
const msg = {
    warn: console.warn,
    info: console.info
};

// 测试用例
const testCases = [
    {
        name: '简单文本替换',
        input: `<template><div>这是中文文本</div></template>`,
        expectContains: '$lang('
    },
    {
        name: '属性值替换',
        input: `<template><div title="中文标题">内容</div></template>`,
        expectContains: ':title="$lang'
    },
    {
        name: '跳过已包含 $lang',
        input: `<template><div>{{$lang('已处理的文本')}}</div></template>`,
        expectNoChange: true
    },
    {
        name: 'URL 跳过',
        input: `<template><img src="/中文图片.png" alt="中文描述"></template>`,
        expectNotContains: ['src="$lang', 'src=\'$lang']
    },
    {
        name: '混合内容',
        input: `<template><div>中文前缀 {{ variable }} 后缀中文</div></template>`,
        expectContains: '$lang('
    },
    {
        name: '插值中的中文',
        input: `<template><div>{{ '中文插值' }}</div></template>`,
        expectContains: '$lang('
    },
    {
        name: '模板字符串',
        input: '<template><div>{{ `中文${变量}更多中文` }}</div></template>',
        expectContains: '$lang('
    }
];

console.log('========================================');
console.log('  Vue AST 解析器测试套件');
console.log('========================================\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
    console.log(`测试 ${index + 1}: ${testCase.name}`);

    try {
        const result = astReplaceVueTemplate(
            testCase.input,
            `test_${index}.vue`,
            VueI18nInstance,
            msg
        );

        let success = true;
        let reason = '';

        if (testCase.expectNoChange) {
            // 期望内容不变
            if (result !== testCase.input) {
                success = false;
                reason = '内容不应该改变但发生了改变';
            }
        } else if (testCase.expectContains) {
            // 期望包含特定内容
            if (!result.includes(testCase.expectContains)) {
                success = false;
                reason = `期望包含: ${testCase.expectContains}`;
            }
        } else if (testCase.expectNotContains) {
            // 期望不包含特定内容
            const containsAny = testCase.expectNotContains.some(str => result.includes(str));
            if (containsAny) {
                success = false;
                reason = `不应该包含: ${testCase.expectNotContains.join(' 或 ')}`;
            }
        }

        if (success) {
            console.log(`  ✅ 通过`);
            passed++;
        } else {
            console.log(`  ❌ 失败: ${reason}`);
            console.log(`     输入: ${testCase.input}`);
            console.log(`     输出: ${result}`);
            failed++;
        }

    } catch (error) {
        console.log(`  ❌ 异常: ${error.message}`);
        console.log(`     ${error.stack}`);
        failed++;
    }

    console.log('');
});

// 输出测试结果摘要
console.log('========================================');
console.log('  测试结果摘要');
console.log('========================================\n');
console.log(`通过: ${passed}/${testCases.length}`);
console.log(`失败: ${failed}/${testCases.length}`);

if (passed === testCases.length) {
    console.log('\n🎉 所有测试通过！');
    process.exit(0);
} else {
    console.log('\n⚠️  存在失败的测试用例');
    process.exit(1);
}
