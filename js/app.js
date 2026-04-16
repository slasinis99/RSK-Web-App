import { EXAMPLES } from "./examples.js";
import {
  MODE_IDS,
  ALGORITHM_IDS,
  DOM_IDS,
  UI_TEXT,
} from "./constants.js";
import {
  parseLineOfInts,
  parseTableau,
  parseMatrix,
  validateSemistandard,
  sameShape,
} from "./parser.js";
import {
  shapeOf,
  formatArray,
  formatMatrix,
  validateLexOrder,
  sortBiwordLex,
  rskFromBiword,
  inverseRsk,
  biwordFromMatrix,
  matrixFromBiword,
} from "./algorithms.js";
import {
  showStatus,
  clearSteps,
  renderStep,
  renderTableau,
  renderOutputs,
  setNavigatorButtonState,
  resetOutputPlaceholders,
} from "./renderer.js";

const appState = {
  currentSteps: [],
  currentStepIndex: -1,
  latestOutputs: null,
};

function getById(id) {
  return document.getElementById(id);
}

function getActiveMode() {
  const active = document.querySelector(".mode.active");
  return active ? active.id : MODE_IDS.TABLEAUX;
}

function getSelectedAlgorithm() {
  return getById(DOM_IDS.ALGORITHM_SELECT).value;
}

function setMode(modeId) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === modeId);
  });

  document.querySelectorAll(".mode").forEach((mode) => {
    mode.classList.toggle("active", mode.id === modeId);
  });

  clearNavigatorOnly();
  showStatus("");
}

function clearNavigatorOnly() {
  appState.currentSteps = [];
  appState.currentStepIndex = -1;
  clearSteps();
  setNavigatorButtonState({
    hasSteps: false,
    atStart: true,
    atEnd: true,
  });
}

function loadSample() {
  const activeMode = getActiveMode();

  if (activeMode === MODE_IDS.TABLEAUX) {
    getById(DOM_IDS.P_INPUT).value = EXAMPLES.tableaux.P;
    getById(DOM_IDS.Q_INPUT).value = EXAMPLES.tableaux.Q;
  } else if (activeMode === MODE_IDS.ARRAY) {
    getById(DOM_IDS.TOP_ROW_INPUT).value = EXAMPLES.array.top;
    getById(DOM_IDS.BOTTOM_ROW_INPUT).value = EXAMPLES.array.bottom;
  } else {
    getById(DOM_IDS.MATRIX_INPUT).value = EXAMPLES.matrix.value;
  }

  showStatus("Loaded sample input.");
}

function setSteps(steps) {
  appState.currentSteps = steps;
  appState.currentStepIndex = steps.length > 0 ? 0 : -1;
  syncNavigator();
}

function syncNavigator() {
  const hasSteps = appState.currentSteps.length > 0;
  const atStart = appState.currentStepIndex <= 0;
  const atEnd = appState.currentStepIndex >= appState.currentSteps.length - 1;

  setNavigatorButtonState({ hasSteps, atStart, atEnd });

  if (!hasSteps) {
    renderStep(null, -1, 0);
    if (appState.latestOutputs) {
      renderOutputs({
        ...appState.latestOutputs,
        highlightP: [],
        highlightQ: [],
      });
    }
    return;
  }

  const step = appState.currentSteps[appState.currentStepIndex];
  renderStep(step, appState.currentStepIndex, appState.currentSteps.length);

  if (appState.latestOutputs) {
    renderOutputs({
      ...appState.latestOutputs,
      highlightP: step.state?.highlightP ?? [],
      highlightQ: step.state?.highlightQ ?? [],
      P: step.state?.P ?? appState.latestOutputs.P,
      Q: step.state?.Q ?? appState.latestOutputs.Q,
    });
  }
}

function goToPreviousStep() {
  if (appState.currentStepIndex > 0) {
    appState.currentStepIndex -= 1;
    syncNavigator();
  }
}

function goToNextStep() {
  if (appState.currentStepIndex < appState.currentSteps.length - 1) {
    appState.currentStepIndex += 1;
    syncNavigator();
  }
}

function resetSteps() {
  if (appState.currentSteps.length === 0) return;
  appState.currentStepIndex = 0;
  syncNavigator();
}

function ensureRowInsertionSelected() {
  if (getSelectedAlgorithm() === ALGORITHM_IDS.MATRIX_BALL) {
    throw new Error(UI_TEXT.NOT_IMPLEMENTED_MATRIX_BALL);
  }
}

function convertFromTableaux() {
  ensureRowInsertionSelected();

  const P = parseTableau(getById(DOM_IDS.P_INPUT).value);
  const Q = parseTableau(getById(DOM_IDS.Q_INPUT).value);

  validateSemistandard(P, "P");
  validateSemistandard(Q, "Q");

  if (!sameShape(P, Q)) {
    throw new Error("P and Q must have the same shape.");
  }

  const inverse = inverseRsk(P, Q);
  const lex = sortBiwordLex(inverse.top, inverse.bottom);
  const matrix = matrixFromBiword(lex.top, lex.bottom);

  const steps = [
    {
      title: "Start with tableaux",
      content: `Shape(P) = Shape(Q) = [${shapeOf(P).join(", ")}].\nProceed by reverse row insertion.`,
      state: {
        P,
        Q,
        highlightP: [],
        highlightQ: [],
      },
    },
    ...inverse.steps,
    {
      title: "Lexicographic order",
      content: formatArray(lex.top, lex.bottom),
      state: {
        P,
        Q,
        highlightP: [],
        highlightQ: [],
      },
    },
    {
      title: "Build matrix",
      content: formatMatrix(matrix),
      state: {
        P,
        Q,
        highlightP: [],
        highlightQ: [],
      },
    },
  ];

  appState.latestOutputs = {
    P,
    Q,
    top: lex.top,
    bottom: lex.bottom,
    matrix,
    formatArray,
    formatMatrix,
  };

  renderOutputs(appState.latestOutputs);
  setSteps(steps);

  showStatus("Converted from tableaux to two-rowed array and matrix.");
}

