/**
 * Vue AST 工具函数
 * 提供中文检测、$lang 检测、URL 检测等辅助功能
 */

/**
 * 检测文本是否包含中文字符
 * @param {string} text - 待检测文本
 * @returns {boolean}
 */
function containsChinese(text) {
    if (!text || typeof text !== 'string') return false;
    return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * 检测文本是否已包含 $lang 调用
 * @param {string} text - 待检测文本
 * @returns {boolean}
 */
function containsLangCall(text) {
    if (!text || typeof text !== 'string') return false;
    return /\$lang\(/.test(text);
}

/**
 * 检测文本是否是 URL
 * @param {string} text - 待检测文本
 * @returns {boolean}
 */
function isUrl(text) {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    return /^https?:\/\//.test(trimmed) ||
           /\.(com|cn|org|net|gov|edu|mil|int|co\.|\.)/i.test(trimmed) ||
           /\/[^\/\s]*\.(png|jpg|jpeg|gif|svg|bmp|webp|ico|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz)/i.test(trimmed) ||
           /oss-[a-z-]+\.aliyuncs\.com/i.test(trimmed);
}

/**
 * 检测文本是否应该跳过翻译
 * @param {string} text - 待检测文本
 * @param {object} options - 选项
 * @returns {boolean}
 */
function shouldSkipTranslation(text, options = {}) {
    if (!text || typeof text !== 'string') return true;

    const {
        checkLangCall = true,
        checkUrl = true,
        checkEmpty = true
    } = options;

    // 空字符串跳过
    if (checkEmpty && !text.trim()) return true;

    // 已包含 $lang 调用跳过
    if (checkLangCall && containsLangCall(text)) return true;

    // URL 跳过
    if (checkUrl && isUrl(text)) return true;

    return false;
}

/**
 * 获取节点类型名称
 * @param {number} type - 节点类型
 * @returns {string}
 */
function getNodeTypeName(type) {
    const types = [
        'ROOT',           // 0
        'ELEMENT',        // 1
        'TEXT',           // 2
        'COMMENT',        // 3
        'SYMBOL',         // 4
        'INTERPOLATION',  // 5
        'ATTRIBUTE',      // 6
        'DIRECTIVE',      // 7
        'COMPOUND'        // 8
    ];
    return types[type] || 'UNKNOWN';
}

/**
 * 处理中文文本内容
 * @param {string} text - 文本内容
 * @param {string} file - 文件路径
 * @param {object} VueI18nInstance - VueI18n 实例
 * @returns {string} 处理后的文本
 */
function processChineseText(text, file, VueI18nInstance) {
    if (!text || typeof text !== 'string') return text;

    // 跳过检测
    if (shouldSkipTranslation(text)) return text;

    // 分割中文字符
    const segments = text.split(/([\u4e00-\u9fa5]+)/);

    return segments.map(segment => {
        if (containsChinese(segment) && segment.trim()) {
            if (!shouldSkipTranslation(segment)) {
                const key = VueI18nInstance.getCurrentKey(segment.trim(), file);
                VueI18nInstance.setMessageItem(key, segment.trim());
                return `{{$lang('${key}')}}`;
            }
        }
        return segment;
    }).join('');
}

module.exports = {
    containsChinese,
    containsLangCall,
    isUrl,
    shouldSkipTranslation,
    getNodeTypeName,
    processChineseText
};
