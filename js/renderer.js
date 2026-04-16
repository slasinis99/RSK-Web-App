import { DOM_IDS, TABLEAU_UI, UI_TEXT } from "./constants.js";

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function showStatus(message, kind = "good") {
  const box = document.getElementById(DOM_IDS.STATUS);
  if (!message) {
    box.innerHTML = "";
    return;
  }

  box.innerHTML = `<div class="status ${kind}">${escapeHtml(message)}</div>`;
}

export function clearSteps() {
  document.getElementById(DOM_IDS.STEPS_OUTPUT).innerHTML = "";
  document.getElementById(DOM_IDS.STEP_COUNTER).textContent = UI_TEXT.NO_STEPS;
}

export function renderStep(step, currentIndex, totalSteps) {
  const steps = document.getElementById(DOM_IDS.STEPS_OUTPUT);
  const counter = document.getElementById(DOM_IDS.STEP_COUNTER);

  steps.innerHTML = "";

  if (!step) {
    counter.textContent = UI_TEXT.NO_STEPS;
    return;
  }

  counter.textContent = `Step ${currentIndex + 1} of ${totalSteps}`;

  const box = document.createElement("div");
  box.className = "step";

  box.innerHTML = `
    <div class="step-title">${escapeHtml(step.title)}</div>
    <div class="mono">${escapeHtml(step.content)}</div>
  `;

  steps.appendChild(box);
}

function isHighlightedCell(r, c, highlights) {
  return highlights.some(([rr, cc]) => rr === r && cc === c);
}

export function renderTableau(containerId, T, highlights = []) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (!T || T.length === 0) {
    container.innerHTML = `<div class="small">(empty)</div>`;
    return;
  }

  const rows = T.length;
  const cols = Math.max(...T.map((row) => row.length));
  const grid = document.createElement("div");
  grid.className = "tableau-grid";
  grid.style.gridTemplateColumns = `repeat(${cols}, ${TABLEAU_UI.CELL_SIZE_PX}px)`;

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = document.createElement("div");

      if (c < T[r].length) {
        cell.className = "tableau-cell";
        if (isHighlightedCell(r, c, highlights)) {
          cell.classList.add("highlight");
        }
        cell.textContent = T[r][c];
      } else {
        cell.className = "empty-cell";
      }

      grid.appendChild(cell);
    }
  }

  container.appendChild(grid);
}

export function renderOutputs({
  P,
  Q,
  top,
  bottom,
  matrix,
  formatArray,
  formatMatrix,
  highlightP = [],
  highlightQ = [],
}) {
  renderTableau(DOM_IDS.P_OUTPUT, P, highlightP);
  renderTableau(DOM_IDS.Q_OUTPUT, Q, highlightQ);
  document.getElementById(DOM_IDS.ARRAY_OUTPUT).textContent = formatArray(top, bottom);
  document.getElementById(DOM_IDS.MATRIX_OUTPUT).textContent = formatMatrix(matrix);
}

export function setNavigatorButtonState({ hasSteps, atStart, atEnd }) {
  document.getElementById(DOM_IDS.PREV_STEP_BTN).disabled = !hasSteps || atStart;
  document.getElementById(DOM_IDS.NEXT_STEP_BTN).disabled = !hasSteps || atEnd;
  document.getElementById(DOM_IDS.RESET_STEP_BTN).disabled = !hasSteps;
}

export function resetOutputPlaceholders() {
  renderTableau(DOM_IDS.P_OUTPUT, []);
  renderTableau(DOM_IDS.Q_OUTPUT, []);
  document.getElementById(DOM_IDS.ARRAY_OUTPUT).textContent = UI_TEXT.EMPTY_OUTPUT;
  document.getElementById(DOM_IDS.MATRIX_OUTPUT).textContent = UI_TEXT.EMPTY_OUTPUT;
}