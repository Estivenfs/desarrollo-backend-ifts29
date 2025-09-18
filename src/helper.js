import databaseService from './services/database.service.js';

/**
 * Función para crear un usuario administrador por defecto
 * Usuario: admin
 * Contraseña: admin123
 * Rol: Administrador
 */
export async function crearUsuarioAdmin() {
    try {
        // Verificar si ya existe un usuario "admin"
        try {
            const usuarioExistente = await databaseService.getUsuarioByUsername('admin');
            console.log('El usuario "admin" ya existe:', usuarioExistente.usuario);
            return usuarioExistente;
        } catch (error) {
            // Si no existe, continuamos con la creación
            console.log('Creando usuario administrador...');
        }

        // 1. Crear empleado administrador
        const empleadoAdmin = await databaseService.createEmpleado({
            nombre: 'Administrador del Sistema',
            puesto: 'Administrador'
        });
        console.log('Empleado administrador creado:', empleadoAdmin);

        // 2. Crear perfil de empleado
        const perfilAdmin = await databaseService.createPerfil({
            tipo: 'empleado',
            empleadoId: empleadoAdmin.id,
            pacienteId: null
        });
        console.log('Perfil administrador creado:', perfilAdmin);

        // 3. Crear usuario con rol de admin (rolId: 1)
        const usuarioAdmin = await databaseService.createUsuario({
            usuario: 'admin',
            password: 'admin123',
            rolId: 1, // Rol de administrador
            perfilId: perfilAdmin.id
        });
        console.log('Usuario administrador creado exitosamente:', {
            id: usuarioAdmin.id,
            usuario: usuarioAdmin.usuario,
            rolId: usuarioAdmin.rolId,
            perfilId: usuarioAdmin.perfilId
        });

        return usuarioAdmin;

    } catch (error) {
        console.error('Error al crear usuario administrador:', error.message);
        throw error;
    }
}

/**
 * Función para inicializar datos por defecto del sistema
 * Incluye la creación del usuario administrador
 */
export async function inicializarSistema() {
    try {
        console.log('Inicializando sistema...');
        
        // Crear usuario administrador
        await crearUsuarioAdmin();
        
        console.log('Sistema inicializado correctamente');
        return true;
    } catch (error) {
        console.error('Error al inicializar sistema:', error.message);
        throw error;
    }
}