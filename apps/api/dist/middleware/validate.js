"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
/**
 * Middleware genérico de validação com Zod.
 * Valida req.body contra o schema fornecido.
 * Retorna 400 com lista de erros se inválido.
 */
function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            return res.status(400).json({ error: 'Dados inválidos', details: errors });
        }
        req.body = result.data;
        next();
    };
}
