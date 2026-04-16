import { EXAMPLES } from "./examples.js";
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
  addStep,
  renderTableau,
  renderOutputs,
} from "./renderer.js";

function setMode(modeId) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === modeId);
  });

  document.querySelectorAll(".mode").forEach((mode) => {
    mode.classList.toggle("active", mode.id === modeId);
  });

  clearSteps();
  showStatus("");
}

function loadSample() {
  const activeMode = document.querySelector(".mode.active").id;

  if (activeMode === "tableauxMode") {
    document.getElementById("pInput").value = EXAMPLES.tableaux.P;
    document.getElementById("qInput").value = EXAMPLES.tableaux.Q;
  } else if (activeMode === "arrayMode") {
    document.getElementById("topRowInput").value = EXAMPLES.array.top;
    document.getElementById("bottomRowInput").value = EXAMPLES.array.bottom;
  } else {
    document.getElementById("matrixInput").value = EXAMPLES.matrix.value;
  }

  showStatus("Loaded sample input.");
}

function convertFromTableaux() {
  const P = parseTableau(document.getElementById("pInput").value);
  const Q = parseTableau(document.getElementById("qInput").value);

  validateSemistandard(P, "P");
  validateSemistandard(Q, "Q");

  if (!sameShape(P, Q)) {
    throw new Error("P and Q must have the same shape.");
  }

  const inverse = inverseRsk(P, Q);
  const lex = sortBiwordLex(inverse.top, inverse.bottom);
  const matrix = matrixFromBiword(lex.top, lex.bottom);

  addStep(
    "Start with tableaux",
    `Shape(P) = Shape(Q) = [${shapeOf(P).join(", ")}].\nProceed by reverse row insertion.`
  );

  inverse.steps.forEach((step) => addStep(step.title, step.content));

  addStep("Lexicographic order", formatArray(lex.top, lex.bottom), {
    small: validateLexOrder(inverse.top, inverse.bottom)
      ? "Recovered array was already in lexicographic order."
      : "Recovered array was sorted into lexicographic order.",
  });

  addStep("Build matrix", formatMatrix(matrix), {
    small: "Matrix entry (i, j) counts the number of pairs (i, j).",
  });

  renderOutputs({
    P,
    Q,
    top: lex.top,
    bottom: lex.bottom,
    matrix,
    formatArray,
    formatMatrix,
  });

  showStatus("Converted from tableaux to two-rowed array and matrix.");
}

function convertFromArray() {
  const top = parseLineOfInts(document.getElementById("topRowInput").value);
  const bottom = parseLineOfInts(document.getElementById("bottomRowInput").value);

  if (top.length !== bottom.length) {
    throw new Error("Top and bottom rows must have the same length.");
  }
  if (top.length === 0) {
    throw new Error("The two-rowed array cannot be empty.");
  }
  if (top.some((x) => x <= 0) || bottom.some((x) => x <= 0)) {
    throw new Error("This app expects positive integer entries in the array.");
  }

  addStep("Start with two-rowed array", formatArray(top, bottom));

  const lex = sortBiwordLex(top, bottom);

  if (!validateLexOrder(top, bottom)) {
    addStep("Sort into lexicographic order", formatArray(lex.top, lex.bottom));
  } else {
    addStep("Lexicographic order", formatArray(lex.top, lex.bottom), {
      small: "The input was already lexicographically ordered.",
    });
  }

  const forward = rskFromBiword(lex.top, lex.bottom);
  forward.steps.forEach((step) => addStep(step.title, step.content));

  const matrix = matrixFromBiword(lex.top, lex.bottom);
  addStep("Build matrix", formatMatrix(matrix));

  renderOutputs({
    P: forward.P,
    Q: forward.Q,
    top: lex.top,
    bottom: lex.bottom,
    matrix,
    formatArray,
    formatMatrix,
  });

  showStatus("Converted from two-rowed array to tableaux and matrix.");
}

function convertFromMatrix() {
  const matrix = parseMatrix(document.getElementById("matrixInput").value);

  addStep("Start with matrix", formatMatrix(matrix));

  const biword = biwordFromMatrix(matrix);
  biword.steps.forEach((step) => addStep(step.title, step.content));

  addStep("Associated two-rowed array", formatArray(biword.top, biword.bottom), {
    small: "Reading matrix entries row by row yields the lexicographically ordered biword.",
  });

  const forward = rskFromBiword(biword.top, biword.bottom);
  forward.steps.forEach((step) => addStep(step.title, step.content));

  renderOutputs({
    P: forward.P,
    Q: forward.Q,
    top: biword.top,
    bottom: biword.bottom,
    matrix,
    formatArray,
    formatMatrix,
  });

  showStatus("Converted from matrix to two-rowed array and tableaux.");
}

function runConversion() {
  clearSteps();
  showStatus("");

  try {
    const activeMode = document.querySelector(".mode.active").id;

    if (activeMode === "tableauxMode") {
      convertFromTableaux();
    } else if (activeMode === "arrayMode") {
      convertFromArray();
    } else if (activeMode === "matrixMode") {
      convertFromMatrix();
    }
  } catch (error) {
    console.error(error);
    showStatus(error.message || String(error), "bad");
  }
}

function initialize() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });

  document.getElementById("convertBtn").addEventListener("click", runConversion);
  document.getElementById("sampleBtn").addEventListener("click", loadSample);
  document.getElementById("clearStepsBtn").addEventListener("click", () => {
    clearSteps();
    showStatus("");
  });

  document.getElementById("pInput").value = EXAMPLES.tableaux.P;
  document.getElementById("qInput").value = EXAMPLES.tableaux.Q;
  document.getElementById("topRowInput").value = EXAMPLES.array.top;
  document.getElementById("bottomRowInput").value = EXAMPLES.array.bottom;
  document.getElementById("matrixInput").value = EXAMPLES.matrix.value;

  renderTableau("pOutput", []);
  renderTableau("qOutput", []);
  document.getElementById("arrayOutput").textContent = "(no output yet)";
  document.getElementById("matrixOutput").textContent = "(no output yet)";
}

initialize();