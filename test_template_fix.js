// 测试模板字符串处理
XZMessage.info(`按钮foo ${hasAuth ? '有权限' : '没有权限'}`);

console.log(`用户 ${user.name} 的状态是 ${user.status === 'active' ? '活跃' : '非活跃'}`);

// 测试简单模板字符串
const message = `今天是${date}，天气不错`;

// 测试复杂表达式
const notification = `${count > 0 ? `有${count}条新消息` : '暂无消息'}`; 