import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import deliveryRouter from './routes/delivery.js';
import uploadRouter from './routes/upload.js';

dotenv.config();

const app = express();

// Configure CORS - Allow all origins in dev, or specific frontends
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/delivery', deliveryRouter);
app.use('/api/upload', uploadRouter);

// Base API route
app.get('/api', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Ulvik Print API is running',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong on the server' });
});

// Export for Vercel Serverless Function
export default app;

// Start server if run locally (not as a serverless function)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}
