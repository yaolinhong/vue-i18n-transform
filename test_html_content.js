// 测试HTML内容处理

const data = {
    // 普通字符串
    statusName: '已提交',
    
    // 包含HTML的富文本
    title: `<div class='text-[#FFA600]'>订单创建: ${submitTime}</div>`,
    
    // 复杂HTML结构
    description: `<p>用户信息</p><span>状态：活跃</span>`,
    
    // 纯英文HTML（不应该处理）
    englishHtml: `<div class="container">User Status: ${status}</div>`
}; 