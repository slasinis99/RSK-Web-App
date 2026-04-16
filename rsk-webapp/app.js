function showStatus(message, kind = "good") {
  const box = document.getElementById("status");
  if (!message) {
    box.innerHTML = "";
    return;
  }
  box.innerHTML = `<div class="status ${kind}">${escapeHtml(message)}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function deepCopyTableau(T) {
  return T.map((row) => [...row]);
}

function sameShape(A, B) {
  if (A.length !== B.length) return false;
  for (let i = 0; i < A.length; i += 1) {
    if (A[i].length !== B[i].length) return false;
  }
  return true;
}

function shapeOf(T) {
  return T.map((row) => row.length);
}

function formatArray(top, bottom) {
  return `[${top.join(", ")}]\n[${bottom.join(", ")}]`;
}

function formatMatrix(matrix) {
  return matrix.map((row) => row.join(" ")).join("\n");
}

function addStep(title, content, extras = {}) {
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

function clearSteps() {
  document.getElementById("stepsOutput").innerHTML = "";
}

function parseLineOfInts(text) {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [];
  return parts.map((part) => {
    const value = Number(part);
    if (!Number.isInteger(value)) {
      throw new Error(`Expected an integer, but found '${part}'.`);
    }
    return value;
  });
}

function parseTableau(text) {
  const lines = text.trim().split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    throw new Error("A tableau cannot be empty.");
  }
  return lines.map(parseLineOfInts);
}

function parseMatrix(text) {
  const rows = parseTableau(text);
  const width = rows[0].length;
  if (width === 0) throw new Error("Matrix rows cannot be empty.");
  for (const row of rows) {
    if (row.length !== width) {
      throw new Error("All matrix rows must have the same length.");
    }
    for (const x of row) {
      if (x < 0) {
        throw new Error("Matrix entries must be nonnegative.");
      }
    }
  }
  return rows;
}

function validateSemistandard(T, name) {
  for (const row of T) {
    for (let j = 1; j < row.length; j += 1) {
      if (row[j] < row[j - 1]) {
        throw new Error(`${name} is not weakly increasing across rows.`);
      }
    }
  }

  const maxCols = Math.max(...T.map((row) => row.length));
  for (let c = 0; c < maxCols; c += 1) {
    const col = [];
    for (let r = 0; r < T.length; r += 1) {
      if (c < T[r].length) col.push(T[r][c]);
    }
    for (let i = 1; i < col.length; i += 1) {
      if (col[i] <= col[i - 1]) {
        throw new Error(`${name} is not strictly increasing down columns.`);
      }
    }
  }
}

function validateLexOrder(top, bottom) {
  for (let i = 1; i < top.length; i += 1) {
    if (top[i] < top[i - 1]) return false;
    if (top[i] === top[i - 1] && bottom[i] < bottom[i - 1]) return false;
  }
  return true;
}

function sortBiwordLex(top, bottom) {
  const pairs = top.map((a, i) => [a, bottom[i]]);
  pairs.sort((u, v) => {
    if (u[0] !== v[0]) return u[0] - v[0];
    return u[1] - v[1];
  });
  return {
    top: pairs.map((pair) => pair[0]),
    bottom: pairs.map((pair) => pair[1]),
  };
}

function rowInsert(tableau, value) {
  const T = deepCopyTableau(tableau);
  let x = value;
  let r = 0;

  while (true) {
    if (r === T.length) {
      T.push([x]);
      return {
        tableau: T,
        position: [r, 0],
        bumpedPath: [`Created new row ${r + 1} and placed ${x}.`],
      };
    }

    const row = T[r];
    const bumpIndex = row.findIndex((entry) => entry > x);

    if (bumpIndex === -1) {
      row.push(x);
      return {
        tableau: T,
        position: [r, row.length - 1],
        bumpedPath: [`Appended ${x} to row ${r + 1}.`],
      };
    }

    const bumped = row[bumpIndex];
    row[bumpIndex] = x;
    const note = `In row ${r + 1}, ${x} bumped ${bumped} from column ${bumpIndex + 1}.`;
    x = bumped;
    r += 1;

    if (!T._notes) T._notes = [];
    T._notes.push(note);
  }
}

function rowInsertWithNotes(tableau, value) {
  const result = rowInsert(tableau, value);
  const notes = result.tableau._notes
    ? [...result.tableau._notes, ...result.bumpedPath]
    : [...result.bumpedPath];
  delete result.tableau._notes;
  return { ...result, notes };
}

function reverseRowInsert(tableau, rowIndex, colIndex) {
  const T = deepCopyTableau(tableau);
  const notes = [];

  if (rowIndex < 0 || rowIndex >= T.length || colIndex < 0 || colIndex >= T[rowIndex].length) {
    throw new Error("Invalid removal position for reverse row insertion.");
  }

  let x = T[rowIndex][colIndex];
  T[rowIndex].splice(colIndex, 1);
  notes.push(`Removed ${x} from row ${rowIndex + 1}, column ${colIndex + 1}.`);

  if (T[rowIndex].length === 0) {
    T.splice(rowIndex, 1);
    notes.push(`Deleted empty row ${rowIndex + 1}.`);
  }

  for (let r = rowIndex - 1; r >= 0; r -= 1) {
    const row = T[r];
    let j = -1;
    for (let i = row.length - 1; i >= 0; i -= 1) {
      if (row[i] < x) {
        j = i;
        break;
      }
    }
    if (j === -1) {
      throw new Error("Reverse row insertion failed: no valid bump position found.");
    }

    const bumped = row[j];
    row[j] = x;
    notes.push(`In row ${r + 1}, replaced ${bumped} with ${x} at column ${j + 1}.`);
    x = bumped;
  }

  return { tableau: T, value: x, notes };
}

function tableauToText(T) {
  if (T.length === 0) return "(empty)";
  return T.map((row) => row.join(" ")).join("\n");
}

function rskFromBiword(top, bottom) {
  let P = [];
  let Q = [];
  const steps = [];

  for (let i = 0; i < top.length; i += 1) {
    const a = top[i];
    const b = bottom[i];
    const insertResult = rowInsertWithNotes(P, b);
    P = insertResult.tableau;

    const [r, c] = insertResult.position;
    while (Q.length <= r) Q.push([]);
    Q[r].splice(c, 0, a);

    steps.push({
      title: `Insert pair (${a}, ${b})`,
      content: [
        ...insertResult.notes,
        `Placed recording entry ${a} into Q at row ${r + 1}, column ${c + 1}.`,
        `Current P:\n${tableauToText(P)}`,
        `Current Q:\n${tableauToText(Q)}`,
      ].join("\n"),
    });
  }

  return { P, Q, steps };
}

function inverseRsk(Pin, Qin) {
  let P = deepCopyTableau(Pin);
  let Q = deepCopyTableau(Qin);
  const top = [];
  const bottom = [];
  const steps = [];

  while (P.length > 0) {
    let bestValue = -Infinity;
    let bestPos = null;

    for (let r = 0; r < Q.length; r += 1) {
      for (let c = 0; c < Q[r].length; c += 1) {
        if (Q[r][c] > bestValue) {
          bestValue = Q[r][c];
          bestPos = [r, c];
        }
      }
    }

    if (!bestPos) break;

    const [r, c] = bestPos;
    const a = Q[r][c];

    Q[r].splice(c, 1);
    if (Q[r].length === 0) Q.splice(r, 1);

    const reverse = reverseRowInsert(P, r, c);
    P = reverse.tableau;
    const b = reverse.value;

    top.push(a);
    bottom.push(b);

    steps.push({
      title: `Reverse step using Q entry ${a}`,
      content: [
        `Selected an occurrence of the current maximum recording value at row ${r + 1}, column ${c + 1}.`,
        ...reverse.notes,
        `Recovered pair (${a}, ${b}).`,
        `Remaining P:\n${tableauToText(P)}`,
        `Remaining Q:\n${tableauToText(Q)}`,
      ].join("\n"),
    });
  }

  top.reverse();
  bottom.reverse();
  return { top, bottom, steps };
}

function biwordFromMatrix(matrix) {
  const top = [];
  const bottom = [];
  const steps = [];

  for (let i = 0; i < matrix.length; i += 1) {
    for (let j = 0; j < matrix[i].length; j += 1) {
      const count = matrix[i][j];
      if (count > 0) {
        steps.push({
          title: `Matrix entry (${i + 1}, ${j + 1}) = ${count}`,
          content: `Add ${count} copies of the pair (${i + 1}, ${j + 1}).`,
        });
      }
      for (let k = 0; k < count; k += 1) {
        top.push(i + 1);
        bottom.push(j + 1);
      }
    }
  }

  return { top, bottom, steps };
}

function matrixFromBiword(top, bottom) {
  const numRows = Math.max(...top, 0);
  const numCols = Math.max(...bottom, 0);
  const matrix = Array.from({ length: numRows }, () => Array(numCols).fill(0));

  for (let i = 0; i < top.length; i += 1) {
    matrix[top[i] - 1][bottom[i] - 1] += 1;
  }
  return matrix;
}

function renderTableau(containerId, T) {
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

function renderOutputs(P, Q, top, bottom, matrix) {
  renderTableau("pOutput", P);
  renderTableau("qOutput", Q);
  document.getElementById("arrayOutput").textContent = formatArray(top, bottom);
  document.getElementById("matrixOutput").textContent = formatMatrix(matrix);
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

  renderOutputs(P, Q, lex.top, lex.bottom, matrix);
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
    throw new Error("This starter app expects positive integer entries in the array.");
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

  renderOutputs(forward.P, forward.Q, lex.top, lex.bottom, matrix);
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

  renderOutputs(forward.P, forward.Q, biword.top, biword.bottom, matrix);
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
    document.getElementById("pInput").value = `1 1 2
2 3
4`;
    document.getElementById("qInput").value = `1 1 3
2 4
4`;
  } else if (activeMode === "arrayMode") {
    document.getElementById("topRowInput").value = `1 2 1 4 2 4`;
    document.getElementById("bottomRowInput").value = `2 3 1 4 1 2`;
  } else {
    document.getElementById("matrixInput").value = `2 0 1
1 2 0
0 1 1`;
  }
  showStatus("Loaded sample input.");
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

document.getElementById("convertBtn").addEventListener("click", runConversion);
document.getElementById("sampleBtn").addEventListener("click", loadSample);
document.getElementById("clearStepsBtn").addEventListener("click", () => {
  clearSteps();
  showStatus("");
});

renderTableau("pOutput", []);
renderTableau("qOutput", []);
document.getElementById("arrayOutput").textContent = "(no output yet)";
document.getElementById("matrixOutput").textContent = "(no output yet)";