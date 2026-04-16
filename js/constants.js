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
  STEP_VISUALIZATION: "stepVisualization",

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
  EMPTY_OUTPUT: "(no output yet)",
};

export const TABLEAU_UI = {
  CELL_SIZE_PX: 42,
  MIN_CELL_SIZE_PX: 22,
  MAX_CONTAINER_HEIGHT_PX: 260,
  PADDING_PX: 4,
  FONT_SCALE: 0.42,
};

export const STEP_KIND = {
  INFO: "info",
  FORWARD_INSERT: "forwardInsert",
  REVERSE_INSERT: "reverseInsert",
  MATRIX_ENTRY: "matrixEntry",
  MATRIX_BALL_ROUND: "matrixBallRound",
};

export const MATRIX_BALL_UI = {
  CELL_WIDTH: 72,
  CELL_HEIGHT: 72,
  MIN_CELL_WIDTH: 40,
  MIN_CELL_HEIGHT: 40,
  BALL_RADIUS: 11,
  MIN_BALL_RADIUS: 5,
  DIAGONAL_STEP: 16,
  PADDING: 24,
  MIN_PADDING: 14,
  LABEL_FONT_SIZE: 11,
  INDEX_FONT_SIZE: 12,
  MAX_VIEWPORT_WIDTH: 900,
  MAX_VIEWPORT_HEIGHT: 460,
};