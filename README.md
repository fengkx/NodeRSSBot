# NodeRSSBot

Another telegram RSSBot in Node.js

An RSSBot in telegram similar to [https://github.com/iovxw/rssbot/](https://github.com/iovxw/rssbot/). But this time in Node.js.

# Support version

RSS is parsered using [rss-parser](https://www.npmjs.com/package/rss-parser)

# Usage

```
/rss       - show subscriptions，add raw to show links
/sub       - subscribe a RSS: /sub http://example.com/feed.xml automatically detecting RSS feed is supported
/unsub     - unsubscribe a RSS: /unsub http://example.com/feed.xml or by keyboard
/unsubthis - reply a message from a RSS feed to unsubscribe it
/allunsub  - unsubscribe all feeds
/export    - export subscriptions to opml file
/viewall   - view all subscriptions and number of subscribers need to enable in settings
/import    - reply this message a opml file to import(in group)
/lang      - change language
```

Automatically detecting RSS feed ，you can use `/sub https://www.fengkx.top` rather than `/sub https://www.fengkx.top/atom.xml`

You can send multi feeds directly to subscribe in private chat(split by line)

You can add channel id to subscribe a feed for a channel in private chat after adding the bot as administrator  
for example `/sub <channel id > <feed url>` (channel id is start with @)

You can send a opml file directly to import feed in private chat
use `/import` in the group

for channel, import send a opml file name by channel id with a opml suffix name in private chat for example `@myChannel.opml`

viewall can only be used in private chat

# Depolyment

## Docker

### Use autobuild docker image

After install docker

1. Run`docker pull fengkx/node_rssbot`
1. Run `docker run --name rssbot -d -v <directory to store database file>:/app/data/ -e RSSBOT_TOKEN=<YOUR_TGBOT_TOKEN> fengkx/node_rssbot`

for exmaple `docker run --name rssbot -d -v /var/data:/app/data/ -e RSSBOT_TOKEN=123456:abcdef123456-U fengkx/rssbot`

### Build docker locally

1. Install Docker
1. clone this repository `git clone https://github.com/fengkx/NodeRSSBot.git`
1. Run `docker build .` then you will get a image id
1. Run`docker run --name rssbot -d -e RSSBOT_TOKEN=<YOUR_TGBOT_TOKEN> <YOUR_IMAGE_ID>`

for example `docker run --name rssbot -d -e RSSBOT_TOKEN=123456:abcdef123456-U fd54321bff2`

## PM2

1. Node.js and npm installed
1. clone this repository `git clone https://github.com/fengkx/NodeRSSBot.git`
1. Set the `RSSBOT_TOKEN` environment variable or set it in config/index.js
1. Install dependencies run `npm i` in the root directory of the repository
1. Run `pm2 start npm --name node_rssbot -- start` (recommend) or `npm start`

**Note that NODE_PRODUTION environment should be set in prodution mode**

# Setting

**All setting can be set by either environment variable or in `config/index.js`**

| setting            | env                | default/require                                                | description                                                                  |
| ------------------ | ------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| token              | RSSBOT_TOKEN       | **require**                                                    | [telegram bot token](https://core.telegram.org/bots#3-how-do-i-create-a-bot) |
| db_path            | RSSBOT_DB_PATH     | data/database.db                                               | path to store database file                                                  |
| lang               | RSSBOT_LANG        | zh-cn                                                          | language                                                                     |
| item_num           | RSSBOT_ITEM_NUM    | 10                                                             | send the laset number of item                                                |
| fetch_gap          | RSSBOT_FETCH_GAP   | 5m                                                             | fetch gap                                                                    |
| notify_error_count | NOTIFY_ERR_COUNT   | 5                                                              | error count when it will notfiy                                              |
| view_all           | RSSBOT_VIEW_ALL    | false                                                          | enable or not                                                                |
| UA                 | RSSBOT_UA          | 'Mozilla/5.0 NodeRSSBot(https://github.com/fengkx/NodeRSSBot)' | user-agent of requrest                                                       |
| cocurrency         | RSSBOT_CONCURRENCY | 200                                                            |
| proxy.protocol     | PROXY_PROTOCOL     | null                                                           | proxy protocol http/https/socks                                              |
| proxy.host         | PROXY_HOST         | null                                                           | proxy host                                                                   |
| proxy.port         | PROXY_PORT         | null                                                           | proxy port                                                                   |

fetch_gap can be set in how many minutes or hours。m for minute， h for hour

for example, 5m means every 5 minutes， 1h means every 1 hour

# i18n

translate the file in `i18n` in another yaml and make a pull request (๑•̀ㅂ•́)و✧

## support language

set `lang` setting using one of the following languages

-   en English
-   zh-cn Simplified Chinese
-   zh-tw Tranditional Chinese provided by @partment
-   es-es Spanish provided by @NPueyo
-   pt-br Portuguese provided by @dubaid
-   lt Lithuanian provided by @wait-what

---

# 中文文档

# NodeRSSBot

又是一个 telegram RSS Bot 不过这次用的是 Node.js

模仿[https://github.com/iovxw/rssbot/](https://github.com/iovxw/rssbot/) 做的一个 RSSBot，用[telegraf](https://www.npmjs.com/package/telegraf)  
首先感谢 iovxw 的 RSSBot 一直用的很好  
做这个东西只是为了，配置起来更方便一些不用安装 Rust 的工具链和编译

# 支持的版本

RSS 解析用的是 [rss-parser](https://www.npmjs.com/package/rss-parser)，它支持的就支持

# Usage

```
/rss       - 显示订阅列表，加 `raw`显示链接
/sub       - 订阅 RSS: /sub http://example.com/feed.xml 支持自动检测 RSS feed
/unsub     - 退订 RSS: /unsub http://example.com/feed.xml 或者通过键盘
/unsubthis - 回复一个 RSS 发来的消息退订该 RSS
/allunsub  - 退订所有源
/export    - 导出订阅到opml文件
/viewall   - 查看所有订阅和订阅人数 需要在设置中打开
/import    - 回复此消息 opml 文件导入订阅(群组)
/lang      - 更改语言
```

自动检测 RSS feed，可以直接 `/sub https://www.fengkx.top` 而不用 `/sub https://www.fengkx.top/atom.xml`

私聊可以直接发送 feed 地址订阅，支持同时发送多个地址按行分割

把 bot 设为频道管理员并正确配置权限后，可通过私聊在`/sub`后加上频道 id 来在频道中订阅 feed
例如 `/sub <频道 id > <feed url>` (频道 id 是@打头的)

直接发送 opml 文件，可以导入 RSS 源  
频道导入需要将文件名改成频道 id 并且以 opml 作为后缀在私聊中发送 例如 `@myChannel.opml`  
viewall 只能在私聊中使用

# 部署

## Docker

### 使用自动构建的 docker image

安装好了 docker 之后

1. 运行`docker pull fengkx/node_rssbot`
1. 运行 `docker run --name rssbot -d -v <directory to store database file>:/app/data/ -e RSSBOT_TOKEN=<YOUR_TGBOT_TOKEN> fengkx/node_rssbot`

例如 `docker run --name rssbot -d -v /var/data:/app/data/ -e RSSBOT_TOKEN=123456:abcdef123456-U fengkx/rssbot`

### 本地构建

1. 安装 Docker
1. 克隆仓库 `git clone https://github.com/fengkx/NodeRSSBot.git`
1. 构建 docker image `docker build .` then you will get a image id
1. 运行 `docker run --name rssbot -d -e RSSBOT_TOKEN=<YOUR_TGBOT_TOKEN> <YOUR_IMAGE_ID>`

例如 `docker run --name rssbot -d -e RSSBOT_TOKEN=123456:abcdef123456-U fd54321bff2`

## PM2

1. 首先要有 Node.js 和 npm 或 yarn
1. 克隆仓库 `git clone https://github.com/fengkx/NodeRSSBot.git`
1. 设置 `RSSBOT_TOKEN` 环境变量，或者直接在 `config/index.js` 中修改
1. 安装依赖 在仓库根目录运行`npm i`
1. 推荐用 `pm2` 守护进程 `pm2 start npm --name node_rssbot -- start` 如果没有安装`pm2` 就先安装 `npm i -g pm2` 或者直接 `npm start`

**注意生产环境下要设置 NODE_PRODUTION 环境变量**

# TODO

-   [x] export 命令
-   [x] 代理
-   unit test

# 配置项

**所有配置项都可以用环境变量或者直接在 `config/index.js`中修改**

| 设置项             | 环境变量           | 默认/必填                                                      | 描述                                                                         |
| ------------------ | ------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| token              | RSSBOT_TOKEN       | **require**                                                    | [telegram bot token](https://core.telegram.org/bots#3-how-do-i-create-a-bot) |
| db_path            | RSSBOT_DB_PATH     | data/database.db                                               | 数据库文件路径                                                               |
| lang               | RSSBOT_LANG        | zh-cn                                                          | 语言                                                                         |
| item_num           | RSSBOT_ITEM_NUM    | 10                                                             | 发送最新几条信息                                                             |
| fetch_gap          | RSSBOT_FETCH_GAP   | 5m                                                             | 抓取间隔                                                                     |
| notify_error_count | NOTIFY_ERR_COUNT   | 5                                                              | 发出通知的错误次数                                                           |
| view_all           | RSSBOT_VIEW_ALL    | false                                                          | 是否开启                                                                     |
| UA                 | RSSBOT_UA          | 'Mozilla/5.0 NodeRSSBot(https://github.com/fengkx/NodeRSSBot)' | 请求的 user-agent                                                            |
| cocurrency         | RSSBOT_CONCURRENCY | 200                                                            |
| proxy.protocool    | PROXY_PROTOCOL     | null                                                           | 代理协议 http/https/socks                                                    |
| proxy.host         | PROXY_HOST         | null                                                           | 代理地址                                                                     |
| proxy.port         | PROXY_PORT         | null                                                           | 代理端口                                                                     |

语言可以设置为 `zh-cn` or `en`
时间间隔可设置为每多少分钟或多少小时。m 表示分钟， h 表示小时

例如 5m 表示每 5 分钟， 1h 表示每 1 小时

# i18n

在 `i18n`目录翻译 yaml 文件然后来个 ·pr· (๑•̀ㅂ•́)و✧

## support language

以下任意一个语言作为`lang`配置项

-   en English
-   zh-cn 简体中文
-   zh-tw 繁體中文 by @partment
-   es-es Spanish provided by @NPueyo
-   pt-br Portuguese provided by @dubaid
-   lt Lithuanian provided by @wait-what
