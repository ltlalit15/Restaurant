# Restaurant KOT Backend API

## Deployment Instructions

This Node.js Express backend provides APIs for the Restaurant KOT (Kitchen Order Ticket) system.

### Environment Variables
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (production/development)

### Deployment Platforms
- **Heroku**: Use Procfile for deployment
- **Railway**: Git-based deployment supported
- **Render**: Git-based deployment supported

### API Endpoints
- `GET /api/health` - Health check
- `GET /api/printers` - Get all printers
- `POST /api/printers` - Add new printer
- `POST /api/printers/:id/test` - Test printer
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `GET /api/kot/queue` - Get KOT queue
- `POST /api/kot/print` - Print KOT

### Local Development
```bash
npm install
npm start
```

Server runs on http://localhost:3001
