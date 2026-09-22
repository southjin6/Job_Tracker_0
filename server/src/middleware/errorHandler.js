import { HttpError } from '../utils/httpErrors.js';

export function notFound(req, res) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}`, code: 'not_found' } });
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { message: err.message, code: err.code } });
  }

  // body-parser rethrows JSON.parse failures tagged this way; they are client errors, not 500s
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Request body could not be parsed as JSON.', code: 'bad_request' } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { message: 'Request body too large.', code: 'payload_too_large' } });
  }

  // MySQL foreign key / duplicate errors -> useful JSON instead of a raw dump
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ error: { message: 'Cannot delete: other records depend on this row.', code: 'conflict' } });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: { message: 'Referenced record does not exist.', code: 'bad_request' } });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: { message: 'Duplicate entry.', code: 'conflict' } });
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error', code: 'internal_error' } });
}
