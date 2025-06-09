// 测试URL过滤功能

// 这些应该被国际化处理
console.log('普通中文文本');
const message = '错误信息';

// 这些URL中的中文不应该被处理
const url1 = 'https://xizhao-mall-swarm.oss-cn-shenzhen.aliyuncs.com/dev/admin/designer/0.8729474770003316/2024612/icon_active_上线排序面性_12@2x.png';
const url2 = 'https://example.com/images/图片文件.jpg';
const url3 = '/static/assets/中文目录/file.pdf';

// 混合情况
const mixedMessage = `上传文件：${url1}`;
console.log(`访问链接：${url2}`); 