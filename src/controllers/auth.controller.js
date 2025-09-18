import AuthService from '../services/auth.service.js';

/**
 * Controlador de Autenticación
 * Maneja las rutas relacionadas con autenticación y autorización
 * Solo contiene lógica de HTTP, la lógica de negocio está en AuthService
 */
class AuthController {
    
    /**
     * Login específico para administradores
     */
    static async loginAdmin(req, res) {
        try {
            const { usuario, password } = req.body;

            // Validar datos de entrada
            if (!usuario || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario y contraseña son requeridos'
                });
            }

            // Usar el servicio de autenticación
            const resultado = await AuthService.autenticarAdmin(usuario, password);

            // Manejar resultado del servicio
            if (!resultado.success) {
                const statusCode = resultado.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401;
                return res.status(statusCode).json({
                    success: false,
                    message: resultado.message
                });
            }

            // Respuesta exitosa con JWT token
            return res.status(200).json({
                success: true,
                message: resultado.message,
                data: {
                    usuario: resultado.data.usuario,
                    token: resultado.data.sesion.token,
                    sessionId: resultado.data.sesion.sessionId, // Mantener compatibilidad
                    permisos: resultado.data.permisos,
                    expiresIn: resultado.data.sesion.expiresIn
                }
            });

        } catch (error) {
            console.error('Error en login admin:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Login general para cualquier usuario
     */
    static async login(req, res) {
        try {
            const { usuario, password } = req.body;

            // Validar datos de entrada
            if (!usuario || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario y contraseña son requeridos'
                });
            }

            // Usar el servicio de autenticación
            const resultado = await AuthService.autenticarUsuario(usuario, password);

            // Manejar resultado del servicio
            if (!resultado.success) {
                return res.status(401).json({
                    success: false,
                    message: resultado.message
                });
            }

            // Respuesta exitosa con JWT token
            return res.status(200).json({
                success: true,
                message: resultado.message,
                data: {
                    usuario: resultado.data.usuario,
                    token: resultado.data.sesion.token,
                    sessionId: resultado.data.sesion.sessionId, // Mantener compatibilidad
                    permisos: resultado.data.permisos,
                    expiresIn: resultado.data.sesion.expiresIn
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Middleware para verificar que el usuario sea administrador usando JWT
     */
    static async requireAdmin(req, res, next) {
        try {
            // Obtener token JWT desde headers o cookies
            const token = req.headers['authorization']?.replace('Bearer ', '') || 
                         req.headers['x-session-id'] || 
                         req.cookies?.sessionId;
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No autenticado: Token JWT requerido'
                });
            }

            // Validar token JWT
            const payload = AuthService.validarToken(token);
            if (!payload) {
                return res.status(401).json({
                    success: false,
                    message: 'Token JWT inválido o expirado'
                });
            }

            // Obtener usuario actual
            const usuario = await AuthService.obtenerUsuarioActual(token);
            
            if (!usuario || !AuthService.esAdministrador(usuario)) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado: Se requieren permisos de administrador'
                });
            }
            
            req.user = usuario;
            req.sessionId = token;
            req.jwtPayload = payload;
            next();

        } catch (error) {
            console.error('Error en middleware requireAdmin:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Middleware para verificar permisos específicos usando JWT
     */
    static requirePermission(permiso) {
        return async (req, res, next) => {
            try {
                // Obtener token JWT desde headers o cookies
                const token = req.headers['authorization']?.replace('Bearer ', '') || 
                             req.headers['x-session-id'] || 
                             req.cookies?.sessionId;
                
                if (!token) {
                    return res.status(401).json({
                        success: false,
                        message: 'No autenticado: Token JWT requerido'
                    });
                }

                // Validar token JWT
                const payload = AuthService.validarToken(token);
                if (!payload) {
                    return res.status(401).json({
                        success: false,
                        message: 'Token JWT inválido o expirado'
                    });
                }

                // Obtener usuario actual
                const usuario = await AuthService.obtenerUsuarioActual(token);
                
                if (!usuario || !AuthService.tienePermiso(usuario, permiso)) {
                    return res.status(403).json({
                        success: false,
                        message: `Acceso denegado: Se requiere el permiso '${permiso}'`
                    });
                }
                
                req.user = usuario;
                req.sessionId = token;
                req.jwtPayload = payload;
                next();

            } catch (error) {
                console.error('Error en middleware requirePermission:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }
        };
    }

    /**
     * Middleware para requerir que el usuario sea un paciente
     */
    static async requirePaciente(req, res, next) {
        try {
            // Obtener token JWT desde headers o cookies
            const token = req.headers['authorization']?.replace('Bearer ', '') || 
                         req.headers['x-session-id'] || 
                         req.cookies?.sessionId;
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No autenticado: Token JWT requerido'
                });
            }

            // Validar token JWT
            const payload = AuthService.validarToken(token);
            if (!payload) {
                return res.status(401).json({
                    success: false,
                    message: 'Token JWT inválido o expirado'
                });
            }

            // Obtener usuario completo
            const usuario = await AuthService.obtenerUsuarioActual(token);
            
            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Verificar que sea paciente
            if (usuario.rol?.nombre !== 'paciente') {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado: Solo pacientes pueden acceder a esta página'
                });
            }

            // Agregar información del usuario al request
            req.user = usuario;
            req.token = token;
            req.sessionId = token; // Mantener compatibilidad
            req.payload = payload;
            
            next();

        } catch (error) {
            console.error('Error en middleware requirePaciente:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Middleware para requerir múltiples roles (médicos, empleados, admin)
     */
    static requireMultipleRoles(rolesPermitidos) {
        return async (req, res, next) => {
            try {
                // Obtener token JWT desde headers o cookies
                const token = req.headers['authorization']?.replace('Bearer ', '') || 
                             req.headers['x-session-id'] || 
                             req.cookies?.sessionId;
                
                if (!token) {
                    return res.status(401).json({
                        success: false,
                        message: 'No autenticado: Token JWT requerido'
                    });
                }

                // Validar token JWT
                const payload = AuthService.validarToken(token);
                if (!payload) {
                    return res.status(401).json({
                        success: false,
                        message: 'Token JWT inválido o expirado'
                    });
                }

                // Obtener usuario completo
                const usuario = await AuthService.obtenerUsuarioActual(token);
                
                if (!usuario) {
                    return res.status(401).json({
                        success: false,
                        message: 'Usuario no encontrado'
                    });
                }

                // Verificar que el rol esté en la lista de roles permitidos
                if (!rolesPermitidos.includes(usuario.rol?.nombre)) {
                    return res.status(403).json({
                        success: false,
                        message: `Acceso denegado: Solo ${rolesPermitidos.join(', ')} pueden acceder a esta página`
                    });
                }

                // Agregar información del usuario al request
                req.user = usuario;
                req.token = token;
                req.sessionId = token; // Mantener compatibilidad
                req.payload = payload;
                
                next();

            } catch (error) {
                console.error('Error en middleware requireMultipleRoles:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }
        };
    }

    /**
     * Obtener usuario actual usando JWT
     */
    static async getCurrentUser(req, res) {
        try {
            // Obtener token JWT desde headers o cookies
            const token = req.headers['authorization']?.replace('Bearer ', '') || 
                         req.headers['x-session-id'] || 
                         req.cookies?.sessionId;
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No autenticado: Token JWT requerido'
                });
            }

            // Validar token JWT
            const payload = AuthService.validarToken(token);
            if (!payload) {
                return res.status(401).json({
                    success: false,
                    message: 'Token JWT inválido o expirado'
                });
            }

            // Obtener usuario actual
            const usuario = await AuthService.obtenerUsuarioActual(token);
            
            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    usuario: {
                        id: usuario.id,
                        usuario: usuario.usuario,
                        rol: usuario.rol?.nombre,
                        perfil: usuario.perfil
                    },
                    permisos: usuario.rol?.permisos || [],
                    tokenInfo: {
                        issuedAt: new Date(payload.iat * 1000),
                        expiresAt: new Date(payload.exp * 1000),
                        issuer: payload.iss
                    }
                }
            });

        } catch (error) {
            console.error('Error obteniendo usuario actual:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Logout usando JWT
     */
    static async logout(req, res) {
        try {
            // Obtener token JWT desde headers o cookies
            const token = req.headers['authorization']?.replace('Bearer ', '') || 
                         req.headers['x-session-id'] || 
                         req.cookies?.sessionId;
            
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'No hay token JWT activo'
                });
            }

            // Cerrar sesión (remover de memoria)
            const resultado = AuthService.cerrarSesion(token);
            
            if (!resultado) {
                return res.status(400).json({
                    success: false,
                    message: 'Token no encontrado o inválido'
                });
            }

            // Limpiar cookie si existe
            res.clearCookie('sessionId');

            return res.status(200).json({
                success: true,
                message: 'Logout exitoso',
                note: 'El token JWT seguirá siendo válido hasta su expiración natural. Para invalidación inmediata, considere implementar una blacklist.'
            });

        } catch (error) {
            console.error('Error en logout:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

export default AuthController;