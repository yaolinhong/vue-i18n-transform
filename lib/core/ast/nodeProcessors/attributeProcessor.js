/**
 * 属性节点处理器
 * 处理 Vue AST 中的 ATTRIBUTE 节点 (type: 6) 和 DIRECTIVE 节点 (type: 7)
 */

const { containsChinese, containsLangCall, isUrl } = require('../utils');

/**
 * 处理属性节点
 * @param {object} prop - 属性节点
 * @param {string} file - 文件路径
 * @param {object} VueI18nInstance - VueI18n 实例
 * @returns {object} 处理后的属性节点
 */
function processAttributeNode(prop, file, VueI18nInstance) {
    if (!prop) return prop;

    const name = prop.name;
    const value = prop.value;

    // 跳过 src 和 href 属性
    if (name === 'src' || name === 'href') {
        return prop;
    }

    // 处理静态属性 (type: 6)
    if (prop.type === 6 && value && typeof value === 'object') {
        // 属性值是一个对象，包含 type 和 content
        const valueContent = value.content;

        if (valueContent && containsChinese(valueContent)) {
            // 跳过已包含 $lang 的内容
            if (containsLangCall(valueContent)) {
                return prop;
            }

            // 跳过 URL
            if (isUrl(valueContent)) {
                return prop;
            }

            // 转换为动态绑定
            const key = VueI18nInstance.getCurrentKey(valueContent, file);
            VueI18nInstance.setMessageItem(key, valueContent);

            // 修改属性为动态绑定
            // 保留原始属性结构，只修改 name 和 value
            const originalProp = { ...prop };
            prop.name = `bind:${name}`;
            prop.value = {
                type: 8, // COMPOUND Expression
                children: [`$lang('${key}')`],
                loc: value.loc
            };
            prop.exp = {
                type: 8, // COMPOUND Expression
                children: [`$lang('${key}')`],
                loc: value.loc
            };
        }
    }

    // 处理指令节点 (type: 7) - 如 :title, :content
    if (prop.type === 7 && value && typeof value === 'object') {
        // 处理复杂表达式中的字符串
        if (value.type === 8 && value.children) {
            // 处理复合表达式中的字符串部分
            value.children = value.children.map(child => {
                if (typeof child === 'string' && containsChinese(child)) {
                    if (!containsLangCall(child) && !isUrl(child)) {
                        const key = VueI18nInstance.getCurrentKey(child, file);
                        VueI18nInstance.setMessageItem(key, child);
                        return `$lang('${key}')`;
                    }
                }
                return child;
            });
        }
    }

    return prop;
}

module.exports = { processAttributeNode };
