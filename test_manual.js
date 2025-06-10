// 导入需要的模块
const replaceVueTemplate = require('./lib/core/replaceVueTemplate').default;
const VueI18nInstance = require('./lib/i18nFile').VueI18nInstance;

// 初始化VueI18nInstance
VueI18nInstance.mergeConfig({
    useChineseKey: true  // 使用中文作为key，方便观察
});

// 创建一个简化的VueI18nInstance，仅用于测试
const testVueI18nInstance = {
    messages: {},
    messagesHash: {},
    getCurrentKey: function(text) {
        return text;  // 使用文本本身作为键
    },
    setMessageItem: function(key, value) {
        this.messages[key] = value;
        this.messagesHash[value] = key;
    },
    getMessage: function() {
        return this.messages;
    }
};

// 测试用例 - 模板字符串中的中文
const testTemplate = `<template>
    <div>
        <div class="container" :title="title"></div>
    </div>
</template>`;

// 创建一个带有中文模板字符串的对象
const scriptContent = `
title: \`<div class="text-[#999999]">剩余自动收货时间:</div>\`
`;

// 测试模板字符串处理
console.log('原始内容:');
console.log(scriptContent);

// 执行转换
const result = replaceVueTemplate(testTemplate, 'test.vue', testVueI18nInstance);

// 测试直接替换模板字符串
const directTemplateResult = scriptContent.replace(/`([^`]*)`/gim, function(fullMatch, templateContent) {
    console.log('处理模板内容:', templateContent);
    
    // 检查是否包含$lang，如果包含则跳过
    if (templateContent.includes('$lang(')) {
        console.log('已包含$lang，跳过处理');
        return fullMatch;
    }
    
    // 替换中文内容
    if (/[\u4e00-\u9fa5]/.test(templateContent)) {
        const replaced = templateContent.replace(/([\u4e00-\u9fa5]+)/g, function(match) {
            if (match.includes('$lang(')) {
                console.log('已包含$lang，跳过处理');
                return match;
            }
            console.log('找到中文:', match);
            return `{{$lang('${match}')}}`;
        });
        return '`' + replaced + '`';
    }
    
    return fullMatch;
});

console.log('\n替换结果:');
console.log(directTemplateResult);

// 检查双重替换的情况
const doubleReplaceResult = directTemplateResult.replace(/`([^`]*)`/gim, function(fullMatch, templateContent) {
    console.log('二次处理模板内容:', templateContent);
    
    // 检查是否包含$lang，如果包含则跳过
    if (templateContent.includes('$lang(')) {
        console.log('已包含$lang，跳过处理');
        return fullMatch;
    }
    
    // 替换中文内容
    if (/[\u4e00-\u9fa5]/.test(templateContent)) {
        const replaced = templateContent.replace(/([\u4e00-\u9fa5]+)/g, function(match) {
            console.log('找到中文:', match);
            if (match.includes('$lang(')) {
                console.log('已包含$lang，跳过处理');
                return match;
            }
            return `{{$lang('${match}')}}`;
        });
        return '`' + replaced + '`';
    }
    
    return fullMatch;
});

console.log('\n二次替换结果:');
console.log(doubleReplaceResult); 