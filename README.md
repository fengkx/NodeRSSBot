# NodeRSSBot
Another telegram RSSBot in Node.js

A RSSBot in telegram similar to [https://github.com/iovxw/rssbot/](https://github.com/iovxw/rssbot/). But this time in Node.js.

# Support version
RSS is parsered using [rss-parser](https://www.npmjs.com/package/rss-parser)

# Usage
The same as [https://github.com/iovxw/rssbot/](https://github.com/iovxw/rssbot/)

```
/rss       - show subscriptions，add raw to show links
/sub       - subscribe a RSS: /sub http://example.com/feed.xml
/unsub     - unsubscribe a RSS: /unsub http://example.com/feed.xml
/unsubthis - reply a message from a RSS feed to unsubscribe it
/allunsub  - unsubscribe all feeds
/export    - export subscriptions to opml file
/viewall   - view all subscriptions and number of subscribers need to enable in settings，add raw to show links
```

You can send a opml file directly to import feed 

# Depolyment
## Docker
### Use autobuild docker image
After install docker
1. Run`docker pull fengkx/node_rssbot`
1. Run `docker run --name rssbot -d -v <directory to store database file>:/app/data/ -e RSSBOT_TOKEN=<YOUR_TGBOT_TOKEN>  fengkx/node_rssbot`

for exmaple `docker run --name rssbot -d -v /var/data:/app/data/ -e RSSBOT_TOKEN=123456:abcdef123456-U  fengkx/rssbot`

### Build docker locally
1. Install Docker
1. clone this repository `git clone https://github.com/fengkx/NodeRSSBot.git`
1. Run `docker build .` then you will get a image id
1. Run`docker run --name rssbot -d -e RSSBOT_TOKEN=<YOUR_TGBOT_TOKEN>  <YOUR_IMAGE_ID>`

for example `docker run --name rssbot -d -e RSSBOT_TOKEN=123456:abcdef123456-U  fd54321bff2`

## PM2
1. Node.js and npm installed
1. clone this repository `git clone https://github.com/fengkx/NodeRSSBot.git`
1. Set the `RSSBOT_TOKEN` environment variable or set it in config/index.js
1. Install dependencies run `npm i` in the root directory of the repository
1. Run `pm2 start index.js`

# Setting
**All setting can be set by either environment variable or in `config/index.js`**

| 设置项                | 环境变量             | 默认/必填            | 描述                                       |
| ------------------ | ---------------- | ---------------- | ---------------------------------------- |
| token              | RSSBOT_TOKEN     | **require**      | [telegram bot token](https://core.telegram.org/bots#3-how-do-i-create-a-bot) |
| db_path            | RSSBOT_DB_PATH   | data/database.db | 数据库文件路径                                  |
| lang               | RSSBOT_LANG      | zh-cn            | 语言                                       |
| item_num           | RSSBOT_ITEM_NUM  | 5                | 发送最新几条信息                                 |
| fetch_gap          | RSSBOT_FETCH_GAP | 5m               | 抓取间隔                                     |
| notify_error_count | NOTIFY_ERR_COUNT | 5                | 发出通知的错误次数                                |
| view_all           | RSSBOT_VIEW_ALL  | false            | 是否开启                                     |



language can be setting in `zh-cn` or `en`     

fetch_gap can be setting in how many minutes or hours。m for minute， h for hour
      
for example 5m means every 5 minutes， 1h means every 1 hour

# i18n

translate the file in `i18n` in the another yaml and make a pull request (๑•̀ㅂ•́)و✧

---------------
# 中文文档

# NodeRSSBot
又是一个 telegram RSS Bot 不过这次用的是 Node.js

模仿[https://github.com/iovxw/rssbot/](https://github.com/iovxw/rssbot/) 做的一个RSSBot，用[telegraf](https://www.npmjs.com/package/telegraf)    
首先感谢 iovxw 的 RSSBot 一直用的很好       
做这个东西只是为了，配置起来更方便一些不用安装Rust的工具链和编译

# 支持的版本
RSS 解析用的是 [rss-parser](https://www.npmjs.com/package/rss-parser)，它支持的就支持

# Usage
基本与 [https://github.com/iovxw/rssbot/](https://github.com/iovxw/rssbot/)一致

```
/rss       - 显示订阅列表，加 `raw`显示链接
/sub       - 订阅 RSS: /sub http://example.com/feed.xml
/unsub     - 退订 RSS: /unsub http://example.com/feed.xml
/unsubthis - 回复一个 RSS 发来的消息退订该 RSS
/allunsub  - 退订所有源
/export    - 导出订阅到opml文件
/viewall   - 查看所有订阅和订阅人数 需要在设置中打开，加 `raw`显示链接
```
直接发送opml文件，可以导入RSS源


# 部署
## Docker

### 使用自动构建的 docker image
安装好了 docker 之后
1. 运行`docker pull fengkx/node_rssbot`
1. 运行 `docker run --name rssbot -d -v <directory to store database file>:/app/data/ -e RSSBOT_TOKEN=<YOUR_TGBOT_TOKEN>  fengkx/node_rssbot`

例如 `docker run --name rssbot -d -v /var/data:/app/data/ -e RSSBOT_TOKEN=123456:abcdef123456-U  fengkx/rssbot`

### 本地构建
1. 安装 Docker
1. 克隆仓库 `git clone https://github.com/fengkx/NodeRSSBot.git`
1. 构建 docker image `docker build .` then you will get a image id
1. 运行 `docker run --name rssbot -d -e RSSBOT_TOKEN=<YOUR_TGBOT_TOKEN>  <YOUR_IMAGE_ID>`

例如 `docker run --name rssbot -d -e RSSBOT_TOKEN=123456:abcdef123456-U  fd54321bff2`

## PM2

1. 首先要有 Node.js 和 npm 或 yarn
1. 克隆仓库 `git clone https://github.com/fengkx/NodeRSSBot.git`
1. 设置 `RSSBOT_TOKEN` 环境变量，或者直接在 `config/index.js` 中修改
1. 安装依赖 在仓库根目录运行`npm i`
1. 推荐用 `pm2` 守护进程 `pm2 start index.js` 如果没有安装`pm2` 就先安装 `npm i -g pm2`

# TODO
- [x] export 命令
- 代理 
- unit test

# 配置项
**所有配置项都可以用环境变量或者直接在 `config/index.js`中修改**


| setting            | env              | default/require  | description                              |
| ------------------ | ---------------- | ---------------- | ---------------------------------------- |
| token              | RSSBOT_TOKEN     | **require**      | [telegram bot token](https://core.telegram.org/bots#3-how-do-i-create-a-bot) |
| db_path            | RSSBOT_DB_PATH   | data/database.db | path to store database file              |
| lang               | RSSBOT_LANG      | zh-cn            | language                                 |
| item_num           | RSSBOT_ITEM_NUM  | 5                | send the laset number of item            |
| fetch_gap          | RSSBOT_FETCH_GAP | 5m               | fetch gap                                |
| notify_error_count | NOTIFY_ERR_COUNT | 5                | error count  when it will notfiy         |
| view_all           | RSSBOT_VIEW_ALL  | false            | enable or not                            |

语言可以设置为 `zh-cn` or `en`
时间间隔可设置为每多少分钟或多少小时。m 表示分钟， h表示小时

例如 5m 表示每5分钟， 1h 表示每1小时

# i18n
在 `i18n`目录翻译yaml文件然后来个 ·pr· (๑•̀ㅂ•́)و✧
