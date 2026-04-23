// API Configuration
// For local development: http://localhost:3000/api
// For production: Update this to your Railway backend URL
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api'
  : 'https://e-com-web-j9mu.onrender.com/api'; 
// Export for use in app.js
window.API_BASE = API_BASE;
