import databaseService from './database.service.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * Servicio de Autenticación
 * Maneja toda la lógica de negocio relacionada con autenticación y autorización
 */
class AuthService {
    constructor() {
        this.databaseService = databaseService;
        this.sesionesActivas = new Map(); // Simulación de sesiones en memoria
        
        // Configuración JWT
        this.jwtSecret = process.env.JWT_SECRET || 'tu-clave-secreta-super-segura-cambiala-en-produccion';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    }

    /**
     * Autentica un usuario con credenciales
     * @param {string} usuario - Nombre de usuario
     * @param {string} password - Contraseña
     * @returns {Object} Resultado de la autenticación
     */
    async autenticarUsuario(usuario, password) {
        try {
            // Paso 1: Buscar usuario por nombre de usuario
            const usuarioEncontrado = await this.databaseService.getUsuarioByUsername(usuario);
            
            if (!usuarioEncontrado) {
                return {
                    success: false,
                    message: 'Credenciales inválidas',
                    code: 'USER_NOT_FOUND'
                };
            }

            // Paso 2: Verificar contraseña usando bcrypt
            const passwordValida = await bcrypt.compare(password, usuarioEncontrado.password);
            if (!passwordValida) {
                return {
                    success: false,
                    message: 'Contraseña incorrecta',
                    code: 'INVALID_PASSWORD'
                };
            }

            // Paso 3: Obtener información completa del usuario
            const usuarioCompleto = await this.databaseService.getUsuarioCompleto(usuarioEncontrado.id);

            // Paso 4: Crear sesión
            const sesion = this.crearSesion(usuarioCompleto);

            return {
                success: true,
                message: 'Autenticación exitosa',
                data: {
                    usuario: usuarioCompleto,
                    sesion: sesion,
                    permisos: usuarioCompleto.rol?.permisos || []
                }
            };

        } catch (error) {
            console.error('Error en autenticación:', error);
            return {
                success: false,
                message: 'Error interno del servidor',
                code: 'INTERNAL_ERROR'
            };
        }
    }

    /**
     * Autentica específicamente un administrador
     * @param {string} usuario - Nombre de usuario
     * @param {string} password - Contraseña
     * @returns {Object} Resultado de la autenticación
     */
    async autenticarAdmin(usuario, password) {
        const resultado = await this.autenticarUsuario(usuario, password);
        
        if (!resultado.success) {
            return resultado;
        }

        // Verificar que el usuario sea administrador
        if (!this.esAdministrador(resultado.data.usuario)) {
            return {
                success: false,
                message: 'Acceso denegado: Se requieren permisos de administrador',
                code: 'INSUFFICIENT_PERMISSIONS'
            };
        }

        return resultado;
    }

    /**
     * Verifica si un usuario es administrador
     * @param {Object} usuario - Objeto usuario completo
     * @returns {boolean} True si es administrador
     */
    esAdministrador(usuario) {
        return usuario.rol && usuario.rol.nombre === 'admin';
    }

    /**
     * Verifica si un usuario tiene un permiso específico
     * @param {Object} usuario - Objeto usuario completo
     * @param {string} permiso - Permiso a verificar
     * @returns {boolean} True si tiene el permiso
     */
    tienePermiso(usuario, permiso) {
        if (!usuario.rol || !usuario.rol.permisos) {
            return false;
        }
        return usuario.rol.permisos.includes(permiso);
    }



    /**
     * Crea una sesión para el usuario usando JWT
     * @param {Object} usuario - Usuario autenticado
     * @returns {Object} Datos de sesión con JWT token
     */
    crearSesion(usuario) {
        // Payload del JWT
        const payload = {
            id: usuario.id,
            usuario: usuario.usuario,
            rol: usuario.rol?.nombre,
            permisos: usuario.rol?.permisos || [],
            iat: Math.floor(Date.now() / 1000) // Issued at
        };

        // Generar JWT token
        const token = jwt.sign(payload, this.jwtSecret, { 
            expiresIn: this.jwtExpiresIn,
            issuer: 'backend-ifts',
            subject: usuario.id.toString()
        });

        // Crear sesión en memoria para tracking (opcional)
        const sesion = {
            id: token,
            usuarioId: usuario.id,
            usuario: usuario.usuario,
            rol: usuario.rol?.nombre,
            permisos: usuario.rol?.permisos || [],
            fechaCreacion: new Date(),
            ultimaActividad: new Date(),
            activa: true
        };

        // Guardar sesión en memoria para tracking
        this.sesionesActivas.set(token, sesion);

        return {
            token: token,
            sessionId: token, // Mantener compatibilidad
            usuario: {
                id: usuario.id,
                usuario: usuario.usuario,
                rol: usuario.rol?.nombre,
                perfil: usuario.perfil
            },
            permisos: usuario.rol?.permisos || [],
            fechaCreacion: sesion.fechaCreacion,
            expiresIn: this.jwtExpiresIn
        };
    }

