// 手动测试脚本
const fs = require('fs');

// 读取并执行replaceJavaScript函数
const replaceJavaScript = require('./lib/core/replaceJavaScript.js').default;

// 模拟VueI18nInstance
const mockInstance = {
    getCurrentKey: (text, file) => {
        return text.replace(/[^\u4e00-\u9fa5]/g, '');
    },
    setMessageItem: (key, value) => {
        console.log(`KEY: ${key} = VALUE: ${value}`);
    }
};

// 测试代码
const testCode = `XZMessage.info(\`按钮foo \${hasAuth ? '有权限' : '没有权限'}\`);`;

console.log('原始代码:');
console.log(testCode);
console.log('\n转换后:');

const result = replaceJavaScript(testCode, 'test.js', mockInstance);
console.log(result); 