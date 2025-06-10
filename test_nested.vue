<template>
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
      title: `<div class="text-[#999999]">剩余自动收货时间:</div>`,
      // 添加另一个测试情况
      content: `已有中文${$lang('测试内容')}`
    }
  }
}
</script>