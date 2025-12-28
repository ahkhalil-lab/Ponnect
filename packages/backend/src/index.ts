import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth.routes';
import dogRoutes from './routes/dog.routes';
import forumRoutes from './routes/forum.routes';
import questionRoutes from './routes/question.routes';
import eventRoutes from './routes/event.routes';
import healthRoutes from './routes/health.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dogs', dogRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/health', healthRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Ponnect API is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

app.listen(PORT, () => {
  console.log(`🐕 Ponnect API server running on port ${PORT}`);
});

export default app;
