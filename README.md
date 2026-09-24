# 孙子读书卡

《孙子兵法》十三篇交互式读书卡：原文、句读导读、通俗讲解、名家对比（五步法）、背诵卡。结构参照 [周易读书卡](https://brianbai1123.github.io/zhouyi-reading-cards/)。

经文用十三篇通行本。白话讲解和名家对比是导读综述，便于学习战略思维，不是教人欺诈或伤害他人的指南。

## 本地运行

```bash
python3 scripts/live_server.py --port 8766
```

打开 http://127.0.0.1:8766 。修改 `html/css/js/data` 后浏览器会自动刷新。

也可以：

```bash
python3 -m http.server 8766
```

## Docker

```bash
chmod +x docker-start.sh docker-stop.sh
./docker-start.sh
./docker-stop.sh
```

## 内容从哪来

`data/chapters.json` 与 `data/essentials.json` 由脚本生成：

```bash
python3 scripts/build_data.py
```

## 页面

- 首页：十三篇入口
- 十三篇：按筹划、形势、机动、地利筛选，可搜索
- 每一篇：通俗讲解、篇文原文、句读导读、名家对比、背诵卡
- 兵法精要：从十三篇抽出的句子
- 读法：建议节奏和阅读边界

名家六家：曹操、杜牧、张预、郭化若、李零、钮先钟。卡片里写的是各家读法的大意，不是逐字引注。
