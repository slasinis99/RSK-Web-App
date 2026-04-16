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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getResponsiveTableauSizing(T) {
  const rows = T.length;
  const cols = Math.max(...T.map((row) => row.length));
  const longestEntryLength = Math.max(...T.flat().map((x) => String(x).length), 1);

  const widthLimited = Math.floor(260 / Math.max(cols, 1));
  const heightLimited = Math.floor(220 / Math.max(rows, 1));
  const digitLimited = Math.max(
    TABLEAU_UI.MIN_CELL_SIZE_PX,
    TABLEAU_UI.CELL_SIZE_PX - Math.max(0, longestEntryLength - 2) * 4
  );

  const cellSize = clamp(
    Math.min(TABLEAU_UI.CELL_SIZE_PX, widthLimited, heightLimited, digitLimited),
    TABLEAU_UI.MIN_CELL_SIZE_PX,
    TABLEAU_UI.CELL_SIZE_PX
  );

  const fontSize = Math.max(10, Math.floor(cellSize * TABLEAU_UI.FONT_SCALE));

  return { cellSize, fontSize, cols };
}

function renderMatrixBallDiagram({ matrix, labeledBalls, nextMatrix = null, caption = "" }) {
  const host = document.getElementById(DOM_IDS.STEP_VISUALIZATION);
  host.innerHTML = "";

  if (!matrix || matrix.length === 0 || matrix[0].length === 0) {
    return;
  }

  const rows = matrix.length;
  const cols = matrix[0].length;

  const maxBallsInAnyCell = (() => {
    const counts = new Map();
    for (const ball of labeledBalls ?? []) {
      const key = `${ball.row},${ball.col}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Math.max(1, ...counts.values());
  })();

  const widthScale = MATRIX_BALL_UI.MAX_VIEWPORT_WIDTH / Math.max(cols, 1);
  const heightScale = MATRIX_BALL_UI.MAX_VIEWPORT_HEIGHT / Math.max(rows, 1);

  const cellWidth = clamp(
    Math.min(MATRIX_BALL_UI.CELL_WIDTH, widthScale),
    MATRIX_BALL_UI.MIN_CELL_WIDTH,
    MATRIX_BALL_UI.CELL_WIDTH
  );

  const cellHeight = clamp(
    Math.min(MATRIX_BALL_UI.CELL_HEIGHT, heightScale),
    MATRIX_BALL_UI.MIN_CELL_HEIGHT,
    MATRIX_BALL_UI.CELL_HEIGHT
  );

  const diagonalStep = Math.max(
    8,
    Math.min(
      Math.floor(Math.min(cellWidth, cellHeight) / Math.max(maxBallsInAnyCell + 1, 3)),
      Math.floor(MATRIX_BALL_UI.DIAGONAL_STEP)
    )
  );

  const ballRadius = clamp(
    Math.floor(diagonalStep * 0.42),
    MATRIX_BALL_UI.MIN_BALL_RADIUS,
    MATRIX_BALL_UI.BALL_RADIUS
  );

  const padding = clamp(
    Math.floor(Math.min(cellWidth, cellHeight) * 0.33),
    MATRIX_BALL_UI.MIN_PADDING,
    MATRIX_BALL_UI.PADDING
  );

  const labelFontSize = Math.max(7, Math.floor(ballRadius * 0.95));
  const indexFontSize = Math.max(9, Math.floor(Math.min(cellWidth, cellHeight) * 0.18));

  const width = padding * 2 + cols * cellWidth;
  const height = padding * 2 + rows * cellHeight;

  const svg = svgEl("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "matrix-ball-svg",
    role: "img",
    "aria-label": "Matrix-ball construction diagram",
  });

  svg.appendChild(svgEl("rect", { x: 0, y: 0, width, height, fill: "#ffffff" }));

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = padding + c * cellWidth;
      const y = padding + r * cellHeight;
      svg.appendChild(
        svgEl("rect", {
          x,
          y,
          width: cellWidth,
          height: cellHeight,
          fill: "#fdfdff",
          stroke: "#cfd5e6",
          "stroke-width": 1.5,
          rx: 6,
        })
      );
    }
  }

  for (let c = 0; c < cols; c += 1) {
    const tx = padding + c * cellWidth + cellWidth / 2;
    const ty = padding - 8;
    const text = svgEl("text", {
      x: tx,
      y: ty,
      "text-anchor": "middle",
      "font-size": indexFontSize,
      fill: "#5c6478",
      "font-family": "system-ui, sans-serif",
    });
    text.textContent = String(c + 1);
    svg.appendChild(text);
  }

  for (let r = 0; r < rows; r += 1) {
    const tx = padding - 10;
    const ty = padding + r * cellHeight + cellHeight / 2 + Math.floor(indexFontSize * 0.35);
    const text = svgEl("text", {
      x: tx,
      y: ty,
      "text-anchor": "end",
      "font-size": indexFontSize,
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
    const cellX = padding + col * cellWidth;
    const cellY = padding + row * cellHeight;

    const startX = cellX + Math.max(ballRadius + 4, Math.floor(cellWidth * 0.2));
    const startY = cellY + Math.max(ballRadius + 4, Math.floor(cellHeight * 0.2));

    for (let i = 0; i < balls.length; i += 1) {
      const cx = startX + i * diagonalStep;
      const cy = startY + i * diagonalStep;

      svg.appendChild(
        svgEl("circle", {
          cx,
          cy,
          r: ballRadius,
          fill: "#fff7cc",
          stroke: "#d4aa1f",
          "stroke-width": 1.5,
        })
      );

      const label = svgEl("text", {
        x: cx,
        y: cy + Math.max(2, Math.floor(labelFontSize * 0.25)),
        "text-anchor": "middle",
        "font-size": labelFontSize,
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

  const { cellSize, fontSize, cols } = getResponsiveTableauSizing(T);

  const scrollbox = document.createElement("div");
  scrollbox.className = "tableau-scrollbox";

  const grid = document.createElement("div");
  grid.className = "tableau-grid";
  grid.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;

  for (let r = 0; r < T.length; r += 1) {
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

      cell.style.width = `${cellSize}px`;
      cell.style.height = `${cellSize}px`;
      cell.style.fontSize = `${fontSize}px`;

      grid.appendChild(cell);
    }
  }

  scrollbox.appendChild(grid);
  container.appendChild(scrollbox);
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
  document.getElementById(DOM_IDS.ARRAY_OUTPUT).textContent =
    top.length > 0 ? formatArray(top, bottom) : UI_TEXT.EMPTY_OUTPUT;
  document.getElementById(DOM_IDS.MATRIX_OUTPUT).textContent =
    matrix.length > 0 ? formatMatrix(matrix) : UI_TEXT.EMPTY_OUTPUT;
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