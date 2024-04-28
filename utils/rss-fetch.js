const Parser = require('rss-parser');
const parser = new Parser();
const moment = require('moment-timezone');
const axios = require('axios'); // 引入axios库用于发送webhook

const RSS_FEED_URL = "https://rss.app/feeds/LHKHPl2e1aLEJ7eN.xml";

const FILTER = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  PAST_THREE_DAYS: 'threeDays',
  PAST_SEVEN_DAYS: 'sevenDays'
};

function isWithinTimeFrame(pubDate, timeFrame) {
  const publicationDate = moment.tz(pubDate, 'ddd, DD MMM YYYY HH:mm:ss [GMT]', 'GMT');
  const now = moment.tz(new Date(), 'GMT');

  switch (timeFrame) {
    case FILTER.TODAY:
      return publicationDate.isSame(now, 'day');
    case FILTER.YESTERDAY:
      return publicationDate.isSame(now.clone().subtract(1, 'days'), 'day');
    case FILTER.PAST_SEVEN_DAYS:
        return publicationDate.isAfter(now.clone().subtract(7, 'days').startOf('day'));
    case FILTER.PAST_THREE_DAYS:
      return publicationDate.isAfter(now.clone().subtract(3, 'days').startOf('day'));
    default:
      return false;
  }
}

async function parseRSSGroupedByDate(url, timeFrame) {
  try {
    const feed = await parser.parseURL(url);
    const groupedItems = {};

    feed.items.forEach(item => {
      if (isWithinTimeFrame(item.pubDate, timeFrame)) {
        const date = moment(item.pubDate).format('YYYY-MM-DD');
        if (!groupedItems[date]) {
          groupedItems[date] = [];
        }
        groupedItems[date].push({
          title: item.title,
          link: item.link,
          publicationDate: moment(item.pubDate).format('ddd, DD MMM YYYY HH:mm:ss [GMT]')
        });
      }
    });

    return groupedItems; // 返回分组好的数据

  } catch (error) {
    console.error('解析RSS feed时发生了错误:', error);
    throw error; // 将错误向上抛出，让调用者处理
  }
}

/**
 * 发送一个webhook请求
 * @param {string} url - webhook的URL地址
 * @param {object} data - 发送到webhook的JSON数据
 * @returns {Promise} - 返回请求的结果
 */
async function sendWebhook(url, data) {
    try {
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Webhook请求失败:', error);
        throw error; // 将错误向上抛出，让调用者处理
    }
}

async function processAndSendData() {
  const groupedData = await parseRSSGroupedByDate(RSS_FEED_URL, FILTER.YESTERDAY);
//   console.log(groupedData)
  const webhookUrl = 'https://www.taskade.com/webhooks/flow/01HWH5WASC9A7QRVB2DJPFNMKQ'; // 替换为实际的webhook URL
  await sendWebhook(webhookUrl, { data: JSON.stringify(groupedData) });
  console.log('Webhook发送成功');
}

module.exports =  processAndSendData