function convertFromArray() {
  ensureRowInsertionSelected();

  const top = parseLineOfInts(getById(DOM_IDS.TOP_ROW_INPUT).value);
  const bottom = parseLineOfInts(getById(DOM_IDS.BOTTOM_ROW_INPUT).value);

  if (top.length !== bottom.length) {
    throw new Error("Top and bottom rows must have the same length.");
  }
  if (top.length === 0) {
    throw new Error("The two-rowed array cannot be empty.");
  }
  if (top.some((x) => x <= 0) || bottom.some((x) => x <= 0)) {
    throw new Error("This app expects positive integer entries in the array.");
  }

  const lex = sortBiwordLex(top, bottom);
  const forward = rskFromBiword(lex.top, lex.bottom);
  const matrix = matrixFromBiword(lex.top, lex.bottom);

  const steps = [
    {
      title: "Start with two-rowed array",
      content: formatArray(top, bottom),
      state: {
        P: [],
        Q: [],
        highlightP: [],
        highlightQ: [],
      },
    },
    !validateLexOrder(top, bottom)
      ? {
          title: "Sort into lexicographic order",
          content: formatArray(lex.top, lex.bottom),
          state: {
            P: [],
            Q: [],
            highlightP: [],
            highlightQ: [],
          },
        }
      : {
          title: "Lexicographic order",
          content: formatArray(lex.top, lex.bottom),
          state: {
            P: [],
            Q: [],
            highlightP: [],
            highlightQ: [],
          },
        },
    ...forward.steps,
    {
      title: "Build matrix",
      content: formatMatrix(matrix),
      state: {
        P: forward.P,
        Q: forward.Q,
        highlightP: [],
        highlightQ: [],
      },
    },
  ];

  appState.latestOutputs = {
    P: forward.P,
    Q: forward.Q,
    top: lex.top,
    bottom: lex.bottom,
    matrix,
    formatArray,
    formatMatrix,
  };

  renderOutputs(appState.latestOutputs);
  setSteps(steps);

  showStatus("Converted from two-rowed array to tableaux and matrix.");
}

function convertFromMatrix() {
  ensureRowInsertionSelected();

  const matrix = parseMatrix(getById(DOM_IDS.MATRIX_INPUT).value);
  const biword = biwordFromMatrix(matrix);
  const forward = rskFromBiword(biword.top, biword.bottom);

  const steps = [
    {
        title: "Start with matrix",
        content: formatMatrix(matrix),
        state: {
        P: [],
        Q: [],
        highlightP: [],
        highlightQ: [],
        },
    },
    {
        title: "Associated two-rowed array",
        content: formatArray(biword.top, biword.bottom),
        state: {
        P: [],
        Q: [],
        highlightP: [],
        highlightQ: [],
        },
    },
    ...forward.steps,
    ];

  appState.latestOutputs = {
    P: forward.P,
    Q: forward.Q,
    top: biword.top,
    bottom: biword.bottom,
    matrix,
    formatArray,
    formatMatrix,
  };

  renderOutputs(appState.latestOutputs);
  setSteps(steps);

  showStatus("Converted from matrix to two-rowed array and tableaux.");
}

function runConversion() {
  showStatus("");

  try {
    const activeMode = getActiveMode();

    if (activeMode === MODE_IDS.TABLEAUX) {
      convertFromTableaux();
    } else if (activeMode === MODE_IDS.ARRAY) {
      convertFromArray();
    } else if (activeMode === MODE_IDS.MATRIX) {
      convertFromMatrix();
    }
  } catch (error) {
    console.error(error);
    clearNavigatorOnly();
    showStatus(error.message || String(error), "bad");
  }
}

function initialize() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });

  getById(DOM_IDS.CONVERT_BTN).addEventListener("click", runConversion);
  getById(DOM_IDS.SAMPLE_BTN).addEventListener("click", loadSample);
  getById(DOM_IDS.CLEAR_STEPS_BTN).addEventListener("click", () => {
    clearNavigatorOnly();
    showStatus("");
  });

  getById(DOM_IDS.PREV_STEP_BTN).addEventListener("click", goToPreviousStep);
  getById(DOM_IDS.NEXT_STEP_BTN).addEventListener("click", goToNextStep);
  getById(DOM_IDS.RESET_STEP_BTN).addEventListener("click", resetSteps);

  getById(DOM_IDS.P_INPUT).value = EXAMPLES.tableaux.P;
  getById(DOM_IDS.Q_INPUT).value = EXAMPLES.tableaux.Q;
  getById(DOM_IDS.TOP_ROW_INPUT).value = EXAMPLES.array.top;
  getById(DOM_IDS.BOTTOM_ROW_INPUT).value = EXAMPLES.array.bottom;
  getById(DOM_IDS.MATRIX_INPUT).value = EXAMPLES.matrix.value;

  renderTableau(DOM_IDS.P_OUTPUT, []);
  renderTableau(DOM_IDS.Q_OUTPUT, []);
  resetOutputPlaceholders();

  setNavigatorButtonState({
    hasSteps: false,
    atStart: true,
    atEnd: true,
  });
}

initialize();