"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// (?!\1) 指 非 ['"`]
var jsChineseRegExp = /(['"`])(((?!\1).)*[\u4e00-\u9fa5]+((?!\1).)*)\1/gim;
function replaceJavaScript(content, file, VueI18nInstance, msg) {
    //替换注释部分
    var comments = {};
    var commentsIndex = 0;
    content = content.replace(
    // /(\/\*([^\*\/]*|.|\n|\r)*\*\/)|(\/\/.*)/gim,
    /(\/\*(?:(?!\*\/).|[\n\r])*\*\/)|(\/\/.*)/gim, function (match, _p1, _p2, offset, str) {
        //排除掉url协议部分,貌似不排除也不影响
        if (offset > 0 && str[offset - 1] === ':') {
            return match;
        }
        var commentsKey = "/*comment_".concat(commentsIndex++, "*/");
        comments[commentsKey] = match;
        return commentsKey;
    });
    // 替换掉原本就有的$lang('****')
    content = content.replace(/i18n\.t\(((?!\)).)*\)/gim, function (match) {
        var commentsKey = "/*comment_".concat(commentsIndex++, "*/");
        comments[commentsKey] = match;
        return commentsKey;
    });
    // 替换掉原本就有的 $lang('****') 调用，防止重复处理
    content = content.replace(/\$lang\(\s*(['"`])((?:(?!\1)[^\\]|\\.)*?)\1\s*\)/gim, function (match) {
        var commentsKey = "/*comment_".concat(commentsIndex++, "*/");
        comments[commentsKey] = match;
        return commentsKey;
    });
    // 替换掉console.log()
    content = content.replace(/console\.log\([^\)]+\)/gim, function (match) {
        var commentsKey = "/*comment_".concat(commentsIndex++, "*/");
        comments[commentsKey] = match;
        return commentsKey;
    });
    // map里的中文键值暂时不处理，避免与模板字符串处理冲突
    // TODO: 需要更精确的对象键值识别逻辑
    // content = content.replace(/['"][^'"]*[\u4e00-\u9fa5]+[^'"]*['"]\s*:/gim, function (match) {
    //     var commentsKey = "/*comment_".concat(commentsIndex++, "*/");
    //     comments[commentsKey] = match;
    //     return commentsKey;
    // });
    // 替换（可能含有中文的 require）, 作用和注释一样，共用一个 comments
    content = content.replace(/require\(((?!\)).)*\)/gim, function (match) {
        var commentsKey = "/*comment_".concat(commentsIndex++, "*/");
        comments[commentsKey] = match;
        return commentsKey;
    });

    // 检查字符串是否是URL的辅助函数
    function isUrl(text) {
        // 检查是否包含URL特征
        return /^https?:\/\//.test(text) || // 以http://或https://开头
               /\.(com|cn|org|net|gov|edu|mil|int|co\.|\.)/i.test(text) || // 包含域名
               /\/[^\/\s]*\.(png|jpg|jpeg|gif|svg|bmp|webp|ico|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz)/i.test(text) || // 包含文件扩展名
               /oss-[a-z-]+\.aliyuncs\.com/i.test(text); // 阿里云OSS域名
    }
    
    // 检查字符串是否包含HTML标签
    function isHtmlContent(text) {
        return /<[^>]+>/i.test(text);
    }
    
    // 处理HTML内容，只替换其中的中文文本节点
    function processHtmlContent(htmlText, VueI18nInstance, file) {
        // 分析HTML结构，只对文本节点中的中文进行处理
        var result = htmlText;
        
        // 匹配标签之间的文本内容（包含中文的）
        result = result.replace(/>([^<]*[\u4e00-\u9fa5][^<]*)</g, function(match, textContent) {
            if (textContent.trim() && /[\u4e00-\u9fa5]/.test(textContent) && !isUrl(textContent.trim())) {
                var processedText = textContent.replace(/([\u4e00-\u9fa5]+)/g, function(chinesePart) {
                    var currentKey = VueI18nInstance.getCurrentKey(chinesePart, file);
                    VueI18nInstance.setMessageItem(currentKey, chinesePart);
                    if (chinesePart.includes('$lang(')) {
                        return chinesePart;
                    } else {
                        return '${$lang(\'' + currentKey + '\')}';
                    }
                });
                return '>' + processedText + '<';
            }
            return match;
        });
        
        return result;
    }

    // 特殊处理模板字符串中的中文文本
    content = content.replace(/(`[^`]*`)/gim, function(templateString) {
        // 检查模板字符串是否需要处理（是否包含中文）
        if (!(/[\u4e00-\u9fa5]/.test(templateString)) || templateString.includes('$lang(')) {
            return templateString; // 不包含中文或已处理过，直接返回原字符串
        }

        var processedTemplate = templateString.replace(/`([^`]*)`/gim, function(_, templateContent) {
            // 如果模板内容已经包含$lang调用，说明已经处理过，跳过
            if (templateContent.includes('$lang(')) {
                return '`' + templateContent + '`';
            }

            // === 新的处理逻辑：使用占位符保护变量表达式 ===

            // 1. 先保护所有 ${...} 变量表达式
            var variablePlaceholders = [];
            var protectedContent = templateContent.replace(/\$\{[^}]+\}/g, function(match) {
                var id = variablePlaceholders.length;
                variablePlaceholders.push(match);
                return '___VAR_' + id + '___';
            });

            // 2. 处理剩余的中文文本
            var processedContent = protectedContent.replace(/[\u4e00-\u9fa5]+/g, function(chineseText) {
                var currentKey = VueI18nInstance.getCurrentKey(chineseText, file);
                VueI18nInstance.setMessageItem(currentKey, chineseText);
                return '${$lang(\'' + currentKey + '\')}';
            });

            // 3. 恢复变量表达式
            processedContent = processedContent.replace(/___VAR_(\d+)___/g, function(_, id) {
                return variablePlaceholders[id];
            });

            return '`' + processedContent + '`';
        });

        // 使用占位符避免被后续的jsChineseRegExp重复处理
        var templateKey = "/*template_".concat(commentsIndex++, "*/");
        comments[templateKey] = processedTemplate;
        return templateKey;
    });
    
    content = content.replace(jsChineseRegExp, function (fullMatch, prev, match, __, ___, offset) {
        match = match.trim();
        
        // 检查是否是URL，如果是URL则不进行国际化处理
        if (isUrl(fullMatch) || isUrl(prev + match + prev)) {
            return fullMatch;
        }
        
        var currentKey;
        var result = '';
        if (prev !== '`') {
            //对于普通字符串的替换
            currentKey = VueI18nInstance.getCurrentKey(match, file);
            result = "$lang('".concat(currentKey, "')");
        }
        else {
            //对于 `` 拼接字符串的替换，直接处理中文部分
            currentKey = VueI18nInstance.getCurrentKey(match, file);
            result = "$lang('".concat(currentKey, "')");
        }
        VueI18nInstance.setMessageItem(currentKey, match);
        return result;
    });
    
    // 换回注释部分和模板字符串
    // 使用循环确保嵌套的占位符也能被恢复
    var hasPlaceholders = true;
    var iterations = 0;
    var maxIterations = 10; // 防止无限循环
    while (hasPlaceholders && iterations < maxIterations) {
        var previousLength = content.length;
        content = content.replace(/\/\*(comment|template)_\d+\*\//gim, function (match) {
            return comments[match];
        });
        // 如果内容长度没有变化，说明没有更多占位符需要恢复
        hasPlaceholders = content.length !== previousLength;
        iterations++;
    }

    // 清理可能出现的嵌套$lang调用
    content = content.replace(/\$lang\(['"`]\$\{?\$lang\(([^)]+)\)\}?['"`]\)/g, '$lang($1)');

    return content;
}
exports.default = replaceJavaScript;