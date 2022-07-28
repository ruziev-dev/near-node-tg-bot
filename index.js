#! /usr/bin/env node

import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config({ path: "./config.env" });
const __dirname = path.resolve();

const STATE_FILE = __dirname + "/.prev_state.json";

let prev_state;
try {
  prev_state = fs.readFileSync(STATE_FILE, { encoding: "utf8", fd: null });
} catch (error) {
  // do nothing, script create the file in end of script
}

class TelegramBot {
  #TG_CHAT_ID = "";
  #BASE__URL = "";

  constructor(API_KEY, TG_CHAT_ID) {
    this.#TG_CHAT_ID = TG_CHAT_ID;
    this.#BASE__URL = `https://api.telegram.org/bot${API_KEY}/`;
  }

  async sendMessage(message) {
    const fullHttpLink = this.#getFullLink(message, "sendMessage");
    await fetch(fullHttpLink);
  }

  #getFullLink(message, path) {
    const params = new URLSearchParams();
    params.set("chat_id", this.#TG_CHAT_ID);
    params.set("text", message);
    params.set("parse_mode", "MARKDOWN");
    return this.#BASE__URL + path + "?" + params.toString();
  }
}

class NodeFetcher {
  #BASE_URL = "";
  constructor(NODE_IP) {
    this.#BASE_URL = `http://${NODE_IP}/`;
  }

  async ping() {
    const url = this.#BASE_URL + "status";
    return await fetch(url);
  }

  async checkValidators() {
    return await fetch(this.#BASE_URL, {
      method: "POST",
      body: '{"jsonrpc": "2.0", "method": "validators", "id": "dontcare", "params": [null]}',
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

const { TG_API_KEY, TG_CHAT_ID, NODE_RPC, POOL_ID } = process.env;

const tgBot = new TelegramBot(TG_API_KEY, TG_CHAT_ID);
const nodeFetcher = new NodeFetcher(NODE_RPC, POOL_ID);

// callback to find my pool id in different arrays
const findMyPoolId = (pool) => pool.account_id === POOL_ID;

const main = async () => {
  try {
    const node = await nodeFetcher.ping();
    const { validator_account_id } = await node.json();

    const status = await nodeFetcher.checkValidators();
    const { result } = await status.json();

    const myFishermenState = result.current_fishermen.find(findMyPoolId);
    const myKickoutState = result.prev_epoch_kickout.find(findMyPoolId);
    const myProposalState = result.current_proposals.find(findMyPoolId);
    const myValidatorState = result.current_validators.find(findMyPoolId);
    const myNextFishermenState = result.next_fishermen.find(findMyPoolId);
    const myNextValidatorsState = result.next_validators.find(findMyPoolId);

    const newState = {
      myFishermenState,
      myKickoutState,
      myProposalState,
      myValidatorState,
      myNextFishermenState,
      myNextValidatorsState,
    };

    const newStateString = JSON.stringify(newState, null, 2);
    fs.writeFileSync(STATE_FILE, newStateString);

    // notify if state has been changed
    if (newStateString !== prev_state) {
      const msg =
        "⚠ POOL STATE HAS BEEN CHANGED\n\n" + "```" + newStateString + "```";
      await tgBot.sendMessage(msg);
    }

    if (validator_account_id !== POOL_ID)
      throw Error(`POOL ID PROBLEMS: \n${POOL_ID} !== ${validator_account_id}`);
  } catch (error) {
    // if there is error then something wrong with node
    await tgBot.sendMessage("🚨 ERROR 🚨\n" + error.message);
  }
};

main();
