import express from 'express';
import mainRoutes from './src/routes/main.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;

// Obtener __dirname en módulos ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicPath = path.join(__dirname, 'public');

// Configurar middleware
app.use(express.static(publicPath));
app.set('view engine', 'pug');
app.set('views', `${publicPath}/views`);

// Configurar rutas
app.use('/', mainRoutes);

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});

export default app;