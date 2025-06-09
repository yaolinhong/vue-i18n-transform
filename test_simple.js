// 直接引入并测试我们的函数
const replaceJavaScript = require('./lib/core/replaceJavaScript').default;

// 模拟 VueI18nInstance
const mockVueI18nInstance = {
    getCurrentKey: (text, file) => {
        // 简单地返回一个基于文本的key
        return text.replace(/[^\u4e00-\u9fa5]/g, '').substring(0, 10);
    },
    setMessageItem: (key, value) => {
        console.log(`设置翻译: ${key} -> ${value}`);
    }
};

// 测试代码
const testCode = `XZMessage.info(\`按钮foo \${hasAuth ? '有权限' : '没有权限'}\`);`;

console.log('原始代码:');
console.log(testCode);

console.log('\n处理后代码:');
const result = replaceJavaScript(testCode, 'test.js', mockVueI18nInstance);
console.log(result); 