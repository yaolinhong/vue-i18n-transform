/**
 * 文本节点处理器
 * 处理 Vue AST 中的 TEXT 节点 (type: 2)
 */

const { processChineseText } = require('../utils');

/**
 * 处理文本节点
 * @param {object} node - AST 节点
 * @param {string} file - 文件路径
 * @param {object} VueI18nInstance - VueI18n 实例
 * @returns {object} 处理后的节点
 */
function processTextNode(node, file, VueI18nInstance) {
    if (!node || node.type !== 2) return node;

    const text = node.content;

    // 跳过空内容
    if (!text || !text.trim()) return node;

    // 处理中文文本
    const processedText = processChineseText(text, file, VueI18nInstance);
    node.content = processedText;

    return node;
}

module.exports = { processTextNode };
