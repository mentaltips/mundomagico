"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ─── Payload padrão do token ──────────────────────────────────────────────────
function buildPayload(user) {
    return {
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
    };
}
// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    try {
        const user = await database_1.prisma.user.findUnique({ where: { email } });
        if (!user || !user.password || !user.active) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) {
            return res.status(500).json({ error: 'Erro de configuração do servidor' });
        }
        // Token principal: 8 horas (reduzido de 30 dias)
        const token = jsonwebtoken_1.default.sign(buildPayload(user), secret, { expiresIn: '8h' });
        // Refresh token: 7 dias — usado apenas para renovar o token principal
        const refreshToken = jsonwebtoken_1.default.sign({ sub: user.id, type: 'refresh' }, secret, { expiresIn: '7d' });
        res.json({
            token,
            refreshToken,
            expiresIn: 8 * 60 * 60, // 8h em segundos
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                schoolId: user.schoolId,
            },
        });
    }
    catch (error) {
        console.error('[Auth] Login error:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// ─── POST /auth/refresh ───────────────────────────────────────────────────────
// Recebe o refreshToken e devolve um novo token principal (sem exigir senha)
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ error: 'refreshToken é obrigatório' });
    }
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
        return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(refreshToken, secret);
        if (payload.type !== 'refresh') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        const user = await database_1.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user || !user.active) {
            return res.status(401).json({ error: 'Usuário inativo ou não encontrado' });
        }
        const newToken = jsonwebtoken_1.default.sign(buildPayload(user), secret, { expiresIn: '8h' });
        res.json({
            token: newToken,
            expiresIn: 8 * 60 * 60,
        });
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Refresh token expirado. Faça login novamente.' });
        }
        return res.status(401).json({ error: 'Token inválido' });
    }
});
// ─── GET /auth/me ─────────────────────────────────────────────────────────────
// Retorna dados do usuário logado
router.get('/me', auth_1.requireApiAuth, async (req, res) => {
    try {
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user?.sub },
            select: { id: true, name: true, email: true, role: true, schoolId: true, active: true, avatarUrl: true },
        });
        if (!user || !user.active) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
exports.default = router;
