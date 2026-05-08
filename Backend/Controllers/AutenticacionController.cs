using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ApiGenericaCsharp.Modelos;
using ApiGenericaCsharp.Servicios.Abstracciones;
using Microsoft.Data.SqlClient;

namespace ApiGenericaCsharp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AutenticacionController : ControllerBase
    {
        private readonly ConfiguracionJwt _configuracionJwt;
        private readonly IServicioCrud _servicioCrud;
        private readonly IProveedorConexion _proveedorConexion;

        public AutenticacionController(
            IOptions<ConfiguracionJwt> opcionesJwt,
            IServicioCrud servicioCrud,
            IProveedorConexion proveedorConexion)
        {
            _configuracionJwt = opcionesJwt.Value;
            _servicioCrud = servicioCrud;
            _proveedorConexion = proveedorConexion;
        }

        [HttpPost("token")]
        public async Task<IActionResult> GenerarToken([FromBody] CredencialesGenericas credenciales)
        {
            if (string.IsNullOrWhiteSpace(credenciales.Tabla) ||
                string.IsNullOrWhiteSpace(credenciales.CampoUsuario) ||
                string.IsNullOrWhiteSpace(credenciales.CampoContrasena) ||
                string.IsNullOrWhiteSpace(credenciales.Usuario) ||
                string.IsNullOrWhiteSpace(credenciales.Contrasena))
            {
                return BadRequest(new { estado = 400, mensaje = "Debe enviar tabla, campos y credenciales completas." });
            }

            // FASE 1: Verificar credenciales
            var (codigo, mensaje) = await _servicioCrud.VerificarContrasenaAsync(
                credenciales.Tabla,
                null,
                credenciales.CampoUsuario,
                credenciales.CampoContrasena,
                credenciales.Usuario,
                credenciales.Contrasena
            );

            if (codigo == 404)
                return NotFound(new { estado = 404, mensaje = "Usuario no encontrado." });
            if (codigo == 401)
                return Unauthorized(new { estado = 401, mensaje = "Contraseña incorrecta." });
            if (codigo != 200)
                return StatusCode(500, new { estado = 500, mensaje = "Error interno.", detalle = mensaje });

            // FASE 2: Obtener id y rol del usuario
            var (usuarioId, rolNombre) = await ObtenerIdYRolAsync(credenciales.Usuario);

            // FASE 3: Generar token con rol incluido
            var claims = new[]
            {
                new Claim(ClaimTypes.Name,               credenciales.Usuario),
                new Claim("tabla",                       credenciales.Tabla),
                new Claim("campoUsuario",                credenciales.CampoUsuario),
                new Claim("usuarioId",                   usuarioId.ToString()),
                new Claim(ClaimTypes.Role,               rolNombre),
            };

            var clave               = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuracionJwt.Key));
            var credencialesFirma   = new SigningCredentials(clave, SecurityAlgorithms.HmacSha256);
            var duracion            = _configuracionJwt.DuracionMinutos > 0 ? _configuracionJwt.DuracionMinutos : 60;

            var token = new JwtSecurityToken(
                issuer:             _configuracionJwt.Issuer,
                audience:           _configuracionJwt.Audience,
                claims:             claims,
                expires:            DateTime.UtcNow.AddMinutes(duracion),
                signingCredentials: credencialesFirma
            );

            string tokenGenerado = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new
            {
                estado      = 200,
                mensaje     = "Autenticación exitosa.",
                usuario     = credenciales.Usuario,
                usuarioId   = usuarioId,
                rol         = rolNombre,
                token       = tokenGenerado,
                expiracion  = token.ValidTo
            });
        }

        // Consulta el id y rol del usuario desde la BD
        private async Task<(int usuarioId, string rolNombre)> ObtenerIdYRolAsync(string username)
        {
            string sql = @"
                SELECT u.id, r.nombre
                FROM usuario u
                INNER JOIN rol_usuario ru ON u.id = ru.usuario_id
                INNER JOIN rol r          ON ru.rol_id = r.id
                WHERE u.username = @username
                AND u.activo = 1";

            try
            {
                string cadena = _proveedorConexion.ObtenerCadenaConexion();
                using var conexion = new SqlConnection(cadena);
                await conexion.OpenAsync();

                using var comando = new SqlCommand(sql, conexion);
                comando.Parameters.AddWithValue("@username", username);

                using var lector = await comando.ExecuteReaderAsync();
                if (await lector.ReadAsync())
                {
                    int id       = lector.GetInt32(0);
                    string rol   = lector.GetString(1);
                    return (id, rol);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al obtener rol: {ex.Message}");
            }

            return (0, "Visitante"); // Rol por defecto si no tiene asignado
        }
    }

    public class CredencialesGenericas
    {
        public string Tabla           { get; set; } = string.Empty;
        public string CampoUsuario    { get; set; } = string.Empty;
        public string CampoContrasena { get; set; } = string.Empty;
        public string Usuario         { get; set; } = string.Empty;
        public string Contrasena      { get; set; } = string.Empty;
    }
}