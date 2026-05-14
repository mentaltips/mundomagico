"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
/**
 * Middleware que restringe acesso a roles específicas.
 * Deve ser usado após requireApiAuth.
 *
 * Exemplo: requireRole('ADMIN', 'DIRECTOR')
 */
function requireRole(...roles) {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole || !roles.includes(userRole)) {
            return res.status(403).json({
                error: 'Acesso negado',
                detail: `Apenas ${roles.join(' ou ')} podem executar esta ação.`,
            });
        }
        next();
    };
}
