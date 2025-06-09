// 测试三元表达式和对象键值的区分
const obj = {
    "中文键": "值",
    name: "测试"
};

// 这个应该正确处理
XZMessage.info(`按钮foo ${hasAuth ? '有权限' : '没有权限'}`);

// 这个也应该正确处理
const message = hasAuth ? '有权限' : '没有权限'; 