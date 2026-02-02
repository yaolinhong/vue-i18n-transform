/**
 * 测试严重问题
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

const input = `return ElMessageBox.confirm(
    \`确定要删除文件夹 "\${folderDocument.name}" 吗？\`,
    '删除确认',
    {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        buttonSize: 'small',
    },
);`;

console.log('========================================');
console.log('  严重问题测试');
console.log('========================================\n');
console.log('输入:');
console.log(input);
console.log('\n');

try {
    const result = replaceJavaScript(input, 'test.ts', VueI18nInstance, {});
    console.log('输出:');
    console.log(result);
} catch (e) {
    console.log(`错误: ${e.message}`);
    console.log(e.stack);
}
