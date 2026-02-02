/**
 * Vue AST 解析器主入口
 * 使用 @vue/compiler-dom 解析 Vue 模板并替换中文为 $lang() 调用
 */

const { compile } = require('@vue/compiler-dom');
const { processAstNode } = require('./nodeProcessors/elementProcessor');
const { generateCode, validateGeneratedCode } = require('./codeGenerator');

// 导入原有的正则实现作为降级方案
const replaceVueTemplate = require('../replaceVueTemplate').default;

/**
 * AST 方式的 Vue 模板替换
 * @param {string} content - 完整文件内容
 * @param {string} file - 文件路径
 * @param {object} VueI18nInstance - VueI18n 实例
 * @param {object} msg - 消息记录器
 * @returns {string} 处理后的内容
 */
function astReplaceVueTemplate(content, file, VueI18nInstance, msg) {
    // 提取 template 部分
    const templateMatch = content.match(/<template(.|\n|\r)*template>/gim);

    if (!templateMatch) {
        return content;
    }

    const originalTemplate = templateMatch[0];

    try {
        // 使用 Vue 编译器解析模板
        // compile 返回 { ast, code, preamble }
        const compileResult = compile(originalTemplate, {
            mode: 'module',
            prefixIdentifiers: false,
            hoistStatic: false,
            onError: (error) => {
                throw new Error(`AST parsing error: ${error.message}`);
            }
        });

        // 处理 AST 节点（ast 属性包含真正的 AST）
        const processedAst = processAstNode(compileResult.ast, file, VueI18nInstance);

        // 创建新的编译结果对象用于代码生成
        const processedCompileResult = {
            ...compileResult,
            ast: processedAst
        };

        // 生成代码
        const processedTemplate = generateCode(processedCompileResult);

        // 验证生成的代码
        if (!validateGeneratedCode(processedTemplate)) {
            throw new Error('Generated invalid Vue template code');
        }

        // 替换原内容中的 template 部分
        return content.replace(/<template(.|\n|\r)*template>/gim, () => processedTemplate);

    } catch (error) {
        // 降级到正则实现
        if (msg?.warn) {
            msg.warn(`${file}: AST 解析失败 (${error.message})，使用正则降级方案`);
        }
        return replaceVueTemplate(content, file, VueI18nInstance, msg);
    }
}

/**
 * 安全的 AST 替换（带验证）
 * @param {string} content - 完整文件内容
 * @param {string} file - 文件路径
 * @param {object} VueI18nInstance - VueI18n 实例
 * @param {object} msg - 消息记录器
 * @returns {string} 处理后的内容
 */
function safeAstReplace(content, file, VueI18nInstance, msg) {
    const templateMatch = content.match(/<template(.|\n|\r)*template>/gim);
    if (!templateMatch) {
        return content;
    }

    try {
        const result = astReplaceVueTemplate(content, file, VueI18nInstance, msg);

        // 如果内容有变化，验证生成的代码
        if (result !== content) {
            const newTemplateMatch = result.match(/<template(.|\n|\r)*template>/gim);
            if (newTemplateMatch && !validateGeneratedCode(newTemplateMatch[0])) {
                // 生成的代码无效，降级到正则实现
                if (msg?.warn) {
                    msg.warn(`${file}: 生成的代码无效，使用正则降级方案`);
                }
                return replaceVueTemplate(content, file, VueI18nInstance, msg);
            }
        }

        return result;

    } catch (error) {
        // 任何错误都降级到正则实现
        if (msg?.warn) {
            msg.warn(`${file}: AST 处理异常 (${error.message})，使用正则降级方案`);
        }
        return replaceVueTemplate(content, file, VueI18nInstance, msg);
    }
}

module.exports = {
    astReplaceVueTemplate,
    safeAstReplace
};
