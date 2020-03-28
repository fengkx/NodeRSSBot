# NodeRSSBot

[![Node CI](https://github.com/fengkx/NodeRSSBot/workflows/Node%20CI/badge.svg?branch=master)](https://github.com/fengkx/NodeRSSBot/actions?query=workflow%3A%22Node+CI%22)
[![Publish Docker](https://github.com/fengkx/NodeRSSBot/workflows/Publish%20Docker/badge.svg?branch=master)](https://github.com/fengkx/NodeRSSBot/actions?query=workflow%3A%22Publish+Docker%22)
[![Docker pulls](https://badgen.net/docker/pulls/fengkx/node_rssbot)](https://hub.docker.com/repository/docker/fengkx/node_rssbot)
[![Docker image size](https://badgen.net/docker/size/fengkx/node_rssbot/latest/amd64)](https://hub.docker.com/repository/docker/fengkx/node_rssbot)

Another telegram RSSBot in Node.js

An RSSBot in telegram similar to [https://github.com/iovxw/rssbot/](https://github.com/iovxw/rssbot/). But this time in Node.js.

# Hightlights

1. Import and export an opml file
1. [Various configuration](https://github.com/fengkx/NodeRSSBot/wiki/English-Document)
1. Pagination on command that list feeds
1. Automaticlly extract feed from page (from link tag with type such as `type="application/atom+xml"`)
1. I18N

# Commands

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
/heath     - show the heath of actively subscribed feed
```

# Deploy with docker

Once you got a [telegram bot token](https://core.telegram.org/bots#3-how-do-i-create-a-bot) and docker installed

```sh
docker run --name rssbot -d -v <directory to store database file>:/app/data/ -e RSSBOT_TOKEN=<YOUR_TGBOT_TOKEN> fengkx/node_rssbot
```

More ways to depoly and more configurations can be found on [Wiki](https://github.com/fengkx/NodeRSSBot/wiki)

# NodeRSSBot

又是一个 telegram RSS Bot 不过这次用的是 Node.js

# Hightlights

1. OPML 文件导入导出
1. [丰富的可配置项](https://github.com/fengkx/NodeRSSBot/wiki/%E4%B8%AD%E6%96%87%E6%96%87%E6%A1%A3)
1. 命令支持按键翻页
1. 自动从网页中读取 feed url (从 type 类似这样的 link 标签中读取 `type="application/atom+xml"`)
1. I18N

# Commands

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
/heath      - 展示活跃订阅源的健康程度
```

# Deploy with docker

有了 [telegram bot token](https://core.telegram.org/bots#3-how-do-i-create-a-bot) 并安装 Docker 之后

```sh
docker run --name rssbot -d -v <directory to store database file>:/app/data/ -e RSSBOT_TOKEN=<YOUR_TGBOT_TOKEN> fengkx/node_rssbot
```

更多部署方式和配置项请参见 [Wiki](https://github.com/fengkx/NodeRSSBot/wiki)
