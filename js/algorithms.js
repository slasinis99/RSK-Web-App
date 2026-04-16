import { STEP_KIND } from "./constants.js";

export function deepCopyTableau(T) {
  return T.map((row) => [...row]);
}

export function shapeOf(T) {
  return T.map((row) => row.length);
}

export function tableauToText(T) {
  if (T.length === 0) return "(empty)";
  return T.map((row) => row.join(" ")).join("\n");
}

export function formatArray(top, bottom) {
  return `[${top.join(", ")}]\n[${bottom.join(", ")}]`;
}

export function formatMatrix(matrix) {
  return matrix.map((row) => row.join(" ")).join("\n");
}

export function validateLexOrder(top, bottom) {
  for (let i = 1; i < top.length; i += 1) {
    if (top[i] < top[i - 1]) return false;
    if (top[i] === top[i - 1] && bottom[i] < bottom[i - 1]) return false;
  }
  return true;
}

export function sortBiwordLex(top, bottom) {
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

export function rowInsert(tableau, value) {
  const T = deepCopyTableau(tableau);
  const notes = [];
  const bumpPath = [];
  let x = value;
  let r = 0;

  while (true) {
    if (r === T.length) {
      T.push([x]);
      bumpPath.push([r, 0]);
      notes.push(`Created new row ${r + 1} and placed ${x}.`);
      return {
        tableau: T,
        position: [r, 0],
        notes,
        bumpPath,
      };
    }

    const row = T[r];
    const bumpIndex = row.findIndex((entry) => entry > x);

    if (bumpIndex === -1) {
      row.push(x);
      bumpPath.push([r, row.length - 1]);
      notes.push(`Appended ${x} to row ${r + 1}.`);
      return {
        tableau: T,
        position: [r, row.length - 1],
        notes,
        bumpPath,
      };
    }

    const bumped = row[bumpIndex];
    row[bumpIndex] = x;
    bumpPath.push([r, bumpIndex]);
    notes.push(`In row ${r + 1}, ${x} bumped ${bumped} from column ${bumpIndex + 1}.`);
    x = bumped;
    r += 1;
  }
}

export function reverseRowInsert(tableau, rowIndex, colIndex) {
  const T = deepCopyTableau(tableau);
  const notes = [];
  const bumpPath = [];

  if (rowIndex < 0 || rowIndex >= T.length || colIndex < 0 || colIndex >= T[rowIndex].length) {
    throw new Error("Invalid removal position for reverse row insertion.");
  }

  let x = T[rowIndex][colIndex];
  T[rowIndex].splice(colIndex, 1);
  bumpPath.push([rowIndex, colIndex]);
  notes.push(`Removed ${x} from row ${rowIndex + 1}, column ${colIndex + 1}.`);

  if (T[rowIndex] && T[rowIndex].length === 0) {
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
    bumpPath.push([r, j]);
    notes.push(`In row ${r + 1}, replaced ${bumped} with ${x} at column ${j + 1}.`);
    x = bumped;
  }

  return { tableau: T, value: x, notes, bumpPath };
}

export function rskFromBiword(top, bottom) {
  let P = [];
  let Q = [];
  const steps = [];

  for (let i = 0; i < top.length; i += 1) {
    const a = top[i];
    const b = bottom[i];

    const insertResult = rowInsert(P, b);
    P = insertResult.tableau;

    const [r, c] = insertResult.position;
    while (Q.length <= r) {
      Q.push([]);
    }
    Q[r].splice(c, 0, a);

    steps.push({
      kind: STEP_KIND.FORWARD_INSERT,
      title: `Insert pair (${a}, ${b})`,
      content: [
        ...insertResult.notes,
        `Placed recording entry ${a} into Q at row ${r + 1}, column ${c + 1}.`,
        `Current P:\n${tableauToText(P)}`,
        `Current Q:\n${tableauToText(Q)}`,
      ].join("\n"),
      state: {
        P: deepCopyTableau(P),
        Q: deepCopyTableau(Q),
        highlightP: insertResult.bumpPath,
        highlightQ: [[r, c]],
      },
    });
  }

  return { P, Q, steps };
}

export function inverseRsk(Pin, Qin) {
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
    if (Q[r].length === 0) {
      Q.splice(r, 1);
    }

    const reverse = reverseRowInsert(P, r, c);
    P = reverse.tableau;
    const b = reverse.value;

    top.push(a);
    bottom.push(b);

    steps.push({
      kind: STEP_KIND.REVERSE_INSERT,
      title: `Reverse step using Q entry ${a}`,
      content: [
        `Selected an occurrence of the current maximum recording value at row ${r + 1}, column ${c + 1}.`,
        ...reverse.notes,
        `Recovered pair (${a}, ${b}).`,
        `Remaining P:\n${tableauToText(P)}`,
        `Remaining Q:\n${tableauToText(Q)}`,
      ].join("\n"),
      state: {
        P: deepCopyTableau(P),
        Q: deepCopyTableau(Q),
        highlightP: reverse.bumpPath,
        highlightQ: [],
      },
    });
  }

  top.reverse();
  bottom.reverse();
  return { top, bottom, steps };
}

export function biwordFromMatrix(matrix) {
  const top = [];
  const bottom = [];
  const steps = [];

  for (let i = 0; i < matrix.length; i += 1) {
    for (let j = 0; j < matrix[i].length; j += 1) {
      const count = matrix[i][j];

      if (count > 0) {
        steps.push({
          kind: STEP_KIND.MATRIX_ENTRY,
          title: `Matrix entry (${i + 1}, ${j + 1}) = ${count}`,
          content: `Add ${count} copies of the pair (${i + 1}, ${j + 1}).`,
          state: null,
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

export function matrixFromBiword(top, bottom) {
  const numRows = Math.max(...top, 0);
  const numCols = Math.max(...bottom, 0);
  const matrix = Array.from({ length: numRows }, () => Array(numCols).fill(0));

  for (let i = 0; i < top.length; i += 1) {
    matrix[top[i] - 1][bottom[i] - 1] += 1;
  }

  return matrix;
}