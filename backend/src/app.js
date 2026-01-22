const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const orderRoutes = require('./routes/orderRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cakeRoutes = require('./routes/cakeRoutes');
const customerRoutes = require('./routes/customerRoutes');
const customerRoutes = require('./routes/customerRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cakes', cakeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transactions', transactionRoutes);
const scheduleRoutes = require('./routes/scheduleRoutes');
app.use('/api/schedule', scheduleRoutes);

const publicCakeRoutes = require('./routes/publicCakeRoutes');
app.use('/api/public/cakes', publicCakeRoutes);

// Routes
app.get('/', (req, res) => {
    res.send(`
      <h1>Backend is running 🚀</h1>
      <p>API is ready.</p>
      <p>Admin Panel: <a href="http://localhost:5173">http://localhost:5173</a></p>
    `);
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
