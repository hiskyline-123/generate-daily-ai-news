const Parser = require('rss-parser');
const moment = require('moment-timezone');
const RSS_FEED_URL = "https://rss.app/feeds/LHKHPl2e1aLEJ7eN.xml";
const axios = require('axios');

const FILTER = {

    TODAY: 'today',

    YESTERDAY: 'yesterday',

    PAST_THREE_DAYS: 'threeDays',

    PAST_SEVEN_DAYS: 'sevenDays'

};

async function sendWebhook(url, data) {
    try {
        const response = await axios.post(url, { data: data }, {
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


function decodeHtmlEntities(text) {

    const entityMap = {

        '&amp;': '&',

        '&lt;': '<',

        '&gt;': '>',

        '&quot;': '"',

        '&apos;': "'",

        '&#39;': "'"

    };

    return text.replace(/&amp;|&lt;|&gt;|&quot;|&apos;|&#39;/g, match => entityMap[match]);

}



function isWithinTimeFrame(pubDate, timeFrame) {

    const publicationDate = moment(pubDate);

    const now = moment();

    const yesterday = now.clone().subtract(1, 'days').startOf('day');



    switch (timeFrame) {

        case FILTER.TODAY:

            return publicationDate.isSame(now, 'day');

        case FILTER.YESTERDAY:

            return publicationDate.isSame(yesterday, 'day');

        case FILTER.PAST_THREE_DAYS:

            return publicationDate.isAfter(now.clone().subtract(3, 'days').startOf('day'));

        case FILTER.PAST_SEVEN_DAYS:

            return publicationDate.isAfter(now.clone().subtract(7, 'days').startOf('day'));

        default:

            return false;

    }

}



async function parseRSSGroupedByDate(url, timeFrame) {

    const parser = new Parser();

    try {

        const feed = await parser.parseURL(url);

        const groupedItems = {};



        feed.items.forEach(item => {

            if (isWithinTimeFrame(item.pubDate, timeFrame)) {

                const formattedDate = moment(item.pubDate).format('YYYY-MM-DD');

                if (!groupedItems[formattedDate]) {

                    groupedItems[formattedDate] = [];

                }

                groupedItems[formattedDate].push({

                    title: item.title,

                    link: item.link,

                    publicationDate: item.pubDate,

                    content: decodeHtmlEntities(item.content)

                });

            }

        });



        return groupedItems;

    } catch (error) {

        console.error('Error parsing RSS feed:', error);

        throw error;

    }

}



async function processAndSendData() {

    try {

        const groupedData = await parseRSSGroupedByDate(RSS_FEED_URL, FILTER.YESTERDAY);

        // console.log(groupedData)

        const webhookUrl = 'https://www.taskade.com/webhooks/flow/01HWH5WASC9A7QRVB2DJPFNMKQ';

        await sendWebhook(webhookUrl, JSON.stringify(groupedData));

        console.log('Webhook sent successfully');

    } catch (error) {

        console.error('Failed to process and send data:', error);

    }

}



module.exports = processAndSendData;

