// Shared helpers for building parameterized INSERT/UPDATE statements.

export function buildInsert(table, data) {
  const keys = Object.keys(data);
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
  return { sql, params: keys.map((k) => data[k] ?? null) };
}

export function buildUpdate(table, id, data) {
  const keys = Object.keys(data);
  if (!keys.length) return null;
  const sql = `UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`;
  return { sql, params: [...keys.map((k) => data[k] ?? null), id] };
}

// Keep only keys present in `data` (so PATCH-style partial updates work).
export function pick(data, allowed) {
  const out = {};
  for (const key of allowed) {
    if (key in data) out[key] = data[key];
  }
  return out;
}

// For NOT NULL DEFAULT columns: a client-sent null would fail (insert) or be
// meaningless (update), so drop the key and let the default / existing value stand.
export function keepDefaults(data, columns) {
  const out = { ...data };
  for (const col of columns) {
    if (out[col] == null) delete out[col];
  }
  return out;
}
