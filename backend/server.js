const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const printerRoutes = require('./routes/printers');
const kotRoutes = require('./routes/kot');
const orderRoutes = require('./routes/orders');

app.use('/api/printers', printerRoutes);
app.use('/api/kot', kotRoutes);
app.use('/api/orders', orderRoutes);

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
