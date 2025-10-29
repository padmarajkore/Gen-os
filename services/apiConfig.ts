// Configuration for API endpoints
const API_CONFIG = {
  // Use this proxy endpoint for NVIDIA API calls
  NVIDIA_PROXY: import.meta.env.VITE_NVIDIA_PROXY || '/api/nvidia-proxy'
};

export default API_CONFIG;
