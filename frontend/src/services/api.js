import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000', withCredentials: true });
let accessToken = null;

export const setAccessToken = (token) => { accessToken = token; };

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        const res = await axios.post('/auth/refresh', {}, { withCredentials: true, baseURL: 'http://localhost:8000' });
        setAccessToken(res.data.access_token);
        err.config.headers.Authorization = `Bearer ${res.data.access_token}`;
        return api(err.config);
      } catch {
        setAccessToken(null);
        window.location.href = '/auth';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
