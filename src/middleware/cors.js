import config from '../config/config.js';

const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  const isAllowed = config.cors.allowedOrigins.some(allowedOrigin => {
    // Exact match
    if (allowedOrigin === origin) return true;
    
    // Wildcard match (for Vercel patterns)
    if (allowedOrigin.includes('*')) {
      const regexPattern = allowedOrigin.replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(origin);
    }
    
    return false;
  });

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Authorization');
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

export default corsMiddleware;