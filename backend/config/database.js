const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool
const pool = mysql.createPool({

  host: "localhost",     // 👈 Localhost for local MySQL
  port: 3306,            // 👈 Default MySQL port
  user: "root",          // 👈 Your local MySQL username
  password: "",          // 👈 Or your local MySQL password
  database: "pos_restaurant_pool",                // Database Name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  multipleStatements: true
});

// Get promise-based connection
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

testConnection();

module.exports = promisePool;



