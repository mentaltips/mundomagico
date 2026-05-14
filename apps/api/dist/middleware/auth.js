"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireApiAuth = requireApiAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function requireApiAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
        console.error('[Auth] NEXTAUTH_SECRET não configurado');
        return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, secret);
        req.user = payload;
        next();
    }
    catch (err) {
        console.error('[Auth] Erro na verificação do token:', err.message);
        return res.status(401).json({ error: 'Token inválido ou expirado', detail: err.message });
    }
}
