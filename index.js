#! /usr/bin/env node

import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import AsciiTable from "ascii-table";

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

const countNearTokens = (yoctoNear) => Math.round(yoctoNear / 10e23) || "??";

const getChunksBlocksStat = (tableName = "", validatorState = {}) => {
  const prevProdTable = new AsciiTable(tableName);
  prevProdTable
    .setHeading("", "Expected", "Produced")
    .addRow(
      "Blocks",
      validatorState.num_expected_blocks,
      validatorState.num_produced_blocks
    )
    .addRow(
      "Chunks",
      validatorState.num_expected_chunks,
      validatorState.num_produced_chunks
    );

  return ["```", prevProdTable.toString(), "```"].join("\n");
};

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
    const epochStartHeight = result.epoch_start_height;
    const epochHeight = result.epoch_height;

    const newState = {
      myFishermenState,
      myKickoutState,
      myProposalState,
      myValidatorState,
      myNextFishermenState,
      myNextValidatorsState,
      epochStartHeight,
    };

    const newStateString = JSON.stringify(newState, null, 2);

    //if states are equals then do nothing
    if (newStateString === prev_state) return;
    else {
      let oldState;
      if (prev_state) oldState = JSON.parse(prev_state);

      if (newState.epochStartHeight !== oldState?.epochStartHeight) {
        const epochTable = new AsciiTable(`Epoch ${epochHeight}`);
        epochTable
          .setHeading("Params", "Previous", "Current")
          .addRow(
            "current",
            !!oldState?.myValidatorState ? "validator" : "⨯",
            !!newState?.myValidatorState ? "validator" : "⨯"
          )
          .addRow(
            "next",
            !!oldState?.myNextValidatorsState ? "validator" : "⨯",
            !!newState?.myNextValidatorsState ? "validator" : "⨯"
          )
          .addRow(
            "stake",
            countNearTokens(oldState?.myNextValidatorsState.stake) + " N",
            countNearTokens(newState?.myNextValidatorsState.stake) + " N"
          );

        const epochTableStr = ["```", epochTable.toString(), "```"].join("\n");

        // Producticity table if node was a validator in prevoius epoch
        let prevProdTableStr = "";
        if (oldState?.myValidatorState) {
          prevProdTableStr = getChunksBlocksStat(
            "Last Epoch Productivity",
            oldState.myValidatorState
          );
        }

        const kickedOutMsg =
          newState.myKickoutState &&
          [
            "Kicked out 😟: \n",
            "```",
            JSON.stringify(newState.myKickoutState.reason, null, 2),
            "```",
          ].join();

        const fullMessage = [
          "**🆕 NEW EPOCH**",
          epochTableStr,
          prevProdTableStr,
          kickedOutMsg,
        ].join("\n");

        await tgBot.sendMessage(fullMessage);
      }

      fs.writeFileSync(STATE_FILE, newStateString);
    }

    // if percentage of expected/produced chunks was lower less than 80%
    const {
      num_expected_chunks: expectedChunks,
      num_produced_chunks: producedChunks,
      num_expected_blocks: expectedBlocks,
      num_produced_blocks: producedBlocks,
    } = newState.myValidatorState;

    const chunksRatio = producedChunks / expectedChunks;
    const blocksRatio = producedBlocks / expectedBlocks;
    const trigger = chunksRatio <= 0.8 || blocksRatio <= 0.8;
    if (trigger) {
      const msg =
        "⚠ SOMETHIG WRONG! \n Your node has produced lower than expected " +
        getChunksBlocksStat(
          "Last Epoch Producticit",
          newState.myValidatorState
        );
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
