const express = require('express');
const dotenv = require('dotenv');
const userRoutes = require('./modules/customer/routes/userRoutes');
const admin = require('./modules/admin/routes/adminRoutes')
const superAdmin = require('./modules/superAdmin/routes/adminRoutes')
const member = require('./modules/member/routes/memberRoute')
const cors = require('cors');

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors(corsOptions))
app.use('/api', userRoutes);
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
