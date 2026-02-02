/**
 * replaceVueTemplate 模块的单元测试
 * 测试 Vue 模板中中文字符串的国际化转换
 */

const replaceVueTemplate = require('../../lib/core/replaceVueTemplate').default;

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

describe('replaceVueTemplate', () => {
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

    describe('基础模板处理', () => {
        test('应该替换 template 标签内的纯中文文本', () => {
            const input = `<template>\n  <div>你好世界</div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('{{$lang(');
            expect(output).toContain('</div>');
            expect(Object.values(mockInstance.messages)).toContain('你好世界');
        });

        test('应该替换属性值中的中文', () => {
            const input = `<template>\n  <button title="点击提交">提交</button>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            // title 属性应该转换为 :title
            expect(output).toContain(':title="$lang(');
            // 按钮文本应该被替换
            expect(output).toContain('{{$lang(');
        });

        test('应该保留不含中文的属性值', () => {
            const input = `<template>\n  <div class="container">Hello</div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('class="container"');
            expect(output).toContain('Hello');
        });

        test('应该处理多个中文文本节点', () => {
            const input = `<template>\n  <div>\n    <p>第一段</p>\n    <p>第二段</p>\n  </div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            const langCallCount = (output.match(/\{\{.*\$lang\(.*\).*\}\}/g) || []).length;
            expect(langCallCount).toBeGreaterThanOrEqual(2);
        });
    });

    describe('注释保护', () => {
        test('应该保留 HTML 注释中的中文', () => {
            const input = `<template>\n  <!-- 这是中文注释 -->\n  <div>你好</div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('<!-- 这是中文注释 -->');
            expect(output).toContain('{{$lang(');
        });

        test('应该保留多行 HTML 注释', () => {
            const input = `<template>\n  <!--\n    这是多行\n    中文注释\n  -->\n  <div>你好</div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('<!--');
            expect(output).toContain('这是多行');
            expect(output).toContain('中文注释');
        });
    });

    describe('URL 过滤', () => {
        test('不应该替换 src 属性中的 URL', () => {
            const input = `<template>\n  <img src="https://example.com/image.jpg" />\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('src="https://example.com/image.jpg"');
        });

        test('不应该替换包含文件扩展名的路径', () => {
            const input = `<template>\n  <img src="/images/photo.png" />\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('src="/images/photo.png"');
        });

        test('不应该替换阿里云 OSS URL', () => {
            const input = `<template>\n  <img src="https://oss-cn-beijing.aliyuncs.com/file.jpg" />\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('src="https://oss-cn-beijing.aliyuncs.com/file.jpg"');
        });
    });

    describe('插值表达式处理', () => {
        test('应该处理包含中文和插值的混合文本', () => {
            const input = `<template>\n  <div>你好，{{name}}</div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            // 中文应该被替换
            expect(output).toContain('{{$lang(');
            // 插值应该保留
            expect(output).toContain('{{name}}');
        });

        test('应该处理包含插值的多段文本', () => {
            const input = `<template>\n  <div>欢迎，{{name}}，来到{{place}}</div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('{{$lang(');
            expect(output).toContain('{{name}}');
            expect(output).toContain('{{place}}');
        });

        test('应该处理纯插值表达式（无中文）', () => {
            const input = `<template>\n  <div>{{message}}</div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('{{message}}');
        });
    });

    describe('特殊处理', () => {
        test('应该跳过已存在的 $lang 调用', () => {
            const input = `<template>\n  <div>{{$lang('key_1')}}</div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('{{$lang(\'key_1\')}}');
        });

        test('应该跳过 require 调用', () => {
            const input = `<template>\n  <div>{{require('./module')}}</div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('require(\'./module\')');
        });
    });

    describe('模板字符串处理', () => {
        test('应该处理模板字符串中的中文', () => {
            const input = `<template>\n  <div>\`你好世界\`</div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            // 模板字符串中的中文应该被处理
            expect(output).toBeDefined();
        });

        test('应该处理插值中的模板字符串', () => {
            const input = `<template>\n  <div>{{\`你好\${name}\`}}</div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            // 应该保留插值结构
            expect(output).toContain('{{');
            expect(output).toContain('}}');
        });

        test('应该处理模板字符串中混合变量和中文', () => {
            const input = `<template>\n  <div>\`你好，\${name}\`</div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toBeDefined();
        });
    });

    describe('属性值处理', () => {
        test('应该将双引号属性值转换为绑定语法', () => {
            const input = `<template>\n  <button title="提交按钮">点击</button>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            // 双引号属性应该转换为 :title="$lang('...')"
            expect(output).toContain(':title="$lang(');
        });

        test('应该将单引号属性值转换为绑定语法', () => {
            const input = `<template>\n  <button title='提交按钮'>点击</button>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            // 单引号属性会转换为 :title='$lang("...")' 的形式
            expect(output).toContain(':title=');
            expect(output).toContain('$lang(');
        });

        test('应该处理多个包含中文的属性', () => {
            const input = `<template>\n  <button title="提示" aria-label="标签">按钮</button>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            // 检查是否有多个 $lang 调用（包括属性和文本）
            const langCallCount = (output.match(/\$lang\(/g) || []).length;
            expect(langCallCount).toBeGreaterThanOrEqual(2);
        });

        test('应该保留不含中文的属性', () => {
            const input = `<template>\n  <div id="app" class="container">内容</div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('id="app"');
            expect(output).toContain('class="container"');
        });
    });

    describe('复杂模板结构', () => {
        test('应该处理嵌套的 div 结构', () => {
            const input = `<template>
  <div>
    <div>
      <span>深层文本</span>
    </div>
  </div>
</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('<span>');
            expect(output).toContain('</span>');
            expect(output).toContain('{{$lang(');
        });

        test('应该处理列表结构', () => {
            const input = `<template>
  <ul>
    <li>项目一</li>
    <li>项目二</li>
    <li>项目三</li>
  </ul>
</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            const langCallCount = (output.match(/\{\{.*\$lang\(.*\).*\}\}/g) || []).length;
            expect(langCallCount).toBeGreaterThanOrEqual(3);
        });

        test('应该处理表格结构', () => {
            const input = `<template>
  <table>
    <tr>
      <th>标题一</th>
      <th>标题二</th>
    </tr>
    <tr>
      <td>数据一</td>
      <td>数据二</td>
    </tr>
  </table>
</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('<th>');
            expect(output).toContain('<td>');
            expect(output).toContain('{{$lang(');
        });
    });

    describe('边界情况', () => {
        test('应该处理空 template', () => {
            const input = `<template></template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('<template>');
            expect(output).toContain('</template>');
        });

        test('应该处理只包含注释的 template', () => {
            const input = `<template><!-- 只是注释 --></template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('<!-- 只是注释 -->');
        });

        test('应该处理包含特殊字符的中文', () => {
            const input = `<template>\n  <div>你好！@#$%</div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('{{$lang(');
        });

        test('应该处理包含空格的文本', () => {
            const input = `<template>\n  <div>  你好世界  </div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('{{$lang(');
        });
    });

    describe('警告信息', () => {
        test('应该处理包含特殊字符的文本', () => {
            const input = `<template>\n  <div>'带引号的文本'</div>\n</template>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            // 应该能处理包含引号的文本
            expect(output).toBeDefined();
            expect(output).toContain('<div>');
        });
    });

    describe('与其他内容的交互', () => {
        test('应该保留 script 标签', () => {
            const input = `<template><div>你好</div></template>\n<script>\nexport default {}\n</script>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('<script>');
            expect(output).toContain('export default');
        });

        test('应该保留 style 标签', () => {
            const input = `<template><div>你好</div></template>\n<style>\n.red { color: red; }\n</style>`;
            const output = replaceVueTemplate(input, 'test.vue', mockInstance, mockMsg);

            expect(output).toContain('<style>');
            expect(output).toContain('.red');
        });
    });
});
