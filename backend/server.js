const express = require('express');
const cors = require('cors');
// Forced restart check 4
const morgan = require('morgan');
require('dotenv').config(); // Load environment variables first

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const cakeRoutes = require('./src/routes/cakeRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const feedbackRoutes = require('./src/routes/feedbackRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const scheduleRoutes = require('./src/routes/scheduleRoutes');
const publicCakeRoutes = require('./src/routes/publicCakeRoutes');
const bulkRoutes = require('./src/routes/bulkRoutes');

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cakes', cakeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/public/cakes', publicCakeRoutes);
app.use('/api/bulk-pricing', bulkRoutes);
app.use('/api/upload', require('./src/routes/uploadRoutes'));
app.use('/api/content', require('./src/routes/contentRoutes'));
app.use('/api/form-fields', require('./src/routes/formFieldRoutes'));

// Initialize Scheduled Background Jobs
const { initCronJobs } = require('./src/utils/cronJobs');
initCronJobs();

// Root Route
app.get('/', (req, res) => {
  res.send(`
      <h1>Backend is running 🚀</h1>
      <p>API is ready.</p>
      <p>Admin Panel: <a href="http://localhost:5173">http://localhost:5173</a></p>
    `);
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});

module.exports = app;
