export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function showStatus(message, kind = "good") {
  const box = document.getElementById("status");
  if (!message) {
    box.innerHTML = "";
    return;
  }

  box.innerHTML = `<div class="status ${kind}">${escapeHtml(message)}</div>`;
}

export function clearSteps() {
  document.getElementById("stepsOutput").innerHTML = "";
}

export function addStep(title, content, extras = {}) {
  const steps = document.getElementById("stepsOutput");
  const box = document.createElement("div");
  box.className = "step";

  let inner = `<div class="step-title">${escapeHtml(title)}</div>`;
  if (extras.small) {
    inner += `<div class="small">${escapeHtml(extras.small)}</div>`;
  }
  inner += `<div class="mono">${escapeHtml(content)}</div>`;

  box.innerHTML = inner;
  steps.appendChild(box);
}

export function renderTableau(containerId, T) {
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
  grid.style.gridTemplateColumns = `repeat(${cols}, 42px)`;

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = document.createElement("div");
      if (c < T[r].length) {
        cell.className = "tableau-cell";
        cell.textContent = T[r][c];
      } else {
        cell.className = "empty-cell";
      }
      grid.appendChild(cell);
    }
  }

  container.appendChild(grid);
}

export function renderOutputs({ P, Q, top, bottom, matrix, formatArray, formatMatrix }) {
  renderTableau("pOutput", P);
  renderTableau("qOutput", Q);
  document.getElementById("arrayOutput").textContent = formatArray(top, bottom);
  document.getElementById("matrixOutput").textContent = formatMatrix(matrix);
}