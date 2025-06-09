"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 单纯替换tag content 中文文本并设置值
 * @param match
 * @param file
 * @param VueI18nInstance
 * @returns
 */
function replaceCNText(match, file, VueI18nInstance) {
    var currentKey = VueI18nInstance.getCurrentKey(match, file);
    VueI18nInstance.setMessageItem(currentKey, match);
    return "{{$lang('".concat(currentKey, "')}}");
}
/**
 * 替换 vue 中的 template
 * @param content 文本
 * @param file 文件路径
 * @returns
 */

function replaceVueTemplate(content, file, VueI18nInstance, msg) {
    // 检查字符串是否是URL的辅助函数
    function isUrl(text) {
        // 检查是否包含URL特征
        return /^https?:\/\//.test(text) || // 以http://或https://开头
               /\.(com|cn|org|net|gov|edu|mil|int|co\.|\.)/i.test(text) || // 包含域名
               /\/[^\/\s]*\.(png|jpg|jpeg|gif|svg|bmp|webp|ico|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz)/i.test(text) || // 包含文件扩展名
               /oss-[a-z-]+\.aliyuncs\.com/i.test(text); // 阿里云OSS域名
    }
    
    return content.replace(/<template(.|\n|\r)*template>/gim, function (match) {
        // 替换注释部分
        // 为何要替换呢？就是注释里可能也存在着 '中文' "中文" `中文` 等情况
        // 所以要先替换了之后再换回来
        var comments = {};
        var commentsIndex = 0;
        match = match.replace(/<!--(?:(?!-->).|[\n\r])*-->/gim, function (match, offset, str) {
            // offset 为偏移量
            // 排除掉url协议部分
            if (offset > 0 && str[offset - 1] === ':') {
                return match;
            }
            var commentsKey = "/*comment_".concat(commentsIndex++, "*/");
            comments[commentsKey] = match;
            return commentsKey;
        });
        // 替换(可能含有中文的） require, 作用和注释一样，共用一个 comments
        match = match.replace(/require\(((?!\)).)*\)/gim, function (match) {
            var commentsKey = "/*comment_".concat(commentsIndex++, "*/");
            comments[commentsKey] = match;
            return commentsKey;
        });
        // 替换掉原本就有的$lang('****')
        match = match.replace(/\$lang\(((?!\)).)*\)/gim, function (match) {
            var commentsKey = "/*comment_".concat(commentsIndex++, "*/");
            comments[commentsKey] = match;
            return commentsKey;
        });
        
        // 添加：保护所有模板字符串，避免被主正则表达式错误处理
        match = match.replace(/`([^`]*)`/gim, function(fullMatch, templateContent) {
            // 如果模板内容已经包含占位符，说明已经处理过，跳过
            if (templateContent.includes('___LANG_TEMP_PLACEHOLDER_') || templateContent.includes('/*comment_')) {
                return fullMatch;
            }
            
            // 处理模板字符串内容
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
                    
                    // 递归处理变量表达式内的中文（如三元运算符中的中文）
                    var braceCount = 1;
                    var varStart = i;
                    i += 2; // 跳过 ${
                    var varContent = '';
                    while (i < templateContent.length && braceCount > 0) {
                        if (templateContent[i] === '{') braceCount++;
                        if (templateContent[i] === '}') braceCount--;
                        if (braceCount > 0) {
                            varContent += templateContent[i];
                        }
                        i++;
                    }
                    
                    // 处理变量表达式中的中文字符串
                    varContent = varContent.replace(/(["'])([^"']*[\u4e00-\u9fa5][^"']*)\1/g, function(match, quote, chineseText) {
                        if (isUrl(chineseText.trim())) {
                            return match;
                        }
                        var currentKey = VueI18nInstance.getCurrentKey(chineseText.trim(), file);
                        VueI18nInstance.setMessageItem(currentKey, chineseText.trim());
                        return quote + '$lang(\'' + currentKey + '\')' + quote;
                    });
                    
                    segments.push('${' + varContent + '}');
                } else {
                    currentSegment += char;
                    i++;
                }
            }
            
            // 处理最后一段
            if (currentSegment) {
                if (currentSegment.trim() && /[\u4e00-\u9fa5]/.test(currentSegment) && !isUrl(currentSegment.trim())) {
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
            
            var processedTemplate = '`' + segments.join('') + '`';
            var templateKey = "/*template_".concat(commentsIndex++, "*/");
            comments[templateKey] = processedTemplate;
            return templateKey;
        });
        
        // 特殊处理属性值中的模板字符串
        match = match.replace(/(['"])([^'"]*\/\*template_\d+\*\/[^'"]*)\1/gim, function(fullMatch, quote, attrContent) {
            // 属性值中的模板字符串已经在上面处理过了，直接返回
            return fullMatch;
        });
        
        // 特殊处理模板字符串中的中文文本（跳过已经处理过的）
        match = match.replace(/\{\{\s*`([^`]*)`\s*\}\}/gim, function(fullMatch, templateContent) {
            // 如果模板内容已经包含占位符，说明已经处理过，跳过
            if (templateContent.includes('___LANG_TEMP_PLACEHOLDER_')) {
                return fullMatch;
            }
            // 处理模板字符串内容
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
                 if (currentSegment.trim() && /[\u4e00-\u9fa5]/.test(currentSegment) && !isUrl(currentSegment.trim())) {
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
             
             var processedContent = '`' + segments.join('') + '`';
             return '{{ ' + processedContent + ' }}';
         });

        match = match.replace(/((\w+-){0,}\w+=['"]|>|'|")([^'"<>]*[\u4e00-\u9fa5]+[^'"<>]*)(['"<])/gim, function (_, prev, __, match, after, offset) {
            // 针对一些资源中含有中文名时，不做替换
            if (prev.match(/src=['"]/)) {
                return _;
            }
            // 检查是否是URL，如果是URL则不进行国际化处理
            if (isUrl(match)) {
                return _;
            }
            // 检查是否包含注释占位符，如果包含则需要分离处理
            if (match.match(/\/\*comment_\d+\*\//)) {
                // 分离处理，只处理不在注释占位符中的中文
                var segments = match.split(/(\/\*comment_\d+\*\/)/);
                var processedSegments = segments.map(function(segment) {
                    if (segment.match(/\/\*comment_\d+\*\//)) {
                        // 这是注释占位符，保持不变
                        return segment;
                    } else if (/[\u4e00-\u9fa5]/.test(segment) && segment.trim()) {
                        // 这是包含中文的文本段，进行处理
                        return segment.replace(/([\u4e00-\u9fa5]+)/g, function(chinesePart) {
                            var currentKey = VueI18nInstance.getCurrentKey(chinesePart, file);
                            VueI18nInstance.setMessageItem(currentKey, chinesePart);
                            return "{{$lang('" + currentKey + "')}}";
                        });
                    } else {
                        // 其他内容保持不变
                        return segment;
                    }
                });
                return prev + processedSegments.join('') + after;
            }
            
            match = match.trim();
            var result = '';
            var currentKey;
            if (match.match(/{{[^{}]+}}/)) {
                // 包含变量的中文字符串，需要分离中文部分和变量部分
                var segments = [];
                var currentSegment = '';
                var i = 0;
                
                while (i < match.length) {
                    if (match.substring(i, i + 2) === '{{') {
                        // 遇到变量开始，保存之前的文本段
                        if (currentSegment.trim()) {
                            segments.push({ type: 'text', content: currentSegment });
                        }
                        currentSegment = '';
                        
                        // 找到变量结束位置
                        var varEnd = match.indexOf('}}', i);
                        if (varEnd !== -1) {
                            var variable = match.substring(i, varEnd + 2);
                            segments.push({ type: 'variable', content: variable });
                            i = varEnd + 2;
                        } else {
                            // 没找到结束标记，当作普通文本
                            currentSegment += match[i];
                            i++;
                        }
                    } else {
                        currentSegment += match[i];
                        i++;
                    }
                }
                
                // 处理最后一段文本
                if (currentSegment.trim()) {
                    segments.push({ type: 'text', content: currentSegment });
                }
                
                // 重新组装，只对包含中文的文本段进行国际化
                var rebuiltText = '';
                segments.forEach(function(segment) {
                    if (segment.type === 'variable') {
                        rebuiltText += segment.content;
                    } else if (segment.type === 'text') {
                        var text = segment.content.trim();
                        if (text && /[\u4e00-\u9fa5]/.test(text) && !isUrl(text)) {
                            // 包含中文，进行国际化
                            var cleanText = text.replace(/[:：\s]+$/, ''); // 移除末尾的冒号和空格
                            currentKey = VueI18nInstance.getCurrentKey(cleanText, file);
                            VueI18nInstance.setMessageItem(currentKey, cleanText);
                            
                            // 保留原始的空格和标点符号格式
                            var suffix = text.replace(cleanText, '');
                            rebuiltText += "{{$lang('" + currentKey + "')}}" + suffix;
                        } else {
                            // 不包含中文，保持原样
                            rebuiltText += segment.content;
                        }
                    }
                });
                
                result = prev + rebuiltText + after;
            }
            else {
                if (match.match(/\/\*comment_\d+\*\//) || match.match(/___LANG_TEMP_PLACEHOLDER_\d+___/)) {
                    match = match.replace(/[\u4e00-\u9fa5]+/gim, function (m) {
                        return replaceCNText(m, file, VueI18nInstance);
                    });
                    result = prev + match + after;
                }
                else {
                    currentKey = VueI18nInstance.getCurrentKey(match, file);
                    if (prev.match(/^(\w+-){0,}\w+='$/)) {
                        //对于属性中普通文本的替换，不合理的单引号包裹属性值
                        result = ":".concat(prev, "$lang(\"").concat(currentKey, "\")").concat(after);
                    }
                    else if (prev.match(/^(\w+-){0,}\w+="$/)) {
                        //对于属性中普通文本的替换
                        result = ":".concat(prev, "$lang('").concat(currentKey, "')").concat(after);
                    }
                    else if ((prev === '"' && after === '"') || (prev === "'" && after === "'")) {
                        //对于属性中参数形式中的替换
                        result = "$lang(".concat(prev).concat(currentKey).concat(after, ")");
                    }
                    else if (prev === '>' && after === '<') {
                        //对于tag标签中的普通文本替换
                        result = "".concat(prev, "{{$lang('").concat(currentKey, "')}}").concat(after);
                    }
                    else {
                        // 无法处理，还原 result
                        result = prev + match + after;
                        (msg === null || msg === void 0 ? void 0 : msg.warn) && msg.warn("".concat(file, " \u5B58\u5728\u65E0\u6CD5\u81EA\u52A8\u66FF\u6362\u7684\u6587\u672C\uFF08").concat(result, "\uFF09\uFF0C\u8BF7\u624B\u52A8\u5904\u7406"));
                    }
                }
            }
            if (result !== prev + match + after && currentKey) {
                // result有变动的话，设置message
                VueI18nInstance.setMessageItem(currentKey, match);
            }
            return result;
        });
        // 换回注释、require、模板字符串
        return match.replace(/___LANG_TEMP_PLACEHOLDER_\d+___/gim, function (match) {
            return comments[match];
        }).replace(/\/\*template_\d+\*\//gim, function (match) {
            return comments[match];
        }).replace(/\/\*comment_\d+\*\//gim, function (match) {
            return comments[match];
        });
    });
}
exports.default = replaceVueTemplate;
