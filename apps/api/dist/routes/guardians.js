"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const router = (0, express_1.Router)();
// GET / - List guardians (those linked to children or students of this school)
router.get('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const guardians = await database_1.prisma.guardian.findMany({
            where: {
                OR: [
                    { children: { some: { child: { schoolId } } } },
                    { students: { some: { student: { schoolId } } } },
                ]
            },
            include: {
                children: { include: { child: { select: { id: true, fullName: true } } } },
                students: { include: { student: { select: { id: true, fullName: true } } } }
            },
            orderBy: { fullName: 'asc' }
        });
        res.json(guardians);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST / - Create guardian
router.post('/', async (req, res) => {
    try {
        const { childId, studentId, isPrimary, canPickup, receiveNotif, ...guardianData } = req.body;
        const guardian = await database_1.prisma.guardian.create({
            data: guardianData
        });
        if (childId) {
            await database_1.prisma.childGuardian.create({
                data: {
                    childId,
                    guardianId: guardian.id,
                    isPrimary: isPrimary ?? false,
                    canPickup: canPickup ?? true,
                    receiveNotif: receiveNotif ?? true,
                }
            });
        }
        if (studentId) {
            await database_1.prisma.studentGuardian.create({
                data: {
                    studentId,
                    guardianId: guardian.id,
                    isPrimary: isPrimary ?? false,
                }
            });
        }
        res.status(201).json(guardian);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /:id - Get guardian
router.get('/:id', async (req, res) => {
    try {
        const guardian = await database_1.prisma.guardian.findUnique({
            where: { id: req.params.id },
            include: {
                children: { include: { child: { select: { id: true, fullName: true } } } },
                students: { include: { student: { select: { id: true, fullName: true } } } }
            }
        });
        if (!guardian)
            return res.status(404).json({ error: 'Guardian not found' });
        res.json(guardian);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /:id - Update guardian
router.patch('/:id', async (req, res) => {
    try {
        const { childId, studentId, isPrimary, canPickup, receiveNotif, ...guardianData } = req.body;
        const guardian = await database_1.prisma.guardian.update({
            where: { id: req.params.id },
            data: guardianData
        });
        res.json(guardian);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /:id - Delete guardian
router.delete('/:id', async (req, res) => {
    try {
        await database_1.prisma.guardian.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// POST /:id/create-user - Generate access for a guardian
router.post('/:id/create-user', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const guardianId = req.params.id;
        const guardian = await database_1.prisma.guardian.findUnique({
            where: { id: guardianId }
        });
        if (!guardian) {
            return res.status(404).json({ error: 'Guardian not found' });
        }
        if (guardian.userId) {
            return res.status(400).json({ error: 'Guardian already has a user account' });
        }
        if (!guardian.email) {
            return res.status(400).json({ error: 'Guardian must have an email address to create an account' });
        }
        // Check if user with email already exists
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email: guardian.email }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'A user with this email already exists' });
        }
        // Generate random 6-digit numeric password
        const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcryptjs_1.default.hash(tempPassword, 10);
        // Create User
        const user = await database_1.prisma.user.create({
            data: {
                email: guardian.email,
                password: hashedPassword,
                name: guardian.fullName,
                role: 'GUARDIAN',
                phone: guardian.phone,
                schoolId: schoolId,
            }
        });
        // Update Guardian with userId
        await database_1.prisma.guardian.update({
            where: { id: guardian.id },
            data: { userId: user.id }
        });
        res.status(201).json({
            success: true,
            email: user.email,
            password: tempPassword,
            message: 'Access generated successfully'
        });
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
