import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseService {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/db.json');
        this.data = null;
    }

    // Cargar datos desde el archivo JSON
    async loadData() {
        try {
            const rawData = await fs.readFile(this.dbPath, 'utf8');
            this.data = JSON.parse(rawData);
            return this.data;
        } catch (error) {
            throw new Error(`Error al cargar la base de datos: ${error.message}`);
        }
    }

    // Guardar datos en el archivo JSON
    async saveData() {
        try {
            await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
            return true;
        } catch (error) {
            throw new Error(`Error al guardar la base de datos: ${error.message}`);
        }
    }

    // Asegurar que los datos estén cargados
    async ensureDataLoaded() {
        if (!this.data) {
            await this.loadData();
        }
    }

    // ==================== OPERACIONES CRUD GENÉRICAS ====================

    // Obtener todos los registros de una tabla
    async getAll(tableName) {
        await this.ensureDataLoaded();
        if (!this.data[tableName]) {
            throw new Error(`La tabla '${tableName}' no existe`);
        }
        return this.data[tableName];
    }

    // Obtener un registro por ID
    async getById(tableName, id) {
        await this.ensureDataLoaded();
        if (!this.data[tableName]) {
            throw new Error(`La tabla '${tableName}' no existe`);
        }
        const record = this.data[tableName].find(item => item.id === parseInt(id));
        if (!record) {
            throw new Error(`Registro con ID ${id} no encontrado en la tabla '${tableName}'`);
        }
        return record;
    }

    // Crear un nuevo registro
    async create(tableName, newRecord) {
        await this.ensureDataLoaded();
        if (!this.data[tableName]) {
            throw new Error(`La tabla '${tableName}' no existe`);
        }

        // Generar nuevo ID
        const maxId = this.data[tableName].length > 0 
            ? Math.max(...this.data[tableName].map(item => item.id))
            : 0;
        
        const recordWithId = {
            id: maxId + 1,
            ...newRecord
        };

        this.data[tableName].push(recordWithId);
        await this.saveData();
        return recordWithId;
    }

    // Actualizar un registro existente
    async update(tableName, id, updatedData) {
        await this.ensureDataLoaded();
        if (!this.data[tableName]) {
            throw new Error(`La tabla '${tableName}' no existe`);
        }

        const index = this.data[tableName].findIndex(item => item.id === parseInt(id));
        if (index === -1) {
            throw new Error(`Registro con ID ${id} no encontrado en la tabla '${tableName}'`);
        }

        // Mantener el ID original y actualizar el resto
        this.data[tableName][index] = {
            ...this.data[tableName][index],
            ...updatedData,
            id: parseInt(id) // Asegurar que el ID no cambie
        };

        await this.saveData();
        return this.data[tableName][index];
    }

    // Eliminar un registro
    async delete(tableName, id) {
        await this.ensureDataLoaded();
        if (!this.data[tableName]) {
            throw new Error(`La tabla '${tableName}' no existe`);
        }

        const index = this.data[tableName].findIndex(item => item.id === parseInt(id));
        if (index === -1) {
            throw new Error(`Registro con ID ${id} no encontrado en la tabla '${tableName}'`);
        }

        const deletedRecord = this.data[tableName].splice(index, 1)[0];
        await this.saveData();
        return deletedRecord;
    }

    // ==================== MÉTODOS ESPECÍFICOS POR ENTIDAD ====================

    // ROLES
    async getAllRoles() {
        return await this.getAll('roles');
    }

    async getRoleById(id) {
        return await this.getById('roles', id);
    }

    async createRole(roleData) {
        const { nombre, permisos } = roleData;
        if (!nombre || !permisos) {
            throw new Error('Nombre y permisos son requeridos para crear un rol');
        }
        return await this.create('roles', { nombre, permisos });
    }

    async updateRole(id, roleData) {
        return await this.update('roles', id, roleData);
    }

    async deleteRole(id) {
        return await this.delete('roles', id);
    }

    // USUARIOS
    async getAllUsuarios() {
        return await this.getAll('usuarios');
    }

    async getUsuarioById(id) {
        return await this.getById('usuarios', id);
    }

    async getUsuarioByUsername(usuario) {
        await this.ensureDataLoaded();
        const user = this.data.usuarios.find(u => u.usuario === usuario);
        if (!user) {
            throw new Error(`Usuario '${usuario}' no encontrado`);
        }
        return user;
    }

    async createUsuario(userData) {
        const { usuario, password, rolId, perfilId, tipoPerfilId } = userData;
        if (!usuario || !password || !rolId || !perfilId) {
            throw new Error('Usuario, password, rolId y perfilId son requeridos');
        }
        
        // Hashear la contraseña antes de guardarla
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        const usuarioData = { 
            usuario, 
            password: hashedPassword, 
            rolId, 
            perfilId 
        };
        
        // Agregar tipoPerfilId si se proporciona
        if (tipoPerfilId) {
            usuarioData.tipoPerfilId = tipoPerfilId;
        }
        
        return await this.create('usuarios', usuarioData);
    }

    async updateUsuario(id, userData) {
        // Si se está actualizando la contraseña, hashearla
        if (userData.password) {
            const saltRounds = 10;
            userData.password = await bcrypt.hash(userData.password, saltRounds);
        }
        
        return await this.update('usuarios', id, userData);
    }

    async deleteUsuario(id) {
        return await this.delete('usuarios', id);
    }

    // PERFILES
    async getAllPerfiles() {
        return await this.getAll('perfiles');
    }

    async getPerfilById(id) {
        return await this.getById('perfiles', id);
    }

    async createPerfil(perfilData) {
        const { tipo, empleadoId, pacienteId } = perfilData;
        if (!tipo) {
            throw new Error('Tipo es requerido para crear un perfil');
        }
        return await this.create('perfiles', { tipo, empleadoId, pacienteId });
    }

    async updatePerfil(id, perfilData) {
        return await this.update('perfiles', id, perfilData);
    }

    async deletePerfil(id) {
        return await this.delete('perfiles', id);
    }

    // EMPLEADOS
    async getAllEmpleados() {
        return await this.getAll('empleados');
    }

    async getEmpleadoById(id) {
        return await this.getById('empleados', id);
    }

    async createEmpleado(empleadoData) {
        const { nombre, puesto } = empleadoData;
        if (!nombre || !puesto) {
            throw new Error('Nombre y puesto son requeridos para crear un empleado');
        }
        return await this.create('empleados', { nombre, puesto });
    }

    async updateEmpleado(id, empleadoData) {
        return await this.update('empleados', id, empleadoData);
    }

    async deleteEmpleado(id) {
        return await this.delete('empleados', id);
    }

    // PACIENTES
    async getAllPacientes() {
        return await this.getAll('pacientes');
    }

    async getPacienteById(id) {
        return await this.getById('pacientes', id);
    }

    async getPacienteByDni(dni) {
        await this.ensureDataLoaded();
        const paciente = this.data.pacientes.find(p => p.dni === dni);
        if (!paciente) {
            throw new Error(`Paciente con DNI '${dni}' no encontrado`);
        }
        return paciente;
    }

    async createPaciente(pacienteData) {
        const { nombre, dni, historiaClinica } = pacienteData;
        if (!nombre || !dni) {
            throw new Error('Nombre y DNI son requeridos para crear un paciente');
        }
        return await this.create('pacientes', { nombre, dni, historiaClinica });
    }

    async updatePaciente(id, pacienteData) {
        return await this.update('pacientes', id, pacienteData);
    }

    async deletePaciente(id) {
        return await this.delete('pacientes', id);
    }

    // INSUMOS
    async getAllInsumos() {
        return await this.getAll('insumos');
    }

    async getInsumoById(id) {
        return await this.getById('insumos', id);
    }

    async createInsumo(insumoData) {
        const { nombre, stock, unidad } = insumoData;
        if (!nombre || stock === undefined || !unidad) {
            throw new Error('Nombre, stock y unidad son requeridos para crear un insumo');
        }
        return await this.create('insumos', { nombre, stock, unidad });
    }

    async updateInsumo(id, insumoData) {
        return await this.update('insumos', id, insumoData);
    }

    async deleteInsumo(id) {
        return await this.delete('insumos', id);
    }

    async updateStockInsumo(id, nuevoStock) {
        return await this.update('insumos', id, { stock: nuevoStock });
    }

    // TAREAS
    async getAllTareas() {
        return await this.getAll('tareas');
    }

    async getTareaById(id) {
        return await this.getById('tareas', id);
    }

    async getTareasByEmpleado(empleadoId) {
        await this.ensureDataLoaded();
        return this.data.tareas.filter(t => t.empleadoId === parseInt(empleadoId));
    }

    async getTareasByPaciente(pacienteId) {
        await this.ensureDataLoaded();
        return this.data.tareas.filter(t => t.pacienteId === parseInt(pacienteId));
    }

    async getTareasByEstado(estado) {
        await this.ensureDataLoaded();
        return this.data.tareas.filter(t => t.estado === estado);
    }

    async createTarea(tareaData) {
        const { descripcion, empleadoId, estado, fecha } = tareaData;
        if (!descripcion || !empleadoId || !estado || !fecha) {
            throw new Error('Descripción, empleadoId, estado y fecha son requeridos para crear una tarea');
        }
        return await this.create('tareas', tareaData);
    }

    async updateTarea(id, tareaData) {
        return await this.update('tareas', id, tareaData);
    }

    async deleteTarea(id) {
        return await this.delete('tareas', id);
    }

    async updateEstadoTarea(id, nuevoEstado) {
        return await this.update('tareas', id, { estado: nuevoEstado });
    }

    // ==================== MÉTODOS DE CONSULTA AVANZADA ====================

    // Obtener usuario completo con rol y perfil
    async getUsuarioCompleto(id) {
        const usuario = await this.getUsuarioById(id);
        const rol = await this.getRoleById(usuario.rolId);
        const perfil = await this.getPerfilById(usuario.perfilId);
        
        let detallesPerfil = {};
        if (perfil.tipo === 'empleado' && perfil.empleadoId) {
            detallesPerfil.empleado = await this.getEmpleadoById(perfil.empleadoId);
        } else if (perfil.tipo === 'paciente' && perfil.pacienteId) {
            detallesPerfil.paciente = await this.getPacienteById(perfil.pacienteId);
        }

        return {
            ...usuario,
            rol,
            perfil: {
                ...perfil,
                ...detallesPerfil
            }
        };
    }

    // Obtener tareas con detalles de empleado y paciente
    async getTareasCompletas() {
        const tareas = await this.getAllTareas();
        const tareasCompletas = [];

        for (const tarea of tareas) {
            const empleado = await this.getEmpleadoById(tarea.empleadoId);
            let paciente = null;
            if (tarea.pacienteId) {
                paciente = await this.getPacienteById(tarea.pacienteId);
            }

            tareasCompletas.push({
                ...tarea,
                empleado,
                paciente
            });
        }

        return tareasCompletas;
    }

    // Obtener estadísticas generales
    async getEstadisticas() {
        await this.ensureDataLoaded();
        
        const tareasPendientes = this.data.tareas.filter(t => t.estado === 'pendiente').length;
        const tareasCompletadas = this.data.tareas.filter(t => t.estado === 'completada').length;
        const insumosConBajoStock = this.data.insumos.filter(i => i.stock < 50).length;

        return {
            totalUsuarios: this.data.usuarios.length,
            totalEmpleados: this.data.empleados.length,
            totalPacientes: this.data.pacientes.length,
            totalInsumos: this.data.insumos.length,
            totalTareas: this.data.tareas.length,
            tareasPendientes,
            tareasCompletadas,
            insumosConBajoStock
        };
    }
}

// Exportar una instancia singleton
const databaseService = new DatabaseService();
export default databaseService;