/**
 * 测试模板字符串问题
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
        name: '测试 1：简单中文 + 变量',
        input: "XZMessage.info(`下载 ${files.length} 个文件，请稍候...`)",
    },
    {
        name: '测试 2：变量 + 中文',
        input: "XZMessage.success(`${files.length} 个文件下载完成，请在浏览器下载目录中查找`)",
    },
    {
        name: '测试 3：变量 + 中文 + 变量',
        input: "const msg = `开始：${start}，总计：${total} 个文件`",
    },
];

console.log('========================================');
console.log('  模板字符串测试');
console.log('========================================\n');

tests.forEach(({ name, input }) => {
    console.log(`${name}:`);
    console.log(`输入: ${input}`);

    try {
        const result = replaceJavaScript(input, 'test.js', VueI18nInstance, {});
        console.log(`输出: ${result}`);
        console.log('');

        // 检查是否有问题
        if (result.includes('$lang(\'${') || result.includes('$lang("${')) {
            console.log('❌ 有问题：$lang 参数中包含 ${');
        } else if (result.includes('${$lang(') && !result.includes('${$lang(\'')) {
            console.log('⚠️  可能有问题：未转义的 $lang');
        } else {
            console.log('✅ 看起来正常');
        }
    } catch (e) {
        console.log(`❌ 错误: ${e.message}`);
    }
    console.log('');
    console.log('---');
    console.log('');
});
