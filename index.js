import app from './app.js';
import { inicializarSistema } from './src/helper.js';

const port = process.env.PORT || 3000;

app.listen(port, async () => {
    console.log(`App running at http://localhost:${port}`);
    
    // Inicializar sistema (crear usuario admin si no existe)
    try {
        await inicializarSistema();
        console.log('Sistema inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar sistema:', error.message);
    }
});
