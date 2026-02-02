/**
 * 测试占位符恢复
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

const input = "const msg = `前缀 ${$lang('中文')} 后缀`;";

console.log('========================================');
console.log('  占位符恢复测试');
console.log('========================================\n');
console.log('输入:', input);
console.log('');

const result = replaceJavaScript(input, 'test.js', VueI18nInstance, {});

console.log('输出:', result);
console.log('');

// 检查是否还有未恢复的占位符
const hasUnrestored = /\/\*comment_\d+\*\//.test(result) || /\/\*template_\d+\*\//.test(result);
console.log(hasUnrestored ? '❌ 有未恢复的占位符' : '✅ 所有占位符都已恢复');
