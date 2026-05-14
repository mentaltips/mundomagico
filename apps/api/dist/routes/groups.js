"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const groups = await database_1.prisma.group.findMany({
            include: {
                _count: {
                    select: { students: true, children: true }
                }
            }
        });
        res.json(groups);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});
exports.default = router;
