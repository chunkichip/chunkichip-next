require('dotenv').config();
const next = require('next');
const express = require('express');
const api = require('./api/server');

const port = Number(process.env.PORT || 3000);
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, hostname: '0.0.0.0', port });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();
  app.use((req,res,next) => {
    if (req.hostname.endsWith('.onrender.com')) res.set('X-Robots-Tag','noindex');
    next();
  });
  app.use(api);
  app.use((req, res) => handle(req, res));
  app.listen(port, '0.0.0.0', () => console.log(`Chunki Chip listening on ${port}`));
}).catch((error) => {
  console.error('Unable to start Chunki Chip:', error);
  process.exit(1);
});
