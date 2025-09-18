import { Router } from 'express';
import loginController from '../controllers/login.controller.js';
import AuthController from '../controllers/auth.controller.js';

const router = Router();

// Ruta principal
router.get('/', loginController.home);

// Ruta para inicio de sesión general
router.post('/login', AuthController.login);

// Ruta para logout
router.post('/logout', AuthController.logout);

// Ruta para obtener usuario actual
router.get('/me', AuthController.getCurrentUser);

// Ruta para página home de administradores (requiere permisos de admin)
router.get('/admin/home', AuthController.requireAdmin, (req, res) => {
    res.render('admin-home', {
        title: 'Panel de Administración',
        usuario: req.user,
        permisos: req.user.rol?.permisos || []
    });
});

// Ruta para página home de médicos (requiere permiso específico de médico)
router.get('/medico/home', AuthController.requirePermission('acceso_medico'), (req, res) => {
    res.render('medico-home', {
        title: 'Panel Médico',
        usuario: req.user,
        pacientes: req.user.perfil?.empleado || null
    });
});

// Ruta para página home de pacientes (requiere ser paciente)
router.get('/paciente/home', AuthController.requirePaciente, (req, res) => {
    res.render('paciente-home', {
        title: 'Mi Portal de Paciente',
        usuario: req.user,
        paciente: req.user.perfil?.paciente || null,
        historiaClinica: req.user.perfil?.paciente?.historiaClinica || 'Sin información disponible'
    });
});

// Ruta para página de insumos (accesible por médicos, empleados y admin)
router.get('/insumos', AuthController.requireMultipleRoles(['admin', 'medico', 'empleado']), async (req, res) => {
    try {
        // Obtener lista de insumos desde la base de datos
        const databaseService = (await import('../services/database.service.js')).default;
        const insumos = await databaseService.getAllInsumos();
        
        res.render('insumos', {
            title: 'Gestión de Insumos',
            usuario: req.user,
            insumos: insumos || [],
            puedeEditar: ['admin', 'empleado'].includes(req.user.rol?.nombre)
        });
    } catch (error) {
        console.error('Error al cargar insumos:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error al cargar la página de insumos'
        });
    }
});

export default router;
