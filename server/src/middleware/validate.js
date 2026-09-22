import { BadRequestError } from '../utils/httpErrors.js';

// validate({ body?, params?, query? }) — zod schemas; parsed values replace req.*
export function validate(schemas) {
  return (req, res, next) => {
    try {
      for (const key of ['params', 'query', 'body']) {
        if (schemas[key]) {
          req[key] = schemas[key].parse(req[key]);
        }
      }
      next();
    } catch (err) {
      if (err.name === 'ZodError') {
        const details = err.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
        return next(new BadRequestError(`Validation failed — ${details}`));
      }
      next(err);
    }
  };
}
