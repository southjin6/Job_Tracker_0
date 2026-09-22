export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code ?? message.toLowerCase().replace(/\s+/g, '_');
  }
}

export class NotFoundError extends HttpError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`, 'not_found');
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad request') {
    super(400, message, 'bad_request');
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict') {
    super(409, message, 'conflict');
  }
}