    /**
     * Valida un JWT token
     * @param {string} token - JWT token a validar
     * @returns {Object|null} Payload del token o null si es inválido
     */
    validarToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            return decoded;
        } catch (error) {
            console.error('Error validando JWT token:', error.message);
            return null;
        }
    }

    /**
     * Obtiene una sesión activa usando JWT
     * @param {string} sessionId - JWT token
     * @returns {Object|null} Datos de sesión o null si no existe
     */
    obtenerSesion(sessionId) {
        // Primero validar el JWT token
        const payload = this.validarToken(sessionId);
        if (!payload) {
            return null;
        }

        // Verificar si la sesión existe en memoria (opcional)
        const sesion = this.sesionesActivas.get(sessionId);
        if (sesion && sesion.activa) {
            // Actualizar última actividad
            sesion.ultimaActividad = new Date();
            return sesion;
        }

        // Si no existe en memoria pero el token es válido, recrear sesión
        const sesionRecreada = {
            id: sessionId,
            usuarioId: payload.id,
            usuario: payload.usuario,
            rol: payload.rol,
            permisos: payload.permisos || [],
            fechaCreacion: new Date(payload.iat * 1000),
            ultimaActividad: new Date(),
            activa: true
        };

        this.sesionesActivas.set(sessionId, sesionRecreada);
        return sesionRecreada;
    }

    /**
     * Cierra una sesión JWT
     * @param {string} sessionId - JWT token
     * @returns {boolean} True si se cerró exitosamente
     */
    cerrarSesion(sessionId) {
        // Validar que el token sea válido antes de cerrarlo
        const payload = this.validarToken(sessionId);
        if (!payload) {
            return false;
        }

        // Remover de sesiones activas en memoria
        const sesion = this.sesionesActivas.get(sessionId);
        if (sesion) {
            sesion.activa = false;
            this.sesionesActivas.delete(sessionId);
        }

        // Nota: Con JWT no podemos "invalidar" el token del lado del servidor
        // sin mantener una blacklist. El token seguirá siendo válido hasta su expiración.
        // Para invalidación inmediata, se necesitaría implementar una blacklist en Redis/DB.
        
        return true;
    }

    /**
     * Obtiene el usuario actual por JWT token
     * @param {string} sessionId - JWT token
     * @returns {Object|null} Usuario completo o null
     */
    async obtenerUsuarioActual(sessionId) {
        // Validar JWT token directamente
        const payload = this.validarToken(sessionId);
        if (!payload) {
            return null;
        }

        try {
            // Obtener usuario completo de la base de datos
            const usuario = await this.databaseService.getUsuarioCompleto(payload.id);
            
            // Verificar que el usuario aún existe y está activo
            if (!usuario) {
                return null;
            }

            return usuario;
        } catch (error) {
            console.error('Error obteniendo usuario actual:', error);
            return null;
        }
    }

    /**
     * Genera un ID de sesión único
     * @returns {string} ID de sesión
     */
    generarSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Limpia sesiones expiradas (llamar periódicamente)
     * @param {number} tiempoExpiracion - Tiempo en milisegundos (default: 24 horas)
     */
    limpiarSesionesExpiradas(tiempoExpiracion = 24 * 60 * 60 * 1000) {
        const ahora = new Date();
        for (const [sessionId, sesion] of this.sesionesActivas) {
            const tiempoInactivo = ahora - sesion.ultimaActividad;
            if (tiempoInactivo > tiempoExpiracion) {
                this.sesionesActivas.delete(sessionId);
            }
        }
    }

    /**
     * Obtiene estadísticas de sesiones activas
     * @returns {Object} Estadísticas
     */
    obtenerEstadisticasSesiones() {
        const sesionesActivas = Array.from(this.sesionesActivas.values())
            .filter(sesion => sesion.activa);

        return {
            total: sesionesActivas.length,
            porRol: sesionesActivas.reduce((acc, sesion) => {
                acc[sesion.rol] = (acc[sesion.rol] || 0) + 1;
                return acc;
            }, {}),
            ultimaHora: sesionesActivas.filter(sesion => 
                (new Date() - sesion.fechaCreacion) < 60 * 60 * 1000
            ).length
        };
    }
}

// Exportar instancia singleton
const authService = new AuthService();
export default authService;