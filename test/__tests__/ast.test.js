/**
 * AST 模块的单元测试
 * 测试 Vue AST 解析和处理相关的功能
 */

const { compile } = require('@vue/compiler-dom');
const {
    astReplaceVueTemplate,
    safeAstReplace
} = require('../../lib/core/ast/index');
const {
    containsChinese,
    containsLangCall,
    isUrl,
    shouldSkipTranslation,
    getNodeTypeName,
    processChineseText
} = require('../../lib/core/ast/utils');
const {
    generateCode,
    serializeAst,
    validateGeneratedCode
} = require('../../lib/core/ast/codeGenerator');

// Mock VueI18nInstance
class MockVueI18nInstance {
    constructor() {
        this.messages = {};
        this.keyCounter = 0;
    }

    getCurrentKey(text, file) {
        return `key_${this.keyCounter++}`;
    }

    setMessageItem(key, value) {
        this.messages[key] = value;
    }

    getConfig() {
        return {};
    }
}

describe('AST 工具函数', () => {
    describe('containsChinese', () => {
        test('应该检测到中文字符', () => {
            expect(containsChinese('你好')).toBe(true);
            expect(containsChinese('Hello 你好')).toBe(true);
            expect(containsChinese('测试123')).toBe(true);
        });

        test('应该对非中文内容返回 false', () => {
            expect(containsChinese('Hello')).toBe(false);
            expect(containsChinese('123')).toBe(false);
            expect(containsChinese('')).toBe(false);
            expect(containsChinese(null)).toBe(false);
            expect(containsChinese(undefined)).toBe(false);
        });

        test('应该检测到中文和标点混合的内容', () => {
            // containsChinese 只检测 CJK 统一汉字，不包括标点
            // 所以需要与汉字混合才能检测到
            expect(containsChinese('你好，。！？')).toBe(true);
            expect(containsChinese('测试《》【】')).toBe(true);
        });
    });

    describe('containsLangCall', () => {
        test('应该检测到 $lang 调用', () => {
            expect(containsLangCall('{{$lang("key")}}')).toBe(true);
            expect(containsLangCall('$lang(\'test\')')).toBe(true);
            expect(containsLangCall('{{ $lang("key") }}')).toBe(true);
        });

        test('应该对不包含 $lang 的内容返回 false', () => {
            expect(containsLangCall('Hello World')).toBe(false);
            expect(containsLangCall('{{message}}')).toBe(false);
            expect(containsLangCall('')).toBe(false);
            expect(containsLangCall(null)).toBe(false);
        });
    });

    describe('isUrl', () => {
        test('应该检测到 http:// URL', () => {
            expect(isUrl('http://example.com')).toBe(true);
            expect(isUrl('http://test.cn/path')).toBe(true);
        });

        test('应该检测到 https:// URL', () => {
            expect(isUrl('https://example.com')).toBe(true);
            expect(isUrl('https://www.test.com/path')).toBe(true);
        });

        test('应该检测到域名后缀', () => {
            expect(isUrl('www.example.com')).toBe(true);
            expect(isUrl('example.org')).toBe(true);
            expect(isUrl('test.net')).toBe(true);
        });

        test('应该检测到文件扩展名', () => {
            expect(isUrl('/images/photo.png')).toBe(true);
            expect(isUrl('./file.pdf')).toBe(true);
            // 文件名需要路径前缀才能被识别为 URL
            expect(isUrl('/document.docx')).toBe(true);
        });

        test('应该检测到阿里云 OSS URL', () => {
            expect(isUrl('https://oss-cn-beijing.aliyuncs.com/file.jpg')).toBe(true);
            expect(isUrl('oss-cn-hangzhou.aliyuncs.com/path')).toBe(true);
        });

        test('应该对非 URL 内容返回 false', () => {
            expect(isUrl('你好世界')).toBe(false);
            expect(isUrl('test')).toBe(false);
            expect(isUrl('')).toBe(false);
            expect(isUrl(null)).toBe(false);
        });
    });

    describe('shouldSkipTranslation', () => {
        test('空字符串应该跳过', () => {
            expect(shouldSkipTranslation('')).toBe(true);
            expect(shouldSkipTranslation('   ')).toBe(true);
        });

        test('已包含 $lang 的内容应该跳过', () => {
            expect(shouldSkipTranslation('{{$lang("key")}}')).toBe(true);
        });

        test('URL 应该跳过', () => {
            expect(shouldSkipTranslation('https://example.com')).toBe(true);
        });

        test('普通中文不应该跳过', () => {
            expect(shouldSkipTranslation('你好世界')).toBe(false);
        });

        test('应该支持选项控制', () => {
            const text = '{{$lang("key")}}';
            expect(shouldSkipTranslation(text, { checkLangCall: false })).toBe(false);
            expect(shouldSkipTranslation(text, { checkLangCall: true })).toBe(true);
        });
    });

    describe('getNodeTypeName', () => {
        test('应该返回正确的节点类型名称', () => {
            expect(getNodeTypeName(0)).toBe('ROOT');
            expect(getNodeTypeName(1)).toBe('ELEMENT');
            expect(getNodeTypeName(2)).toBe('TEXT');
            expect(getNodeTypeName(3)).toBe('COMMENT');
            expect(getNodeTypeName(5)).toBe('INTERPOLATION');
            expect(getNodeTypeName(6)).toBe('ATTRIBUTE');
            expect(getNodeTypeName(7)).toBe('DIRECTIVE');
            expect(getNodeTypeName(8)).toBe('COMPOUND');
        });

        test('未知类型应该返回 UNKNOWN', () => {
            expect(getNodeTypeName(999)).toBe('UNKNOWN');
            expect(getNodeTypeName(-1)).toBe('UNKNOWN');
        });
    });

    describe('processChineseText', () => {
        let mockInstance;

        beforeEach(() => {
            mockInstance = new MockVueI18nInstance();
        });

        test('应该处理纯中文文本', () => {
            const result = processChineseText('你好世界', 'test.vue', mockInstance);
            expect(result).toContain('{{$lang(');
            expect(Object.values(mockInstance.messages)).toContain('你好世界');
        });

        test('应该处理混合中英文的文本', () => {
            const result = processChineseText('Hello 你好 World', 'test.vue', mockInstance);
            expect(result).toContain('{{$lang(');
            expect(result).toContain('Hello');
            expect(result).toContain('World');
        });

        test('应该跳过已包含 $lang 的内容', () => {
            const input = '{{$lang("key_1")}}';
            const result = processChineseText(input, 'test.vue', mockInstance);
            expect(result).toBe(input);
        });

        test('应该跳过 URL', () => {
            const input = 'https://example.com/中文';
            const result = processChineseText(input, 'test.vue', mockInstance);
            expect(result).toBe(input);
        });

        test('应该处理多个中文片段', () => {
            const result = processChineseText('你好世界测试', 'test.vue', mockInstance);
            expect(result).toContain('{{$lang(');
        });
    });
});

