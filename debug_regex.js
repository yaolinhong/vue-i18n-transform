/**
 * 测试正则表达式
 */

const input = "$lang('您好，您订阅的IDEAFUSION')";

console.log('========================================');
console.log('  正则表达式测试');
console.log('========================================\n');
console.log('输入:', input);
console.log('');

// 原正则（可能有问题的）
const regex1 = /\$lang\(\s*['"`]((?:(?!\1)[^\\]|\\.)*?)['"`]\s*\)/gim;
console.log('原正则: /\$lang\\(\\s*[\'"`]((?:(?!\\1)[^\\\\]|\\\\.)*?)[\'"`]\\s*\\)/');
console.log('匹配结果:', regex1.test(input));
console.log('');

// 简化的正则
const regex2 = /\$lang\(\s*['"`][^'"`]*['"`]\s*\)/gim;
console.log('简化正则: /\$lang\\(\\s*[\'"`][^\'"`]*[\'"`]\\s*\\)/');
console.log('匹配结果:', regex2.test(input));
console.log('');

// 更精确的正则（支持转义）
const regex3 = /\$lang\(\s*(['"`])((?:(?!\1)[^\\]|\\.)*?)\1\s*\)/gim;
console.log('精确正则: /\$lang\\(\\s*([\'"`])((?:(?!\\1)[^\\\\]|\\\\.)*?)\\1\\s*\\)/');
console.log('匹配结果:', regex3.test(input));
console.log('');

// 测试替换
let test1 = input;
test1 = test1.replace(regex1, (match) => {
    console.log(`原正则匹配到: ${match}`);
    return '/*PLACEHOLDER*/';
});
console.log('替换后:', test1);
console.log('');

let test2 = input;
test2 = test2.replace(regex2, (match) => {
    console.log(`简化正则匹配到: ${match}`);
    return '/*PLACEHOLDER*/';
});
console.log('替换后:', test2);
