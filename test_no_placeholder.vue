<template>
  <div>
    <!-- 测试模板字符串 -->
    <div>{{ `周一至周五${test}9:30-18:30` }}</div>
    
    <!-- 测试属性中的模板字符串 -->
    <button :on-exceed="e =>handleExceed(e, `图片最多支持上传${picMaxLen}张`)">上传</button>
    
    <!-- 测试普通文本 -->
    <div>普通中文文本</div>
    
    <!-- 测试包含变量的文本 -->
    <div>按钮 {{hasPermission ? '有' : '没有'}} 权限</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      test: 'test',
      picMaxLen: 5
    }
  },
  methods: {
    handleExceed() {
      console.log(`上传失败：最多支持${this.picMaxLen}张图片`)
    }
  }
}
</script> 