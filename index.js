import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { TelegramBot } from "./src/TelegramBot.js";
import { NodeFetcher } from "./src/NodeFetcher.js";
import {
  getChunksBlocksStat,
  prepareSwitchingEpochInfo,
  getPoolId,
} from "./src/helpers.js";

dotenv.config({ path: "./config.env" });
const __dirname = path.resolve();

const STATE_FILE = __dirname + "/.prev_state.json";

const TRIGGER_UPTIME_NOTIFICATION_RATIO = 0.8;

let prev_state;
try {
  prev_state = fs.readFileSync(STATE_FILE, { encoding: "utf8", fd: null });
} catch (error) {
  // do nothing, script create the file in end of script
}

const { TG_API_KEY, TG_CHAT_ID, NODE_RPC, POOL_ID } = process.env;

const tgBot = new TelegramBot(TG_API_KEY, TG_CHAT_ID);
const nodeFetcher = new NodeFetcher(NODE_RPC, POOL_ID);

/**callback to find my pool id in different arrays*/
const findMyPoolId = (pool) => pool.account_id === POOL_ID;

const main = async () => {
  try {
    const node = await nodeFetcher.ping();
    const { validator_account_id } = await node.json();

    const status = await nodeFetcher.checkValidators();
    const { result } = await status.json();

    const myKickoutState = result.prev_epoch_kickout.find(findMyPoolId);
    const myValidatorState = result.current_validators.find(findMyPoolId);
    const myNextValidatorsState = result.next_validators.find(findMyPoolId);
    const epochStartHeight = result.epoch_start_height;
    const epochHeight = result.epoch_height;

    const newState = {
      myKickoutState,
      myValidatorState,
      myNextValidatorsState,
      epochStartHeight,
    };

    const newStateString = JSON.stringify(newState, null, 2);

    //if states are equals then do nothing
    if (newStateString === prev_state) return;

    let oldState;
    if (prev_state) oldState = JSON.parse(prev_state);

    // rewrite new state
    fs.writeFileSync(STATE_FILE, newStateString);

    // Notify if epoch has changed
    if (newState.epochStartHeight !== oldState?.epochStartHeight) {
      const msg = prepareSwitchingEpochInfo(
        epochHeight,
        oldState,
        newState,
        POOL_ID
      );
      await tgBot.sendMessage(msg);
    }

    if (newState.myValidatorState) {
      // if percentage of expected/produced chunks was lower less than 80%
      const {
        num_expected_chunks: expectedChunks,
        num_produced_chunks: producedChunks,
        num_expected_blocks: expectedBlocks,
        num_produced_blocks: producedBlocks,
      } = newState.myValidatorState;

      const chunksRatio = producedChunks / expectedChunks;
      const blocksRatio = producedBlocks / expectedBlocks;

      const trigger =
        chunksRatio < TRIGGER_UPTIME_NOTIFICATION_RATIO ||
        blocksRatio < TRIGGER_UPTIME_NOTIFICATION_RATIO;

      /* trigger is ratio prodused/expected <80%
       * expectedChunks >= 4 is condition to avoid messages if the first or second expected chanks was failed
       */
      if (trigger && expectedChunks >= 4) {
        const msgRows = [
          "⚠ SOMETHIG WRONG!",
          getPoolId(POOL_ID),
          "Your node has produced lower than expected",
          getChunksBlocksStat("Productivity", newState.myValidatorState),
        ];
        await tgBot.sendMessage(msgRows.join("\n"));
      }
    }

    if (validator_account_id !== POOL_ID)
      throw Error(`POOL ID PROBLEMS: \n${POOL_ID} !== ${validator_account_id}`);
  } catch (error) {
    // if there is error then something wrong with node
    console.log(error);
    const msg = [getPoolId(POOL_ID), error.message];
    await tgBot.sendMessage("🚨 ERROR 🚨\n" + msg.join("\n"));
  }
};

main();
