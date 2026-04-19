import axios from 'axios';
import { BASE_URL } from '../config/api';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

export default axiosInstance;

