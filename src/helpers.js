import AsciiTable from "ascii-table";

/** yoctoNear -> NEAR tokens*/
export const countNearTokens = (yoctoNear) =>
  Math.round(yoctoNear / 10e23) || "??";

/** make Ascii table about validator state statistics */
export const getChunksBlocksStat = (tableName = "", validatorState = {}) => {
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

export const prepareSwitchingEpochInfo = (epoch, oldState, newState) => {
  const epochTable = new AsciiTable(`Epoch ${epoch}`);
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
    "**🆕 NEW EPOCH**",
    epochTableStr,
    prevProdTableStr,
    kickedOutMsg,
  ].join("\n");

  return fullMessage;
};
