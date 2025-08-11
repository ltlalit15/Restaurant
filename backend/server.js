const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['https://restaurant-ui-app-od9aq4fi.devinapps.com', 'http://localhost:5173', 'https://restaurant-ui-app-tunnel-9b0ksdl3.devinapps.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const printerRoutes = require('./routes/printers');
const kotRoutes = require('./routes/kot');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');

app.use('/api/printers', printerRoutes);
app.use('/api/kot', kotRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'KOT Backend API is running' });
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`KOT Backend Server running on port ${PORT}`);
});

module.exports = app;
