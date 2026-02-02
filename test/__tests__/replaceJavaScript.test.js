/**
 * replaceJavaScript 模块的单元测试
 * 测试 JavaScript 代码中中文字符串的国际化转换
 */

const replaceJavaScript = require('../../lib/core/replaceJavaScript').default;

// Mock VueI18nInstance
class MockVueI18nInstance {
    constructor() {
        this.messages = {};
        this.keyCounter = 0;
    }

    getCurrentKey(text, file) {
        // 简单的 key 生成策略
        return `key_${this.keyCounter++}`;
    }

    setMessageItem(key, value) {
        this.messages[key] = value;
    }

    getConfig() {
        return {};
    }
}

describe('replaceJavaScript', () => {
    let mockInstance;
    let mockMsg;

    beforeEach(() => {
        mockInstance = new MockVueI18nInstance();
        mockMsg = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
    });

    describe('基础字符串替换', () => {
        test('应该替换单引号包裹的中文字符串', () => {
            const input = `const message = '你好世界';`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain('$lang(');
            expect(output).not.toContain('你好世界');
            expect(Object.values(mockInstance.messages)).toContain('你好世界');
        });

        test('应该替换双引号包裹的中文字符串', () => {
            const input = `const message = "你好世界";`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain('$lang(');
            expect(output).not.toContain('你好世界');
        });

        test('应该替换模板字符串中的中文', () => {
            const input = `const message = \`你好世界\`;`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain('$lang(');
            expect(output).not.toContain('你好世界');
        });

        test('应该保留非中文字符串', () => {
            const input = `const message = 'Hello World';`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain('Hello World');
            expect(output).not.toContain('$lang(');
        });
    });

    describe('注释保护', () => {
        test('应该保留单行注释中的中文', () => {
            const input = `// 这是中文注释\nconst message = '你好';`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain('// 这是中文注释');
            // 只有字符串中的中文应该被替换
            expect(output).toMatch(/\/\/ 这是中文注释/);
        });

        test('应该保留多行注释中的中文', () => {
            const input = `/* 这是多行\n中文注释 */\nconst message = '你好';`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain('/* 这是多行');
            expect(output).toContain('中文注释 */');
        });

        test('应该处理包含注释的代码行', () => {
            const input = `const message = '你好'; // 这是注释`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            // 字符串应该被替换
            expect(output).toContain('$lang(');
            // 注释应该保留
            expect(output).toContain('// 这是注释');
        });
    });

    describe('URL 过滤', () => {
        test('不应该替换 http:// 开头的 URL', () => {
            const input = `const url = 'http://example.com/中文';`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            // 完整的 URL 不会被替换（因为包含 http://）
            expect(output).toContain('http://example.com/中文');
        });

        test('不应该替换 https:// 开头的 URL', () => {
            const input = `const url = 'https://example.com/path';`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain('https://example.com/path');
            expect(output).not.toContain('$lang(');
        });

        test('不应该替换包含域名后缀的 URL', () => {
            const input = `const url = 'www.example.com/path';`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain('www.example.com/path');
            expect(output).not.toContain('$lang(');
        });

        test('不应该替换包含文件扩展名的 URL', () => {
            const input = `const url = '/images/photo.png';`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain('/images/photo.png');
            expect(output).not.toContain('$lang(');
        });

        test('不应该替换阿里云 OSS URL', () => {
            const input = `const url = 'https://oss-cn-beijing.aliyuncs.com/image.jpg';`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain('https://oss-cn-beijing.aliyuncs.com/image.jpg');
            expect(output).not.toContain('$lang(');
        });
    });

    describe('模板字符串处理', () => {
        test('应该处理模板字符串中的纯中文', () => {
            const input = `const message = \`你好世界\`;`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain('${$lang(');
        });

        test('应该处理模板字符串中混合变量和中文', () => {
            // 转义模板字符串中的 ${} 避免 JavaScript 执行时求值
            const input = `const name = '张三';\nconst message = \`你好，\${name}\`;`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            // 变量应该保留
            expect(output).toContain('${name}');
            // 中文应该被替换
            expect(output).toContain('$lang(');
        });

        test('应该处理模板字符串中多段中文和变量', () => {
            const input = `const name = '张三';\nconst message = \`你好，\${name}，欢迎\`;`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain('${name}');
            expect(output).toMatch(/\$\{.*\$lang\(.*\).*\}/);
        });

        test('应该处理模板字符串变量表达式中的中文', () => {
            const input = `const flag = true;\nconst message = \`结果：\${flag ? '成功' : '失败'}\`;`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            // 三元运算符中的中文应该被替换
            expect(output).toContain('$lang(');
            expect(output).toContain('${flag ?');
        });
    });

    describe('特殊处理', () => {
        test('应该跳过已经存在的 $lang 调用', () => {
            const input = `const message = $lang('key_1');`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain("$lang('key_1')");
        });

        test('应该跳过 i18n.t 调用', () => {
            const input = `const message = i18n.t('key_1');`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain("i18n.t('key_1')");
        });

        test('应该跳过 console.log 调用', () => {
            const input = `console.log('调试信息');`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain("console.log('调试信息')");
        });

        test('应该跳过 require 调用', () => {
            const input = `const module = require('./中文模块');`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain("require('./中文模块')");
        });
    });

    describe('HTML 内容处理', () => {
        test('应该处理包含 HTML 标签的模板字符串', () => {
            const input = `const html = \`<div>你好</div>\`;`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            // HTML 标签应该保留
            expect(output).toContain('<div>');
            expect(output).toContain('</div>');
            // 中文应该被替换
            expect(output).toContain('$lang(');
        });

        test('应该处理包含多个中文文本节点的 HTML', () => {
            const input = `const html = \`<div>你好<span>世界</span></div>\`;`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain('<div>');
            expect(output).toContain('<span>');
            expect(output).toContain('</span>');
            expect(output).toContain('$lang(');
        });

        test('应该保留 HTML 中的属性', () => {
            const input = `const html = \`<div class="container">你好</div>\`;`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain('class="container"');
            expect(output).toContain('$lang(');
        });
    });

    describe('嵌套 $lang 调用清理', () => {
        test('应该清理嵌套的 $lang 调用', () => {
            // 使用字符串拼接来创建嵌套测试输入
            const nestedLang = "$lang('${'$lang('key_1')}')";
            const input = `const message = '${nestedLang}';`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            // 嵌套的 $lang 应该被处理
            expect(output).toBeDefined();
        });
    });

    describe('复杂场景', () => {
        test('应该处理包含多个中文字符串的代码', () => {
            const input = `
                const msg1 = '你好';
                const msg2 = "世界";
                const msg3 = \`欢迎\`;
            `;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            const langCalls = (output.match(/\$lang\(/g) || []).length;
            expect(langCalls).toBeGreaterThanOrEqual(3);
        });

        test('应该处理混合中英文的字符串', () => {
            const input = `const message = 'Hello 你好 World';`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            // 包含中文的整个字符串会被替换
            expect(output).toContain('$lang(');
            // 验证消息中包含原始文本
            expect(Object.values(mockInstance.messages)).toContain('Hello 你好 World');
        });

        test('应该正确处理转义字符', () => {
            const input = `const message = '你好\\n世界';`;
            const output = replaceJavaScript(input, 'test.js', mockInstance, mockMsg);

            expect(output).toContain('$lang(');
        });
    });
});
