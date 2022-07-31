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

Make your `config.env` file by example `.env`

```bash
cp .env config.env
```

Set your settings to `config.env`

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

## Run

You can run it via node

```
node index.js
```

or making exeturable

```
chmod +x index.js
```

```bash
which node

# use this path to in crontask
> /usr/bin/node

```

To run it automatically let's add chron task every minute

```
crontab -e
```

Add this row with setting path to Node.js and script

```bash
# set your path
*/1 * * * * cd /home/"timur"/near-node-tg-bot/ && /usr/bin/node index.js > /dev/null 2>&1
```

Reload cron service to start execute script

```bash
sudo service cron reload
```
