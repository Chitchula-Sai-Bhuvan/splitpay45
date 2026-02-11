import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// import { connectMongo } from './config/mongo';
// import { connectNeo4j } from './config/neo4j';
import logger from './utils/logger';

import userRoutes from './routes/userRoutes';
import groupRoutes from './routes/groupRoutes';
import expenseRoutes from './routes/expenseRoutes';
import settlementRoutes from './routes/settlementRoutes';
import auditRoutes from './routes/auditRoutes';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);
// app.use('/api/audit-logs', auditRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', services: { mysql: 'checking...', mongo: 'checking...', neo4j: 'checking...' } });
});

// Start Server
const startServer = async () => {
    // await connectMongo(); // Disabled
    // await connectNeo4j(); // Disabled

    app.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT}`);
    });
};

startServer();

export default app;
