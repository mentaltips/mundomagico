"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const router = (0, express_1.Router)();
// GET / - Get school settings
router.get('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const school = await database_1.prisma.school.findUnique({
            where: { id: schoolId },
            select: {
                id: true,
                name: true,
                cnpj: true,
                phone: true,
                email: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
                logoUrl: true,
                institutionType: true,
                activeModules: true,
                terminology: true,
                whatsappPhone: true,
                smtpHost: true,
                smtpPort: true,
                smtpUser: true,
                smtpFrom: true,
                createdAt: true,
                updatedAt: true,
            }
        });
        if (!school)
            return res.status(404).json({ error: 'School not found' });
        res.json(school);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH / - Update school settings
router.patch('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        // Remove sensitive tokens from direct update; use specific endpoints for those
        const { whatsappToken, mpAccessToken, mpPublicKey, smtpPass, ...safeData } = req.body;
        const school = await database_1.prisma.school.update({
            where: { id: schoolId },
            data: safeData,
        });
        res.json(school);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /institution-type - Get institution type and modules
router.get('/institution-type', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const school = await database_1.prisma.school.findUnique({
            where: { id: schoolId },
            select: { institutionType: true, activeModules: true, terminology: true }
        });
        if (!school)
            return res.status(404).json({ error: 'School not found' });
        res.json(school);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /institution-type - Update institution type and modules
router.patch('/institution-type', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { institutionType, activeModules, terminology } = req.body;
        const school = await database_1.prisma.school.update({
            where: { id: schoolId },
            data: {
                ...(institutionType && { institutionType }),
                ...(activeModules !== undefined && { activeModules }),
                ...(terminology !== undefined && { terminology }),
            }
        });
        res.json({ institutionType: school.institutionType, activeModules: school.activeModules, terminology: school.terminology });
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
