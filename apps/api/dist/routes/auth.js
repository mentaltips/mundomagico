"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    try {
        const user = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user || !user.password) {
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
        const token = jsonwebtoken_1.default.sign({
            sub: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            schoolId: user.schoolId,
        }, secret, { expiresIn: '30d' });
        res.json({
            token,
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
exports.default = router;
