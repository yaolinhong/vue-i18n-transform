/**
 * 元素节点处理器
 * 处理 Vue AST 中的 ELEMENT 节点 (type: 1)
 * 例如: <div>, <span>, <img>
 */

const { processAttributeNode } = require('./attributeProcessor');
const { processTextNode } = require('./textProcessor');
const { processInterpolationNode } = require('./interpolationProcessor');

/**
 * 处理元素节点
 * @param {object} node - AST 节点
 * @param {string} file - 文件路径
 * @param {object} VueI18nInstance - VueI18n 实例
 * @returns {object} 处理后的节点
 */
function processElementNode(node, file, VueI18nInstance) {
    if (!node || node.type !== 1) return node;

    // 处理属性 (props)
    if (node.props && Array.isArray(node.props)) {
        node.props = node.props.map(prop =>
            processAttributeNode(prop, file, VueI18nInstance)
        );
    }

    // 处理子节点 (children)
    if (node.children && Array.isArray(node.children)) {
        node.children = node.children.map(child =>
            processAstNode(child, file, VueI18nInstance)
        );
    }

    return node;
}

/**
 * 递归处理 AST 节点
 * @param {object} node - AST 节点
 * @param {string} file - 文件路径
 * @param {object} VueI18nInstance - VueI18n 实例
 * @returns {object} 处理后的节点
 */
function processAstNode(node, file, VueI18nInstance) {
    if (!node) return node;

    switch (node.type) {
        case 0: // ROOT
            if (node.children) {
                node.children = node.children.map(child =>
                    processAstNode(child, file, VueI18nInstance)
                );
            }
            return node;

        case 1: // ELEMENT
            return processElementNode(node, file, VueI18nInstance);

        case 2: // TEXT
            return processTextNode(node, file, VueI18nInstance);

        case 3: // COMMENT - 注释不处理
            return node;

        case 5: // INTERPOLATION
            return processInterpolationNode(node, file, VueI18nInstance);

        case 6: // ATTRIBUTE
            return processAttributeNode(node, file, VueI18nInstance);

        case 7: // DIRECTIVE
            return processAttributeNode(node, file, VueI18nInstance);

        case 8: // COMPOUND Expression
            return processCompoundExpressionNode(node, file, VueI18nInstance);

        default:
            return node;
    }
}

/**
 * 处理复合表达式节点
 * @param {object} node - AST 节点
 * @param {string} file - 文件路径
 * @param {object} VueI18nInstance - VueI18n 实例
 * @returns {object} 处理后的节点
 */
function processCompoundExpressionNode(node, file, VueI18nInstance) {
    if (!node || node.type !== 8) return node;

    const { containsChinese, containsLangCall, isUrl } = require('../utils');

    // 处理 children 中的文本节点 (type: 2)
    if (node.children && Array.isArray(node.children)) {
        node.children = node.children.map(child => {
            // 处理文本节点
            if (child && typeof child === 'object' && child.type === 2) {
                const text = child.content;
                if (containsChinese(text) && !containsLangCall(text) && !isUrl(text)) {
                    const key = VueI18nInstance.getCurrentKey(text, file);
                    VueI18nInstance.setMessageItem(key, text);
                    // 返回插值节点来替换文本
                    return {
                        type: 5,
                        content: {
                            type: 4,
                            content: `$lang('${key}')`,
                            isStatic: false,
                            constType: 0
                        }
                    };
                }
            }
            return child;
        });
    }

    return node;
}

module.exports = {
    processElementNode,
    processAstNode
};
