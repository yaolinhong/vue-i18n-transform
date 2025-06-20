const fs = require('fs');
const path = require('path');
const VueI18nInstance = require('./lib/i18nFile').VueI18nInstance;

// 初始化VueI18nInstance
VueI18nInstance.mergeConfig({
  single: false,
  filename: 'zh_cn',
  entry: 'src',
  outdir: 'src/locales',
  exclude: ['src/locales'],
  extensions: ['.js', '.vue', '.ts'],
  useChineseKey: true,
  projectDirname: __dirname
});

// 创建测试文件路径
const testFilePath = path.resolve(__dirname, 'test_nested.vue');

// 标准的测试文件内容
const testContent = `<template>
  <div>
    <div :title="title"></div>
    <div :content="content"></div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      // 这里是问题重现场景
      title: \`<div class="text-[#999999]">剩余自动收货时间:</div>\`,
      // 添加另一个测试情况
      content: \`已有中文\${$lang('测试内容')}\`
    }
  }
}
</script>`;

// 将测试内容写入测试文件
fs.writeFileSync(testFilePath, testContent, 'utf8');

// 模拟msg对象
const msg = {
  warn: console.warn,
  info: console.info
};

// 提取模板部分
const match = testContent.match(/<template(.|\n|\r)*template>/gim)[0];

// 使用replaceVueTemplate处理
const result = require('./lib/core/replaceVueTemplate').default(match, testFilePath, VueI18nInstance, msg);

// 输出结果
console.log('==== 转换结果 ====');
console.log(result);
console.log('\n==== 消息字典 ====');
console.log(VueI18nInstance.getMessage());

// 检查是否存在嵌套$lang问题
if (result.includes("$lang('$lang(")) {
  console.log('\n❌ 测试失败: 发现嵌套的$lang调用!');
} else if (result.match(/\$lang\(['"]\$lang\(/)) {
  console.log('\n❌ 测试失败: 发现嵌套的$lang调用!');
} else {
  console.log('\n✅ 测试通过: 没有发现嵌套的$lang调用');
}

// 检查原本已包含$lang的文本是否被正确保留
if (result.includes("已有中文${$lang('测试内容')}")) {
  console.log('✅ 测试通过: 已包含$lang的文本被正确保留');
} else {
  console.log('❌ 测试失败: 已包含$lang的文本没有被正确处理');
}