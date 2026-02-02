/**
 * 测试模板字符串修复
 */

const replaceJavaScript = require('./lib/core/replaceJavaScript').default;
const VueI18nInstance = require('./lib/i18nFile').VueI18nInstance;

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

const tests = [
    {
        name: '用户的问题场景',
        input: `ElMessageBox.confirm(\`确定要删除文件夹 "\${folderDocument.name}" 吗？\`, '删除确认', ...)`,
    },
    {
        name: '简单中文',
        input: "`确定要删除文件夹吗？`",
    },
    {
        name: '中文 + 变量',
        input: "`确定 ${files.length} 个文件`",
    },
    {
        name: '变量 + 中文 + 变量',
        input: "`开始：\${start}，总计：\${total} 个`",
    },
];

console.log('========================================');
console.log('  模板字符串修复测试');
console.log('========================================\n');

tests.forEach(({ name, input }) => {
    console.log(`${name}:`);
    console.log(`输入: ${input}`);
    console.log('');

    try {
        const result = replaceJavaScript(input, 'test.ts', VueI18nInstance, {});
        console.log(`输出: ${result}`);
        console.log('');

        // 检查是否有问题
        const hasIssue = result.includes('${${') || result.includes('${$lang(\'${');
        console.log(hasIssue ? '❌ 有问题' : '✅ 正常');
    } catch (e) {
        console.log(`❌ 错误: ${e.message}`);
    }

    console.log('');
    console.log('---');
    console.log('');
});
