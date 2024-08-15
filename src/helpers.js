import AsciiTable from "ascii-table";

/** yoctoNear -> NEAR tokens*/
export const countNearTokens = (yoctoNear) =>
  Math.round(yoctoNear / 10e23) || "??";

export const countProductivity = (validatorState) => {
  const productivityInfo =
    (validatorState?.num_produced_blocks + validatorState?.num_produced_chunks + validatorState?.num_produced_endorsements) /
    (validatorState?.num_expected_blocks + validatorState?.num_expected_chunks + validatorState?.num_expected_endorsements);

  const productivity = productivityInfo
    ? Math.floor(productivityInfo * 10000) / 100
    : 0;

  return productivity;
};

/** make Ascii table about validator state statistics */
export const getChunksBlocksStat = (tableName = "", validatorState = {}) => {
  const prevProdTable = new AsciiTable(/* tableName */);
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
    )
    .addRow(
      "Endorsements",
      validatorState.num_expected_endorsements,
      validatorState.num_produced_endorsements
    );

  return [
    `\n📊 ${tableName}: ${countProductivity(validatorState)}%`,
    "```",
    prevProdTable.toString(),
    "```",
  ].join("\n");
};

export const prepareSwitchingEpochInfo = (
  epoch,
  oldState,
  newState,
  POOL_ID
) => {
  const epochTable = new AsciiTable(`Epoch №${epoch}`);
  epochTable
    .setHeading("", "Previous", "Current")
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
      countNearTokens(oldState?.myNextValidatorsState?.stake) + " N",
      countNearTokens(newState?.myNextValidatorsState?.stake) + " N"
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
      "```\n",
      JSON.stringify(newState.myKickoutState.reason, null, 2),
      "\n```",
    ].join("");

  const fullMessage = [
    `**🆕 EPOCH №${epoch}**`,
    getPoolId(POOL_ID),
    epochTableStr,
    prevProdTableStr,
    kickedOutMsg,
  ].join("\n");

  return fullMessage;
};

export const getPoolId = (poolId) => `\n👷‍♂️ ${poolId}\n`;
