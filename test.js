const transform = require('./lib/core/transform');
const VueI18nInstance = require('./lib/i18nFile').VueI18nInstance;

// 初始化VueI18nInstance
VueI18nInstance.mergeConfig({
  single: false,
  filename: 'zh_cn',
  entry: 'src',
  outdir: 'src/locales',
  exclude: ['src/locales'],
  extensions: ['.js', '.vue', '.ts'],
  useChineseKey: false
});

// 清空现有消息
VueI18nInstance.resetMessage();

// 测试用例 - 专门测试嵌套$lang问题
const template = `<template>
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

// 执行转换
const result = transform.replaceVueScript(template, 'test_nested.vue', VueI18nInstance, {
  warn: console.warn
});

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