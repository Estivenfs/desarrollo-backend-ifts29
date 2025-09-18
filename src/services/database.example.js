import DatabaseService from './database.service.js';
import AuthService from './auth.service.js';

// ===== EJEMPLO DE LOGIN DE ADMINISTRADOR CON AUTH SERVICE =====

/**
 * Ejemplo de cómo hacer login de administrador usando el AuthService
 */
async function ejemploLoginAdmin() {
    console.log('\n🔐 === EJEMPLO DE LOGIN DE ADMINISTRADOR (CON AUTH SERVICE) ===');
    
    // Credenciales del administrador (desde tu db.json)
    const credenciales = {
        usuario: 'cperez',        // Usuario administrador
        password: 'hashed_password' // Contraseña (en producción sería hasheada)
    };
    
    try {
        console.log('🚀 Usando AuthService para autenticación...');
        
        // Usar el servicio de autenticación para login de admin
        const resultado = await AuthService.autenticarAdmin(credenciales.usuario, credenciales.password);
        
        if (!resultado.success) {
            console.error('❌ Error en autenticación:', resultado.message);
            return resultado;
        }
        
        console.log('✅ LOGIN DE ADMINISTRADOR EXITOSO!');
        console.log('\n📋 Datos de sesión:');
        console.log('   🆔 Session ID:', resultado.data.sesion.sessionId);
        console.log('   👤 Usuario:', resultado.data.usuario.usuario);
        console.log('   🎭 Rol:', resultado.data.usuario.rol);
        console.log('   🏢 Perfil:', resultado.data.usuario.perfil?.tipo);
        if (resultado.data.usuario.perfil?.empleado) {
            console.log('   👨‍💼 Empleado:', resultado.data.usuario.perfil.empleado.nombre);
            console.log('   💼 Puesto:', resultado.data.usuario.perfil.empleado.puesto);
        }
        console.log('   🔐 Permisos:', resultado.data.permisos.join(', '));
        console.log('   ⏰ Fecha de login:', resultado.data.sesion.fechaCreacion);
        
        console.log('\n🎯 Operaciones disponibles para este administrador:');
        console.log('   • Gestionar usuarios (crear, editar, eliminar)');
        console.log('   • Gestionar tareas (asignar, modificar, completar)');
        console.log('   • Gestionar insumos (controlar stock, agregar)');
        console.log('   • Ver información de pacientes');
        console.log('   • Ver estadísticas del sistema');
        
        // Demostrar verificación de permisos
        console.log('\n🔍 Verificando permisos específicos:');
        const permisos = ['gestionar_usuarios', 'gestionar_tareas', 'ver_pacientes'];
        permisos.forEach(permiso => {
            const tienePermiso = AuthService.tienePermiso(resultado.data.usuario, permiso);
            console.log(`   ${tienePermiso ? '✅' : '❌'} ${permiso}: ${tienePermiso ? 'SÍ' : 'NO'}`);
        });
        
        return resultado;
        
    } catch (error) {
        console.error('❌ Error en login de administrador:', error.message);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Ejemplo de logout de administrador usando AuthService
 */
async function ejemploLogoutAdmin(sessionId) {
    console.log('\n🚪 === EJEMPLO DE LOGOUT DE ADMINISTRADOR (CON AUTH SERVICE) ===');
    
    try {
        console.log('🔓 Cerrando sesión usando AuthService...');
        console.log('   📋 Session ID:', sessionId);
        
        // Usar el servicio de autenticación para cerrar sesión
        const resultado = AuthService.cerrarSesion(sessionId);
        
        if (resultado) {
            console.log('✅ Sesión cerrada exitosamente');
            console.log('🔒 Sesión invalidada en el servidor');
            
            return {
                success: true,
                message: 'Logout exitoso'
            };
        } else {
            console.log('❌ No se pudo cerrar la sesión (sesión no encontrada)');
            return {
                success: false,
                message: 'Sesión no encontrada'
            };
        }
        
    } catch (error) {
        console.error('❌ Error en logout:', error.message);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Ejemplo de verificación de permisos usando AuthService
 */
async function verificarPermisoAdmin(sessionId, permisoRequerido) {
    console.log(`\n🔍 === VERIFICANDO PERMISO: ${permisoRequerido} (CON AUTH SERVICE) ===`);
    
    try {
        // Obtener usuario actual por sesión
        const usuario = await AuthService.obtenerUsuarioActual(sessionId);
        
        if (!usuario) {
            console.log('❌ Sesión inválida o expirada');
            return false;
        }
        
        // Verificar que sea administrador
        if (!AuthService.esAdministrador(usuario)) {
            console.log('❌ El usuario no es administrador');
            return false;
        }
        
        // Verificar permiso específico
        if (!AuthService.tienePermiso(usuario, permisoRequerido)) {
            console.log(`❌ El administrador no tiene el permiso: ${permisoRequerido}`);
            return false;
        }
        
        console.log(`✅ El administrador tiene el permiso: ${permisoRequerido}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error verificando permisos:', error.message);
        return false;
    }
}

// Ejemplo de uso del servicio de base de datos
async function ejemploDeUso() {
    try {
        console.log('=== EJEMPLO DE USO DEL DATABASE SERVICE ===\n');

        // 1. Obtener todos los usuarios
        console.log('1. Obteniendo todos los usuarios:');
        const usuarios = await databaseService.getAllUsuarios();
        console.log(usuarios);
        console.log('\n');

        // 2. Obtener un usuario específico
        console.log('2. Obteniendo usuario con ID 1:');
        const usuario = await databaseService.getUsuarioById(1);
        console.log(usuario);
        console.log('\n');

        // 3. Crear un nuevo empleado
        console.log('3. Creando un nuevo empleado:');
        const nuevoEmpleado = await databaseService.createEmpleado({
            nombre: 'Ana García',
            puesto: 'Recepcionista'
        });
        console.log('Empleado creado:', nuevoEmpleado);
        console.log('\n');

        // 4. Actualizar el empleado recién creado
        console.log('4. Actualizando el empleado:');
        const empleadoActualizado = await databaseService.updateEmpleado(nuevoEmpleado.id, {
            puesto: 'Coordinadora de Recepción'
        });
        console.log('Empleado actualizado:', empleadoActualizado);
        console.log('\n');

        // 5. Obtener tareas por estado
        console.log('5. Obteniendo tareas pendientes:');
        const tareasPendientes = await databaseService.getTareasByEstado('pendiente');
        console.log(tareasPendientes);
        console.log('\n');

        // 6. Crear una nueva tarea
        console.log('6. Creando una nueva tarea:');
        const nuevaTarea = await databaseService.createTarea({
            descripcion: 'Revisión médica general',
            empleadoId: 3,
            pacienteId: 2,
            estado: 'pendiente',
            fecha: '2025-09-20'
        });
        console.log('Tarea creada:', nuevaTarea);
        console.log('\n');

        // 7. Obtener usuario completo con detalles
        console.log('7. Obteniendo usuario completo con detalles:');
        const usuarioCompleto = await databaseService.getUsuarioCompleto(1);
        console.log(usuarioCompleto);
        console.log('\n');

        // 8. Obtener estadísticas
        console.log('8. Obteniendo estadísticas generales:');
        const estadisticas = await databaseService.getEstadisticas();
        console.log(estadisticas);
        console.log('\n');

        // 9. Actualizar stock de insumo
        console.log('9. Actualizando stock de insumo:');
        const insumoActualizado = await databaseService.updateStockInsumo(1, 180);
        console.log('Stock actualizado:', insumoActualizado);
        console.log('\n');

        // 10. Buscar paciente por DNI
        console.log('10. Buscando paciente por DNI:');
        const pacientePorDni = await databaseService.getPacienteByDni('30123456');
        console.log(pacientePorDni);
        console.log('\n');

        console.log('=== EJEMPLO COMPLETADO EXITOSAMENTE ===');

    } catch (error) {
        console.error('Error en el ejemplo:', error.message);
    }
}

// ==================== EJEMPLO COMPLETO DE FLUJO DE LOGIN ====================
/**
 * Ejemplo completo de flujo de login de administrador con AuthService
 */
async function ejemploCompletoLoginAdmin() {
    console.log('\n🚀 === FLUJO COMPLETO DE LOGIN DE ADMINISTRADOR (CON AUTH SERVICE) ===\n');
    
    const databaseService = new DatabaseService();
    let sessionId = null;
    
    try {
        // 1. Login
        console.log('📋 PASO 1: LOGIN DE ADMINISTRADOR');
        const resultadoLogin = await ejemploLoginAdmin();
        
        if (!resultadoLogin.success) {
            console.log('❌ Login fallido, terminando flujo');
            return resultadoLogin;
        }
        
        sessionId = resultadoLogin.data.sesion.sessionId;
        console.log('✅ Login exitoso, continuando con operaciones...\n');
        
        // 2. Verificar permisos específicos
        console.log('📋 PASO 2: VERIFICACIÓN DE PERMISOS');
        const permisos = ['gestionar_usuarios', 'gestionar_tareas', 'gestionar_insumos'];
        
        for (const permiso of permisos) {
            const tienePermiso = await verificarPermisoAdmin(sessionId, permiso);
            console.log(`   ${tienePermiso ? '✅' : '❌'} ${permiso}: ${tienePermiso ? 'CONCEDIDO' : 'DENEGADO'}`);
        }
        console.log('');
        
        // 3. Verificar que la sesión sigue activa
        console.log('📋 PASO 3: VERIFICACIÓN DE SESIÓN ACTIVA');
        const sesionActiva = AuthService.obtenerSesion(sessionId);
        if (sesionActiva) {
            console.log('✅ Sesión activa confirmada');
            console.log(`   🕐 Última actividad: ${sesionActiva.ultimaActividad}`);
        } else {
            console.log('❌ Sesión no encontrada o expirada');
            return { success: false, message: 'Sesión expirada' };
        }
        console.log('');
        
        // 4. Realizar operaciones administrativas
        console.log('📋 PASO 4: OPERACIONES ADMINISTRATIVAS');
        
        // Crear un nuevo empleado
        console.log('👨‍💼 Creando nuevo empleado...');
        const nuevoEmpleado = await databaseService.createEmpleado({
            nombre: 'Ana García',
            puesto: 'Enfermera',
            telefono: '555-0123',
            email: 'ana.garcia@hospital.com',
            fechaIngreso: new Date().toISOString().split('T')[0]
        });
        console.log('✅ Empleado creado:', nuevoEmpleado.nombre);
        
        // Crear un nuevo usuario para el empleado
        console.log('👤 Creando usuario para el empleado...');
        const nuevoUsuario = await databaseService.createUsuario({
            usuario: 'agarcia',
            password: 'hashed_password',
            rolId: 2, // Rol de empleado
            perfilId: nuevoEmpleado.id,
            tipoPerfilId: 2 // Tipo empleado
        });
        console.log('✅ Usuario creado:', nuevoUsuario.usuario);
        
        // Actualizar stock de un insumo
        console.log('📦 Actualizando stock de insumos...');
        const insumos = await databaseService.getAllInsumos();
        if (insumos.length > 0) {
            const insumoActualizar = insumos[0];
            const stockAnterior = insumoActualizar.stock;
            const nuevoStock = stockAnterior + 50;
            
            await databaseService.updateInsumo(insumoActualizar.id, {
                stock: nuevoStock
            });
            console.log(`✅ Stock actualizado: ${insumoActualizar.nombre} (${stockAnterior} → ${nuevoStock})`);
        }
        
        // Ver estadísticas actualizadas
        console.log('📊 Obteniendo estadísticas del sistema...');
        const estadisticas = await databaseService.getEstadisticas();
        console.log('✅ Estadísticas obtenidas:');
        console.log(`   👥 Usuarios: ${estadisticas.usuarios}`);
        console.log(`   👨‍💼 Empleados: ${estadisticas.empleados}`);
        console.log(`   🏥 Pacientes: ${estadisticas.pacientes}`);
        console.log(`   📦 Insumos: ${estadisticas.insumos}`);
        console.log(`   📋 Tareas: ${estadisticas.tareas}`);
        
        // Ver estadísticas de sesiones
        console.log('📈 Estadísticas de sesiones activas:');
        const estadisticasSesiones = AuthService.obtenerEstadisticasSesiones();
        console.log(`   🔐 Sesiones activas: ${estadisticasSesiones.total}`);
        console.log(`   👥 Por rol:`, estadisticasSesiones.porRol);
        console.log(`   🕐 Última hora: ${estadisticasSesiones.ultimaHora}`);
        console.log('');
        
        // 5. Logout
        console.log('📋 PASO 5: LOGOUT');
        const resultadoLogout = await ejemploLogoutAdmin(sessionId);
        console.log(`${resultadoLogout.success ? '✅' : '❌'} ${resultadoLogout.message}`);
        
        console.log('\n🎉 === FLUJO COMPLETO TERMINADO EXITOSAMENTE ===');
        
        return {
            success: true,
            message: 'Flujo completo de administrador ejecutado exitosamente',
            operaciones: {
                login: true,
                verificacionPermisos: true,
                verificacionSesion: true,
                creacionEmpleado: true,
                creacionUsuario: true,
                actualizacionStock: true,
                estadisticas: true,
                estadisticasSesiones: true,
                logout: true
            }
        };
        
    } catch (error) {
        console.error('❌ Error en flujo completo:', error.message);
        
        // Intentar cerrar sesión en caso de error
        if (sessionId) {
            console.log('🔄 Intentando cerrar sesión debido al error...');
            AuthService.cerrarSesion(sessionId);
        }
        
        return {
            success: false,
            message: `Error en flujo completo: ${error.message}`
        };
    }
}

// Ejecutar el ejemplo si este archivo se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    // Puedes cambiar qué ejemplo ejecutar:
    // ejemploDeUso();           // Ejemplo general
    // ejemploLoginAdmin();      // Solo login
    ejemploCompletoLoginAdmin(); // Flujo completo de login
}

export { 
    ejemploDeUso, 
    ejemploLoginAdmin, 
    ejemploLogoutAdmin, 
    verificarPermisoAdmin, 
    ejemploCompletoLoginAdmin 
};