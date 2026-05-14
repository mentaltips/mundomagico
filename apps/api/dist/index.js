"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const pino_http_1 = __importDefault(require("pino-http"));
require("./workers/whatsapp.worker");
const queue_1 = require("./services/queue");
const auth_1 = require("./middleware/auth");
// Existing routes
const students_1 = __importDefault(require("./routes/students"));
const groups_1 = __importDefault(require("./routes/groups"));
const stats_1 = __importDefault(require("./routes/stats"));
const auth_2 = __importDefault(require("./routes/auth"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
// New routes
const children_1 = __importDefault(require("./routes/children"));
const announcements_1 = __importDefault(require("./routes/announcements"));
const calendar_1 = __importDefault(require("./routes/calendar"));
const check_in_out_1 = __importDefault(require("./routes/check-in-out"));
const child_items_1 = __importDefault(require("./routes/child-items"));
const daily_routine_1 = __importDefault(require("./routes/daily-routine"));
const development_reports_1 = __importDefault(require("./routes/development-reports"));
const finance_1 = __importDefault(require("./routes/finance"));
const guardians_1 = __importDefault(require("./routes/guardians"));
const health_1 = __importDefault(require("./routes/health"));
const photos_1 = __importDefault(require("./routes/photos"));
const settings_1 = __importDefault(require("./routes/settings"));
const users_1 = __importDefault(require("./routes/users"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const parent_1 = __importDefault(require("./routes/parent"));
const teacher_1 = __importDefault(require("./routes/teacher"));
const daily_reports_1 = __importDefault(require("./routes/daily-reports"));
const documents_1 = __importDefault(require("./routes/documents"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
// CORS - aceita requisições do admin Vercel e de localhost em dev
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    ...(process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
        : []),
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permite requisições sem origin (ex: curl, Postman, server-to-server)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.some((o) => origin.startsWith(o)))
            return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, pino_http_1.default)());
app.get('/health', (req, res) => {
    const redis = (0, queue_1.isRedisHealthy)();
    res.status(redis ? 200 : 207).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            api: 'ok',
            redis: redis ? 'ok' : 'unavailable — notificações WhatsApp pausadas',
        },
    });
});
// Webhooks públicos (sem auth — verificação própria por assinatura)
app.use('/api/webhooks', webhooks_1.default);
// Existing routes
app.use('/api/students', auth_1.requireApiAuth, students_1.default);
app.use('/api/groups', auth_1.requireApiAuth, groups_1.default);
app.use('/api/stats', auth_1.requireApiAuth, stats_1.default);
app.use('/api/auth', auth_2.default);
// New routes
app.use('/api/children', auth_1.requireApiAuth, children_1.default);
app.use('/api/announcements', auth_1.requireApiAuth, announcements_1.default);
app.use('/api/calendar', auth_1.requireApiAuth, calendar_1.default);
app.use('/api/check-in-out', auth_1.requireApiAuth, check_in_out_1.default);
app.use('/api/child-items', auth_1.requireApiAuth, child_items_1.default);
app.use('/api/daily-routine', auth_1.requireApiAuth, daily_routine_1.default);
app.use('/api/development-reports', auth_1.requireApiAuth, development_reports_1.default);
app.use('/api/finance', auth_1.requireApiAuth, finance_1.default);
app.use('/api/guardians', auth_1.requireApiAuth, guardians_1.default);
app.use('/api/health', auth_1.requireApiAuth, health_1.default);
app.use('/api/photos', auth_1.requireApiAuth, photos_1.default);
app.use('/api/settings', auth_1.requireApiAuth, settings_1.default);
app.use('/api/users', auth_1.requireApiAuth, users_1.default);
app.use('/api/notifications', auth_1.requireApiAuth, notifications_1.default);
app.use('/api/parent', auth_1.requireApiAuth, parent_1.default);
app.use('/api/teacher', auth_1.requireApiAuth, teacher_1.default);
app.use('/api/daily-reports', auth_1.requireApiAuth, daily_reports_1.default);
app.use('/api/documents', auth_1.requireApiAuth, documents_1.default);
app.post('/api/whatsapp/send', auth_1.requireApiAuth, async (req, res) => {
    const { to, templateName, languageCode, components } = req.body;
    if (!to || !templateName) {
        return res.status(400).json({ error: 'Missing required fields: to, templateName' });
    }
    try {
        const job = await queue_1.whatsappQueue.add('send-notification', {
            to,
            templateName,
            languageCode: languageCode || 'pt_BR',
            components: components || []
        });
        res.status(202).json({ success: true, jobId: job.id });
    }
    catch (error) {
        req.log.error(error, 'Error enqueueing whatsapp message');
        res.status(500).json({ error: 'Failed to enqueue message' });
    }
});
const PORT = process.env.API_PORT || 3002;
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 API Server running on port ${PORT}`);
});
