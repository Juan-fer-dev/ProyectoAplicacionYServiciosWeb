import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5034/api' });

export const listar          = (tabla)                    => api.get(`/${tabla}`);
export const obtenerPorClave = (tabla, clave, valor)      => api.get(`/${tabla}/${clave}/${valor}`);
export const crear           = (tabla, datos)              => api.post(`/${tabla}`, datos);
export const actualizar      = (tabla, pk, val, datos)     => api.put(`/${tabla}/${pk}/${val}`, datos);
export const eliminar        = (tabla, pk, val)            => api.delete(`/${tabla}/${pk}/${val}`);