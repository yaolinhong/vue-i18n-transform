/**
 * 插值节点处理器
 * 处理 Vue AST 中的 INTERPOLATION 节点 (type: 5)
 * 例如: {{ variable }}, {{ '中文' }}
 */

const { containsChinese, containsLangCall } = require('../utils');

/**
 * 检查节点是否包含 $lang 调用
 * @param {object} content - AST content 对象
 * @returns {boolean}
 */
function hasLangCallInContent(content) {
    if (!content) return false;

    // 检查 SIMPLE_EXPRESSION (type: 4)
    if (content.type === 4 && content.content) {
        return content.content.includes('$lang');
    }

    // 检查 COMPOUND_EXPRESSION (type: 8)
    if (content.type === 8 && content.children) {
        return content.children.some(child => {
            if (typeof child === 'string') {
                return child.includes('$lang');
            }
            if (child && typeof child === 'object') {
                // 检查子对象的 content 属性
                if (child.content) {
                    return child.content.includes('$lang');
                }
                return hasLangCallInContent(child);
            }
            return false;
        });
    }

    return false;
}

/**
 * 处理插值节点
 * @param {object} node - AST 节点
 * @param {string} file - 文件路径
 * @param {object} VueI18nInstance - VueI18n 实例
 * @returns {object} 处理后的节点
 */
function processInterpolationNode(node, file, VueI18nInstance) {
    if (!node || node.type !== 5) return node;

    const content = node.content;

    // content 是一个对象，不是字符串
    if (!content || typeof content !== 'object') return node;

    // 跳过已包含 $lang 的内容
    // 检查 COMPOUND_EXPRESSION 的子元素是否包含 $lang
    if (hasLangCallInContent(content)) {
        return node;
    }

    // 获取实际的字符串内容
    const contentStr = content.content || '';

    // 处理纯字符串插值 (type: 4, SIMPLE_EXPRESSION)
    // 例如: {{ '中文文本' }}
    if (content.type === 4 && contentStr) {
        // 检查是否是简单的字符串字面量（包含引号）
        if (/^['"][^'"]*['"]$/.test(contentStr)) {
            const text = contentStr.slice(1, -1); // 去掉引号
            if (containsChinese(text)) {
                const key = VueI18nInstance.getCurrentKey(text, file);
                VueI18nInstance.setMessageItem(key, text);
                content.content = `$lang('${key}')`;
            }
        }
    }

    // 处理模板字符串插值 (type: 8, COMPOUND_EXPRESSION)
    // 例如: {{ `中文${变量}更多中文` }}
    if (content.type === 8 && content.children) {
        // 处理模板字符串中的文本部分
        content.children = content.children.map(child => {
            if (typeof child === 'string') {
                if (containsChinese(child) && !child.includes('$lang')) {
                    const key = VueI18nInstance.getCurrentKey(child, file);
                    VueI18nInstance.setMessageItem(key, child);
                    return `{{$lang('${key}')}}`;
                }
            }
            return child;
        });
    }

    return node;
}

/**
 * 处理模板字符串
 * @param {string} template - 模板字符串
 * @param {string} file - 文件路径
 * @param {object} VueI18nInstance - VueI18n 实例
 * @returns {string} 处理后的模板字符串
 */
function processTemplateLiteral(template, file, VueI18nInstance) {
    // 去掉反引号
    const content = template.slice(1, -1);
    const segments = [];
    let currentSegment = '';
    let i = 0;

    while (i < content.length) {
        if (content[i] === '$' && content[i + 1] === '{') {
            // 保存当前文本段
            if (currentSegment) {
                segments.push(processTextSegment(currentSegment, file, VueI18nInstance));
                currentSegment = '';
            }

            // 找到 ${} 的结束位置
            let braceCount = 1;
            const varStart = i;
            i += 2; // 跳过 ${
            while (i < content.length && braceCount > 0) {
                if (content[i] === '{') braceCount++;
                if (content[i] === '}') braceCount--;
                i++;
            }
            segments.push(content.substring(varStart, i));
        } else {
            currentSegment += content[i];
            i++;
        }
    }

    // 处理最后一段
    if (currentSegment) {
        segments.push(processTextSegment(currentSegment, file, VueI18nInstance));
    }

    return '`' + segments.join('') + '`';
}

/**
 * 处理文本段
 * @param {string} text - 文本内容
 * @param {string} file - 文件路径
 * @param {object} VueI18nInstance - VueI18n 实例
 * @returns {string} 处理后的文本
 */
function processTextSegment(text, file, VueI18nInstance) {
    if (!text || !text.trim()) return text;
    if (!containsChinese(text)) return text;
    if (containsLangCall(text)) return text;

    const key = VueI18nInstance.getCurrentKey(text.trim(), file);
    VueI18nInstance.setMessageItem(key, text.trim());
    return `\${$lang('${key}')}`;
}

module.exports = { processInterpolationNode };
