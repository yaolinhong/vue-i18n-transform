// 手动调试脚本
const replaceJavaScript = require('./lib/core/replaceJavaScript.js').default;

const mockInstance = {
    getCurrentKey: (text, file) => {
        console.log(`处理文本: "${text}"`);
        return text.replace(/[^\u4e00-\u9fa5]/g, '');
    },
    setMessageItem: (key, value) => {
        console.log(`设置: ${key} = ${value}`);
    }
};

// 简单的三元表达式测试
const testCode = `hasAuth ? '有权限' : '没有权限'`;

console.log('测试代码:', testCode);
console.log('处理结果:', replaceJavaScript(testCode, 'test.js', mockInstance));

console.log('\n---\n');

// 模板字符串测试
const templateCode = `\`按钮foo \${hasAuth ? '有权限' : '没有权限'}\``;
console.log('模板字符串测试:', templateCode);
console.log('处理结果:', replaceJavaScript(templateCode, 'test.js', mockInstance)); 