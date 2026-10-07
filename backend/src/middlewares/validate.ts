import type { RequestHandler } from "express";
import type { ZodType } from "zod";

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Valida body, query e params com Zod. Em caso de erro, o ZodError segue para o
 * errorHandler (resposta 400). Os dados validados de query e params ficam em
 * res.locals.query e res.locals.params; o body validado substitui req.body.
 *
 * Exemplo: router.post("/", validate({ body: createSchema }), controller.create);
 */
export function validate(schemas: Schemas): RequestHandler {
  return (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) res.locals.query = schemas.query.parse(req.query);
      if (schemas.params) res.locals.params = schemas.params.parse(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
}
