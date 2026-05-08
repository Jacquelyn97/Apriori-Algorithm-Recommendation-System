import axios from 'axios';

// 和你 Flask 后端保持一致，必要时改这个地址
export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 8000
});

export async function fetchMenu() {
  const res = await api.get('/menu');
  return res.data;
}

