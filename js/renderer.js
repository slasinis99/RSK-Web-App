import {
  DOM_IDS,
  TABLEAU_UI,
  UI_TEXT,
  MATRIX_BALL_UI,
  STEP_KIND,
} from "./constants.js";

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

function clearStepVisualization() {
  document.getElementById(DOM_IDS.STEP_VISUALIZATION).innerHTML = "";
}

export function clearSteps() {
  document.getElementById(DOM_IDS.STEPS_OUTPUT).innerHTML = "";
  document.getElementById(DOM_IDS.STEP_COUNTER).textContent = UI_TEXT.NO_STEPS;
  clearStepVisualization();
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value));
  }
  return el;
}

function renderMatrixBallDiagram({ matrix, labeledBalls, nextMatrix = null, caption = "" }) {
  const host = document.getElementById(DOM_IDS.STEP_VISUALIZATION);
  host.innerHTML = "";

  if (!matrix || matrix.length === 0 || matrix[0].length === 0) {
    return;
  }

  const rows = matrix.length;
  const cols = matrix[0].length;
  const {
    CELL_WIDTH,
    CELL_HEIGHT,
    BALL_RADIUS,
    DIAGONAL_STEP,
    PADDING,
    LABEL_FONT_SIZE,
    INDEX_FONT_SIZE,
  } = MATRIX_BALL_UI;

  const width = PADDING * 2 + cols * CELL_WIDTH;
  const height = PADDING * 2 + rows * CELL_HEIGHT;

  const svg = svgEl("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "matrix-ball-svg",
    role: "img",
    "aria-label": "Matrix-ball construction diagram",
  });

  svg.appendChild(svgEl("rect", { x: 0, y: 0, width, height, fill: "#ffffff" }));

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = PADDING + c * CELL_WIDTH;
      const y = PADDING + r * CELL_HEIGHT;
      svg.appendChild(
        svgEl("rect", {
          x,
          y,
          width: CELL_WIDTH,
          height: CELL_HEIGHT,
          fill: "#fdfdff",
          stroke: "#cfd5e6",
          "stroke-width": 1.5,
          rx: 6,
        })
      );
    }
  }

  for (let c = 0; c < cols; c += 1) {
    const tx = PADDING + c * CELL_WIDTH + CELL_WIDTH / 2;
    const ty = PADDING - 8;
    const text = svgEl("text", {
      x: tx,
      y: ty,
      "text-anchor": "middle",
      "font-size": INDEX_FONT_SIZE,
      fill: "#5c6478",
      "font-family": "system-ui, sans-serif",
    });
    text.textContent = String(c + 1);
    svg.appendChild(text);
  }

  for (let r = 0; r < rows; r += 1) {
    const tx = PADDING - 10;
    const ty = PADDING + r * CELL_HEIGHT + CELL_HEIGHT / 2 + 4;
    const text = svgEl("text", {
      x: tx,
      y: ty,
      "text-anchor": "end",
      "font-size": INDEX_FONT_SIZE,
      fill: "#5c6478",
      "font-family": "system-ui, sans-serif",
    });
    text.textContent = String(r + 1);
    svg.appendChild(text);
  }

  const byCell = new Map();
  for (const ball of labeledBalls ?? []) {
    const key = `${ball.row},${ball.col}`;
    if (!byCell.has(key)) byCell.set(key, []);
    byCell.get(key).push(ball);
  }

  for (const balls of byCell.values()) {
    balls.sort((a, b) => a.offsetInCell - b.offsetInCell);
  }

  for (const [key, balls] of byCell.entries()) {
    const [row, col] = key.split(",").map(Number);
    const cellX = PADDING + col * CELL_WIDTH;
    const cellY = PADDING + row * CELL_HEIGHT;

    for (let i = 0; i < balls.length; i += 1) {
      const cx = cellX + 18 + i * DIAGONAL_STEP;
      const cy = cellY + 18 + i * DIAGONAL_STEP;

      svg.appendChild(
        svgEl("circle", {
          cx,
          cy,
          r: BALL_RADIUS,
          fill: "#fff7cc",
          stroke: "#d4aa1f",
          "stroke-width": 1.5,
        })
      );

      const label = svgEl("text", {
        x: cx,
        y: cy + 3.5,
        "text-anchor": "middle",
        "font-size": LABEL_FONT_SIZE,
        fill: "#202534",
        "font-family": "system-ui, sans-serif",
        "font-weight": "700",
      });
      label.textContent = String(balls[i].label);
      svg.appendChild(label);
    }
  }

  host.appendChild(svg);

  if (nextMatrix || caption) {
    const captionDiv = document.createElement("div");
    captionDiv.className = "matrix-ball-caption";
    if (caption) {
      captionDiv.textContent = caption;
    } else {
      captionDiv.textContent = `Next matrix: ${nextMatrix.map((row) => `[${row.join(", ")}]`).join(" ")}`;
    }
    host.appendChild(captionDiv);
  }
}

export function renderStep(step, currentIndex, totalSteps) {
  const steps = document.getElementById(DOM_IDS.STEPS_OUTPUT);
  const counter = document.getElementById(DOM_IDS.STEP_COUNTER);

  steps.innerHTML = "";
  clearStepVisualization();

  if (!step) {
    counter.textContent = UI_TEXT.NO_STEPS;
    return;
  }

  counter.textContent = `Step ${currentIndex + 1} of ${totalSteps}`;

  if (step.kind === STEP_KIND.MATRIX_BALL_ROUND && step.state?.matrix && step.state?.labeledBalls) {
    renderMatrixBallDiagram({
      matrix: step.state.matrix,
      labeledBalls: step.state.labeledBalls,
      nextMatrix: step.state.nextMatrix,
      caption: step.state.nextMatrix
        ? `Next matrix: ${step.state.nextMatrix.map((row) => `[${row.join(", ")}]`).join(" ")}`
        : "",
    });
  }

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
  document.getElementById(DOM_IDS.ARRAY_OUTPUT).textContent = top.length > 0
    ? formatArray(top, bottom)
    : UI_TEXT.EMPTY_OUTPUT;
  document.getElementById(DOM_IDS.MATRIX_OUTPUT).textContent = matrix.length > 0
    ? formatMatrix(matrix)
    : UI_TEXT.EMPTY_OUTPUT;
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
