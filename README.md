## This script was created to Notify Near Validators about state changes in their nodes

Created by Timur Ruziev (partisapant of [**stakewars-iii**](https://github.com/near/stakewars-iii))

You can see my challenge report here: https://github.com/ruziev-dev/near-stakewars-iii

## Installation:

Clone repository & install dependencies

```bash
git clone https://github.com/ruziev-dev/near-node-tg-bot.git

cd near-node-tg-bot

npm i
```

Make your config.env file by example .env

```bash
cp .env config.env
```

Set your settings to config.env

```bash
nano config.env

# set your values
TG_API_KEY=""
TG_CHAT_ID=""
NODE_RPC="127.0.0.1:3030"
POOL_ID="xxx.factory.shardnet.near"
```

- TG_API_KEY - you can get from [**@BotFather**](https://t.me/BotFather)
- TG_CHAT_ID - you can by using [**@GetIDs Bot**](https://t.me/getidsbot)


