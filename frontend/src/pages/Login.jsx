import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

export default function Login() {
  const [form, setForm]         = useState({ username: '', password: '' });
  const [error, setError]       = useState('');
  const [cargando, setCargando] = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const formularioValido = form.username.trim() !== '' && form.password.trim() !== '';

  const handleSubmit = async () => {
    setCargando(true); setError('');
    try {
      const res = await api.post('/autenticacion/token', {
        tabla:           'usuario',
        campoUsuario:    'username',
        campoContrasena: 'password',
        usuario:         form.username,
        contrasena:      form.password,
      });
      login(res.data);
      navigate('/');
    } catch (e) {
      const msg = e.response?.data?.mensaje || 'Error al iniciar sesión';
      setError(msg);
    } finally { setCargando(false); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && formularioValido) handleSubmit(); };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-header">
          <h1>Knowledge<span>Map</span></h1>
          <p>Inicia sesión para continuar</p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <div className="form-group">
          <label>Usuario</label>
          <input
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ingresa tu usuario"
            autoFocus
          />
        </div>

        <div className="form-group" style={{ marginTop: '14px' }}>
          <label>Contraseña</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ingresa tu contraseña"
          />
        </div>

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={cargando || !formularioValido}
          style={{ width: '100%', marginTop: '24px', padding: '10px' }}
        >
          {cargando ? 'Iniciando sesión...' : 'Ingresar'}
        </button>
      </div>
    </div>
  );
}