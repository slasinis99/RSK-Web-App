export function parseLineOfInts(text) {
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

export function parseTableau(text) {
  const lines = text.trim().split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    throw new Error("A tableau cannot be empty.");
  }
  return lines.map(parseLineOfInts);
}

export function parseMatrix(text) {
  const rows = parseTableau(text);
  const width = rows[0].length;

  if (width === 0) {
    throw new Error("Matrix rows cannot be empty.");
  }

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

export function validateSemistandard(T, name) {
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
      if (c < T[r].length) {
        col.push(T[r][c]);
      }
    }
    for (let i = 1; i < col.length; i += 1) {
      if (col[i] <= col[i - 1]) {
        throw new Error(`${name} is not strictly increasing down columns.`);
      }
    }
  }
}

export function validateStandard(T, name) {
  validateSemistandard(T, name);
  const entries = T.flat();
  const sorted = [...entries].sort((a, b) => a - b);

  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i] !== i + 1) {
      throw new Error(`${name} is not standard: its entries must be exactly 1, 2, ..., n.`);
    }
  }
}

export function sameShape(A, B) {
  if (A.length !== B.length) return false;
  for (let i = 0; i < A.length; i += 1) {
    if (A[i].length !== B[i].length) return false;
  }
  return true;
}
