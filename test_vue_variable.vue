<template>
  <div>
    <!-- 测试包含变量的中文文本 -->
    <p v-if="scope.row.type == 1">借用时间:{{ scope.row.borrowTime }}</p>
    
    <!-- 测试多个变量 -->
    <div>用户{{ user.name }}的状态是{{ user.status }}</div>
    
    <!-- 测试纯中文 -->
    <span>普通中文文本</span>
    
    <!-- 测试英文+变量（不应该处理） -->
    <div>User: {{ user.name }}</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: { name: 'test', status: 'active' }
    }
  }
}
</script> 