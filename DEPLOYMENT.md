# Deployment Guide

## Overview
This document outlines the deployment strategy for the Dev Collab Platform.

### Current Setup
- **Frontend**: Vercel (client folder)
- **Backend**: Render (server folder)
- **Database**: MongoDB Atlas

### Environment Variables

#### Vercel (Frontend)
- `VITE_API_URL` - API base URL (optional, uses relative paths for production)
- `VITE_SOCKET_URL` - WebSocket URL (optional, defaults to API origin)

#### Render (Backend)
- `NODE_ENV` - Set to `production`
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `CLIENT_URL` - Allowed CORS origins (comma-separated)
  - Example: `https://yourvercel-app.vercel.app,https://your-domain.com`
- `NODE_VERSION` - Set to 20.18.0

### Deployment Process

#### Frontend (Vercel)
1. Ensure client/package.json and client/vite.config.js are set up
2. Connect GitHub repo to Vercel
3. Set build command: `npm run build --prefix client`
4. Set output directory: `client/dist`
5. Add environment variables (if needed)
6. Deploy - Vercel will automatically rebuild on push to main

#### Backend (Render)
1. Push changes to GitHub
2. Render automatically redeploys when detecting changes
3. Ensure environment variables are set in Render dashboard
4. Monitor logs in Render dashboard

### API Routing
The frontend automatically routes API calls based on environment:
- **Production (Vercel)**: Uses Vercel rewrites to proxy to Render backend
- **Local Development**: Uses local backend at `http://localhost:5000`

### Performance Optimizations
- Response compression enabled on backend
- Database query caching (5-min TTL)
- Request retry logic for cold starts
- Database indexes on frequently queried fields
- Helmet security headers

### Troubleshooting

#### Login Issues
- Check `CLIENT_URL` env var on Render backend
- Ensure Vercel domain is added to allowed CORS origins
- Check response in browser DevTools Network tab

#### Slow Requests
- First request after 30 mins may be slow (Render free tier cold start)
- Subsequent requests should be fast due to caching
- Check database connection timeout settings

#### WebSocket Issues
- Ensure `VITE_SOCKET_URL` is set to Render backend origin
- Check browser console for connection errors

### Clean Up Strategy
- Do NOT create separate production branches
- Use main branch for production
- Tag releases with version numbers
- Clean up old deployment files from Vercel dashboard periodically
