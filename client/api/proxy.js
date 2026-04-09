/**
 * Vercel API Route Proxy
 * Routes all /api/* requests to the Render backend
 * This solves CORS issues and provides a unified endpoint
 */
import axios from 'axios';

const RENDER_API = process.env.VITE_RENDER_API_URL || 'https://dev-collab-platform-eme5.onrender.com';

export default async function handler(req, res) {
  const { path } = req.query;
  
  // Build the target URL
  const targetUrl = `${RENDER_API}/api/${path.join('/')}`;
  
  try {
    // Forward the request with all headers except host
    const { headers } = req;
    delete headers.host;
    
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        ...headers,
        'X-Forwarded-For': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      },
      data: req.method !== 'GET' ? req.body : undefined,
      validateStatus: () => true, // Don't throw on any status
    });
    
    // Forward the response
    Object.entries(response.headers).forEach(([key, value]) => {
      if (!['transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error(`Proxy error for ${targetUrl}:`, error.message);
    res.status(503).json({
      message: 'Service temporarily unavailable',
      error: error.message,
    });
  }
}
