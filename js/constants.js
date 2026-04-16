export const MODE_IDS = {
  TABLEAUX: "tableauxMode",
  ARRAY: "arrayMode",
  MATRIX: "matrixMode",
};

export const ALGORITHM_IDS = {
  ROW_INSERTION: "rowInsertion",
  MATRIX_BALL: "matrixBall",
};

export const DOM_IDS = {
  STATUS: "status",
  STEPS_OUTPUT: "stepsOutput",
  STEP_COUNTER: "stepCounter",

  P_INPUT: "pInput",
  Q_INPUT: "qInput",
  TOP_ROW_INPUT: "topRowInput",
  BOTTOM_ROW_INPUT: "bottomRowInput",
  MATRIX_INPUT: "matrixInput",

  P_OUTPUT: "pOutput",
  Q_OUTPUT: "qOutput",
  ARRAY_OUTPUT: "arrayOutput",
  MATRIX_OUTPUT: "matrixOutput",

  CONVERT_BTN: "convertBtn",
  SAMPLE_BTN: "sampleBtn",
  CLEAR_STEPS_BTN: "clearStepsBtn",
  PREV_STEP_BTN: "prevStepBtn",
  NEXT_STEP_BTN: "nextStepBtn",
  RESET_STEP_BTN: "resetStepBtn",
  ALGORITHM_SELECT: "algorithmSelect",
};

export const UI_TEXT = {
  NO_STEPS: "No steps loaded.",
  NOT_IMPLEMENTED_MATRIX_BALL:
    "Matrix-ball construction is not implemented yet. Switch to row insertion for now.",
  EMPTY_OUTPUT: "(no output yet)",
};

export const TABLEAU_UI = {
  CELL_SIZE_PX: 42,
};

export const STEP_KIND = {
  INFO: "info",
  FORWARD_INSERT: "forwardInsert",
  REVERSE_INSERT: "reverseInsert",
  MATRIX_ENTRY: "matrixEntry",
};