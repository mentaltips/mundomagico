"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const pino_http_1 = __importDefault(require("pino-http"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../../.env' });
require("../workers/whatsapp.worker");
const queue_1 = require("./services/queue");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, pino_http_1.default)());
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.post('/api/whatsapp/send', async (req, res) => {
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
const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
});
