const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const backupToExcel = require('./backup');

const userRoutes = require('./modules/customer/routes/userRoutes');
const vendorRoutes = require('./modules/vendor/routes/vendorRoutes');
const admin = require('./modules/admin/routes/adminRoutes')
const superAdmin = require('./modules/superAdmin/routes/adminRoutes')
const member = require('./modules/member/routes/memberRoute')
const auth = require('./middlewares/authRoutes');
const pool = require('./config/db');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // Required for FormData
app.use(bodyParser.json()); // Parse incoming JSON requests

const allowedOrigins = process.env.FRONTEND_URLS.split(',');

app.use(cors({
  origin: function (origin, callback) {
    // allow server-to-server or Postman requests
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  exposedHeaders: ['Set-Cookie', 'x-auth-token', 'x-auth-token-name'],
}));



// Schedule backup every 24 minute
cron.schedule('0 0 * * *', () => {
  console.log('⏱️ Running scheduled backup...');
  backupToExcel();
});

cron.schedule('0 0 * * *', async () => {
  try {
    await pool.promise().query(`
      DELETE FROM login_tokens
      WHERE expires_at < NOW() - INTERVAL 24 HOUR
    `);
    console.log('Old login tokens deleted');
  } catch (err) {
    console.error('Error deleting tokens:', err);
  }
});

app.use('/auth', auth);
app.use('/api', userRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/admin', admin);
app.use('/api/member', member);
app.use('/api/superAdmin', superAdmin);

app.get('/', (req, res) => {
  res.send('Welcome to the Admin and Customer Management API');
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