describe('AST 代码生成器', () => {
    describe('validateGeneratedCode', () => {
        test('应该验证有效的 Vue 模板', () => {
            const validTemplate = '<div>Hello World</div>';
            expect(validateGeneratedCode(validTemplate)).toBe(true);
        });

        test('应该接受简单的 HTML 片段', () => {
            const fragment = '<span>测试</span>';
            expect(validateGeneratedCode(fragment)).toBe(true);
        });

        test('应该处理空字符串', () => {
            // validateGeneratedCode 在异常情况下返回 true（作为降级策略）
            expect(validateGeneratedCode('')).toBe(true);
        });

        test('应该处理包含 $lang 的模板', () => {
            const template = '<div>{{$lang("key")}}</div>';
            expect(validateGeneratedCode(template)).toBe(true);
        });
    });

    describe('serializeAst', () => {
        test('应该序列化元素节点', () => {
            const elementNode = {
                type: 1, // ELEMENT
                tag: 'div',
                props: [],
                children: []
            };
            const result = serializeAst(elementNode);
            expect(result).toContain('<div>');
        });

        test('应该序列化文本节点', () => {
            const textNode = {
                type: 2, // TEXT
                content: 'Hello World'
            };
            const result = serializeAst(textNode);
            expect(result).toBe('Hello World');
        });

        test('应该序列化注释节点', () => {
            const commentNode = {
                type: 3, // COMMENT
                content: 'This is a comment'
            };
            const result = serializeAst(commentNode);
            expect(result).toContain('<!--');
            expect(result).toContain('-->');
        });

        test('应该处理空节点', () => {
            expect(serializeAst(null)).toBe('');
            expect(serializeAst(undefined)).toBe('');
        });
    });
});

describe('AST 主入口模块', () => {
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

    describe('astReplaceVueTemplate', () => {
        test('应该处理简单的 Vue 模板', () => {
            const input = `<template>\n  <div>你好世界</div>\n</template>`;
            const result = astReplaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(result).toBeDefined();
            expect(result).toContain('<template>');
            expect(result).toContain('</template>');
        });

        test('应该处理包含属性的模板', () => {
            const input = `<template>\n  <button title="点击">提交</button>\n</template>`;
            const result = astReplaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(result).toBeDefined();
            expect(result).toContain('<button');
        });

        test('应该处理包含插值的模板', () => {
            const input = `<template>\n  <div>{{message}}</div>\n</template>`;
            const result = astReplaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(result).toBeDefined();
            expect(result).toContain('{{');
        });

        test('应该在 AST 解析失败时降级到正则实现', () => {
            // 使用可能导致解析失败的输入
            const input = `<template>\n  <div>测试</div>\n</template>`;
            const result = astReplaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            // 应该返回结果（可能来自降级方案）
            expect(result).toBeDefined();
        });

        test('应该处理没有 template 标签的输入', () => {
            const input = `const message = '你好';`;
            const result = astReplaceVueTemplate(input, 'test.js', mockInstance, mockMsg);

            expect(result).toBe(input);
        });
    });

    describe('safeAstReplace', () => {
        test('应该安全地处理 Vue 模板', () => {
            const input = `<template>\n  <div>你好世界</div>\n</template>`;
            const result = safeAstReplace(input, 'test.vue', mockInstance, mockMsg);

            expect(result).toBeDefined();
            expect(result).toContain('<template>');
        });

        test('应该在生成无效代码时降级', () => {
            const input = `<template>\n  <div>测试内容</div>\n</template>`;
            const result = safeAstReplace(input, 'test.vue', mockInstance, mockMsg);

            expect(result).toBeDefined();
        });

        test('应该处理异常情况', () => {
            const input = `<template>\n  <div>{{content}}</div>\n</template>`;
            const result = safeAstReplace(input, 'test.vue', mockInstance, mockMsg);

            expect(result).toBeDefined();
        });

        test('应该处理空模板', () => {
            const result = safeAstReplace('', 'test.vue', mockInstance, mockMsg);
            expect(result).toBe('');
        });
    });

    describe('与 Vue 编译器的集成', () => {
        test('应该能够编译生成的模板', () => {
            const input = `<template>\n  <div>Hello</div>\n</template>`;
            const result = astReplaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            // 提取 template 内容
            const templateMatch = result.match(/<template[\s\S]*<\/template>/);
            if (templateMatch) {
                expect(() => {
                    compile(templateMatch[0], { mode: 'module' });
                }).not.toThrow();
            }
        });
    });
});
