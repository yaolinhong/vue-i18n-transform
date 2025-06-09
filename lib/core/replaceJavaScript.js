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

    // 特殊处理模板字符串中的中文文本
    content = content.replace(/(`[^`]*`)/gim, function(templateString) {
        var processedTemplate = templateString.replace(/`([^`]*)`/gim, function(_, templateContent) {
            // 如果模板内容已经包含$lang调用，说明已经处理过，跳过
            if (templateContent.includes('$lang(')) {
                return '`' + templateContent + '`';
            }
            // 将模板字符串内容按中文和非中文分段
            var segments = [];
            var currentSegment = '';
            var i = 0;
            
            while (i < templateContent.length) {
                var char = templateContent[i];
                
                // 处理 ${} 变量
                if (char === '$' && templateContent[i + 1] === '{') {
                    // 保存当前文本段
                    if (currentSegment) {
                        if (currentSegment.trim() && /[\u4e00-\u9fa5]/.test(currentSegment) && !isUrl(currentSegment.trim())) {
                            // 包含中文的文本段，检查是否包含HTML
                            if (isHtmlContent(currentSegment)) {
                                // 处理HTML内容，只替换其中的中文文本节点
                                var processedHtml = processHtmlContent(currentSegment, VueI18nInstance, file);
                                segments.push(processedHtml);
                            } else {
                                // 普通文本，直接国际化
                                var currentKey = VueI18nInstance.getCurrentKey(currentSegment.trim(), file);
                                VueI18nInstance.setMessageItem(currentKey, currentSegment.trim());
                                segments.push('${$lang(\'' + currentKey + '\')}');
                            }
                        } else {
                            // 纯空格或非中文内容，直接保留
                            segments.push(currentSegment);
                        }
                    }
                    currentSegment = '';
                    
                    // 找到 ${} 的结束位置
                    var braceCount = 1;
                    var varStart = i;
                    i += 2; // 跳过 ${
                    while (i < templateContent.length && braceCount > 0) {
                        if (templateContent[i] === '{') braceCount++;
                        if (templateContent[i] === '}') braceCount--;
                        i++;
                    }
                    var varContent = templateContent.substring(varStart + 2, i - 1); // 获取${} 内的内容
                    
                    // 递归处理变量表达式中的字符串
                    var processedVarContent = varContent.replace(/(['"])((?:(?!\1)[^\\]|\\.)*)(\1)/g, function(stringMatch, quote, content, endQuote) {
                        if (/[\u4e00-\u9fa5]/.test(content) && !isUrl(content)) {
                            var currentKey = VueI18nInstance.getCurrentKey(content, file);
                            VueI18nInstance.setMessageItem(currentKey, content);
                            return '$lang(\'' + currentKey + '\')';
                        }
                        return stringMatch;
                    });
                    
                    segments.push('${' + processedVarContent + '}');
                } else {
                    currentSegment += char;
                    i++;
                }
            }
            
            // 处理最后一段
            if (currentSegment) {
                if (currentSegment.trim() && /[\u4e00-\u9fa5]/.test(currentSegment) && !isUrl(currentSegment.trim())) {
                    // 包含中文的文本段，检查是否包含HTML
                    if (isHtmlContent(currentSegment)) {
                        // 处理HTML内容，只替换其中的中文文本节点
                        var processedHtml = processHtmlContent(currentSegment, VueI18nInstance, file);
                        segments.push(processedHtml);
                    } else {
                        // 普通文本，直接国际化
                        var currentKey = VueI18nInstance.getCurrentKey(currentSegment.trim(), file);
                        VueI18nInstance.setMessageItem(currentKey, currentSegment.trim());
                        segments.push('${$lang(\'' + currentKey + '\')}');
                    }
                } else {
                    // 纯空格或非中文内容，直接保留
                    segments.push(currentSegment);
                }
            }
            
            return '`' + segments.join('') + '`';
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
                    return '${$lang(\'' + currentKey + '\')}';
                });
                return '>' + processedText + '<';
            }
            return match;
        });
        
        // 处理标签内没有嵌套其他标签的情况（如单个标签内的文本）
        result = result.replace(/>([^<>]*[\u4e00-\u9fa5][^<>]*)/g, function(match, textContent) {
            if (textContent.trim() && /[\u4e00-\u9fa5]/.test(textContent) && !isUrl(textContent.trim())) {
                var processedText = textContent.replace(/([\u4e00-\u9fa5]+)/g, function(chinesePart) {
                    var currentKey = VueI18nInstance.getCurrentKey(chinesePart, file);
                    VueI18nInstance.setMessageItem(currentKey, chinesePart);
                    return '${$lang(\'' + currentKey + '\')}';
                });
                return '>' + processedText;
            }
            return match;
        });
        
        return result;
    }
    //换回注释部分和模板字符串
    content = content.replace(/\/\*(comment|template)_\d+\*\//gim, function (match) {
        return comments[match];
    });
    
    return content;
}
exports.default = replaceJavaScript;
