import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUsuario({
            username:  decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
            rol:       decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
            usuarioId: decoded['usuarioId'],
            token,
          });
        } else {
          localStorage.removeItem('token');
        }
      } catch {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (datos) => {
    localStorage.setItem('token', datos.token);
    setUsuario({
      username:  datos.usuario,
      rol:       datos.rol,
      usuarioId: datos.usuarioId,
      token:     datos.token,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);