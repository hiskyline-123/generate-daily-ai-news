// 文件路径: /api/sendData.js
const processAndSendData = require('./utils/rss-fetch.js')

async function init () {
    await processAndSendData()
}

init();