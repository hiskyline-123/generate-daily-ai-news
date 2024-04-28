// 文件路径: /api/sendData.js
const processAndSendData = require('../utils/rss-fetch')

// 你的其他代码

module.exports = async (req, res) => {
  try {
    await processAndSendData(); // 调用你的函数
    res.status(200).send('Webhook发送成功');
  } catch (error) {
    console.error('执行过程中发生错误:', error);
    res.status(500).send('执行失败');
  }
};
