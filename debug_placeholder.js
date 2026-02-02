/**
 * 测试占位符逻辑
 */

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

const input = "const msg = $lang('您好，您订阅的IDEAFUSION');";

console.log('========================================');
console.log('  占位符测试');
console.log('========================================\n');
console.log('输入:', input);
console.log('');

// 模拟处理过程
let content = input;
const comments = {};
let commentsIndex = 0;

// 1. 移除 $lang() 调用
content = content.replace(/\$lang\(\s*['"`]((?:(?!\1)[^\\]|\\.)*?)['"`]\s*\)/gim, function (match) {
    const key = "/*comment_".concat(commentsIndex++, "*/");
    comments[key] = match;
    console.log(`替换: ${match} -> ${key}`);
    return key;
});

console.log('');
console.log('移除 $lang 后:', content);
console.log('');
console.log('占位符:', comments);
console.log('');

// 2. 恢复占位符
content = content.replace(/\/\*comment_\d+\*\//gim, function (match) {
    console.log(`恢复: ${match} -> ${comments[match]}`);
    return comments[match];
});

console.log('');
console.log('恢复后:', content);
