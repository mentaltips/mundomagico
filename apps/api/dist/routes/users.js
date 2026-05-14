"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const requireRole_1 = require("../middleware/requireRole");
const router = (0, express_1.Router)();
// Roles que podem gerenciar usuários
const MANAGERS = ['ADMIN', 'DIRECTOR'];
// GET / - List users of school
router.get('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const users = await database_1.prisma.user.findMany({
            where: { schoolId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                avatarUrl: true,
                active: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { name: 'asc' }
        });
        res.json(users);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST / - Create user (apenas ADMIN e DIRECTOR)
router.post('/', (0, requireRole_1.requireRole)(...MANAGERS), async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { password, ...rest } = req.body;
        const hashed = await bcryptjs_1.default.hash(password, 10);
        const user = await database_1.prisma.user.create({
            data: { ...rest, schoolId, password: hashed },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                avatarUrl: true,
                active: true,
                createdAt: true,
            }
        });
        res.status(201).json(user);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /:id - Get user
router.get('/:id', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const user = await database_1.prisma.user.findFirst({
            where: { id: req.params.id, schoolId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                avatarUrl: true,
                active: true,
                createdAt: true,
                updatedAt: true,
            }
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        res.json(user);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /:id - Update user (apenas ADMIN e DIRECTOR)
router.patch('/:id', (0, requireRole_1.requireRole)(...MANAGERS), async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { password, ...rest } = req.body;
        const data = { ...rest };
        if (password) {
            data.password = await bcryptjs_1.default.hash(password, 10);
        }
        const result = await database_1.prisma.user.updateMany({
            where: { id: req.params.id, schoolId },
            data
        });
        if (result.count === 0)
            return res.status(404).json({ error: 'User not found' });
        const updated = await database_1.prisma.user.findUnique({
            where: { id: req.params.id },
            select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, active: true }
        });
        res.json(updated);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /:id - Desativa usuário (apenas ADMIN e DIRECTOR)
router.delete('/:id', (0, requireRole_1.requireRole)(...MANAGERS), async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const result = await database_1.prisma.user.updateMany({
            where: { id: req.params.id, schoolId },
            data: { active: false }
        });
        if (result.count === 0)
            return res.status(404).json({ error: 'User not found' });
        res.json({ success: true });
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
