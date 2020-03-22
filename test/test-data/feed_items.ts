import { FeedItem } from '../../source/types/feed';

export const atom: FeedItem = {
    link: 'https://www.v2ex.com/t/611572#reply218',
    title: '采取 RESTful 风格的 api 是否应该对结果包一层？',
    content:
        '\n\t<p>RT，今天公司的新项目开始对接，app 端的一看我这接口就吐槽我。让我改成如下这种：\n{\n"code": 200,\n"message": "",\n"data": xxx\n}</p>\n<p>但我觉得首先这 code 肯定是多余的，可以直接从 http 状态码里面读取。之前也看过 twitter 的 api，也没有说包一层，200 的话那就直接返回 data 了。\n公司项目我就忍忍算了，毕竟人家老员工。但后面有自己项目的话，还是想弄标准一点。不知道一般来说，大家是怎样实现？</p>\n\n\t',
    id: 'tag:www.v2ex.com,2019-10-21:/t/611572'
};

export const rss: FeedItem = {
    link: 'https://toutiao.io/k/dld5rnz',
    title: '不论微信钉钉还是什么软件，我写了个通用的消息监控处理机器人',
    content: '不论微信钉钉还是什么软件，我写了个通用的消息监控处理机器人',
    guid: 'https://toutiao.io/k/dld5rnz'
};

export const noKey: FeedItem = {
    link: 'https://toutiao.io/k/dld5rnz',
    title: '不论微信钉钉还是什么软件，我写了个通用的消息监控处理机器人',
    content: '不论微信钉钉还是什么软件，我写了个通用的消息监控处理机器人'
};
