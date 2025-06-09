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
    // map里的中文键值不应该被替换
    // 所以先替换含有中文键值,后面再换回来，作用和注释一样，共用一个 comments
    content = content.replace(/['"][^'"]*[\u4e00-\u9fa5]+[^'"]*['"]\s*:/gim, function (match) {
        var commentsKey = "/*comment_".concat(commentsIndex++, "*/");
        comments[commentsKey] = match;
        return commentsKey;
    });
    // 替换（可能含有中文的 require）, 作用和注释一样，共用一个 comments
    content = content.replace(/require\(((?!\)).)*\)/gim, function (match) {
        var commentsKey = "/*comment_".concat(commentsIndex++, "*/");
        comments[commentsKey] = match;
        return commentsKey;
    });

    // 特殊处理模板字符串中的中文文本
    content = content.replace(/(`[^`]*`)/gim, function(templateString) {
        return templateString.replace(/`([^`]*)`/gim, function(_, templateContent) {
            // 如果模板内容已经包含占位符，说明已经处理过，跳过
            if (templateContent.includes('___LANG_TEMP_PLACEHOLDER_')) {
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
                         if (currentSegment.trim() && /[\u4e00-\u9fa5]/.test(currentSegment)) {
                             // 包含中文的文本段，需要国际化
                             var currentKey = VueI18nInstance.getCurrentKey(currentSegment.trim(), file);
                             VueI18nInstance.setMessageItem(currentKey, currentSegment.trim());
                             var langComment = "___LANG_TEMP_PLACEHOLDER_".concat(commentsIndex++, "___");
                             comments[langComment] = '${$lang(\'' + currentKey + '\')}';
                             segments.push(langComment);
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
                    segments.push(templateContent.substring(varStart, i));
                } else {
                    currentSegment += char;
                    i++;
                }
            }
            
                                      // 处理最后一段
             if (currentSegment) {
                 if (currentSegment.trim() && /[\u4e00-\u9fa5]/.test(currentSegment)) {
                     // 包含中文的文本段，需要国际化
                     var currentKey = VueI18nInstance.getCurrentKey(currentSegment.trim(), file);
                     VueI18nInstance.setMessageItem(currentKey, currentSegment.trim());
                     var langComment = "___LANG_TEMP_PLACEHOLDER_".concat(commentsIndex++, "___");
                        comments[langComment] = '${$lang(\'' + currentKey + '\')}';
                     segments.push(langComment);
                 } else {
                     // 纯空格或非中文内容，直接保留
                     segments.push(currentSegment);
                 }
             }
            
            return '`' + segments.join('') + '`';
        });
    });
    
    content = content.replace(jsChineseRegExp, function (_, prev, match, __, ___, offset) {
        match = match.trim();
        var currentKey;
        var result = '';
        if (prev !== '`') {
            //对于普通字符串的替换
            currentKey = VueI18nInstance.getCurrentKey(match, file);
            result = "$lang('".concat(currentKey, "')");
        }
        else {
            //对于 `` 拼接字符串的替换
            var matchIndex_1 = 0;
            var matchArr_1 = [];
            match = match.replace(/(\${)([^{}]+)(})/gim, function (_, prev, match) {
                matchArr_1.push(match);
                return "{".concat(matchIndex_1++, "}");
            });
            currentKey = VueI18nInstance.getCurrentKey(match, file);
            if (!matchArr_1.length) {
                result = "$lang('".concat(currentKey, "')");
            }
            else {
                result = "$lang('".concat(currentKey, "', [").concat(matchArr_1.toString(), "])");
            }
        }
        VueI18nInstance.setMessageItem(currentKey, match);
        return result;
    });
    //换回注释部分
    content = content.replace(/___LANG_TEMP_PLACEHOLDER_\d+___/gim, function (match) {
        return comments[match];
    }).replace(/\/\*comment_\d+\*\//gim, function (match) {
        return comments[match];
    });
    
    return content;
}
exports.default = replaceJavaScript;
