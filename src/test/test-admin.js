import { crearUsuarioAdmin } from '../helper.js';

// Probar la función de crear usuario administrador
async function probarCreacionAdmin() {
    try {
        console.log('=== Probando creación de usuario administrador ===');
        const resultado = await crearUsuarioAdmin();
        console.log('Resultado:', resultado);
        console.log('=== Prueba completada exitosamente ===');
    } catch (error) {
        console.error('Error en la prueba:', error.message);
    }
}

probarCreacionAdmin();