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
POOL_ID="xxx.poolv1.near"
```

- TG_API_KEY - you can get from [**@BotFather**](https://t.me/BotFather)
- TG_CHAT_ID - you can by using [**@GetIDs Bot**](https://t.me/getidsbot)

## Run

```
node index.js
```
After first running you will get the first message to you Telegram messenger and current state will be saved to `.prev_state.json`

> If you want to test again you have to remove state file.
> ```
> rm .prev_state.json
> ```


## To automate running script find path to Node.js

```bash
which node

# use this path to in crontask
> /usr/bin/node

```

Add chron task every minute

```
crontab -e
```

Add this row with setting path to Node.js and script

```bash
# set your path
*/1 * * * * cd /home/<USERNAME>/near-node-tg-bot/ && /usr/bin/node index.js > /dev/null 2>&1
```

Reload cron service to start execute script

```bash
sudo service cron reload
```

Examples of notifications you can see below:

1. When there is some connection error or neard had stopped

![img](https://github.com/ruziev-dev/near-stakewars-iii/raw/main/images/monitoring/new_bot/connection_error.png)

2. When uptime lower 80% and goes down

![img](https://github.com/ruziev-dev/near-stakewars-iii/raw/main/images/monitoring/new_bot/down_uptime.png)

3. When new epoch was started

![img](https://github.com/ruziev-dev/near-stakewars-iii/raw/main/images/monitoring/new_bot/new_epoch.png)
