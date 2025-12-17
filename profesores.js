// profesores.js - Gestión de profesores con Supabase
import { supabase } from './supabaseClient.js';

class GestorProfesores {
    constructor() {
        this.profesorActual = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.cargarProfesores();
    }

    setupEventListeners() {
        // Formulario
        const form = document.getElementById('formProfesor');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Botones
        document.getElementById('btnCancelar')?.addEventListener('click', () => this.cancelarEdicion());
        document.getElementById('btnBuscar')?.addEventListener('click', () => this.buscarProfesores());
        document.getElementById('btnLimpiar')?.addEventListener('click', () => this.limpiarBusqueda());
        
        // Búsqueda al presionar Enter
        document.getElementById('buscar')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.buscarProfesores();
            }
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validarFormulario()) {
            return;
        }

        const profesor = this.obtenerDatosFormulario();
        
        try {
            const btnGuardar = document.getElementById('btnGuardar');
            const textoOriginal = btnGuardar.textContent;
            
            btnGuardar.disabled = true;
            btnGuardar.textContent = 'Guardando...';
            
            if (this.profesorActual) {
                // Actualizar profesor existente
                await this.actualizarProfesor(profesor);
            } else {
                // Crear nuevo profesor
                await this.crearProfesor(profesor);
            }
            
            btnGuardar.textContent = textoOriginal;
            btnGuardar.disabled = false;
            
        } catch (error) {
            console.error('Error al guardar profesor:', error);
            this.mostrarMensaje('Error al guardar el profesor: ' + error.message, 'error');
        }
    }

    obtenerDatosFormulario() {
        return {
            codigo: document.getElementById('codigo').value,
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            especialidad: document.getElementById('especialidad').value,
            departamento: document.getElementById('departamento').value,
            telefono: document.getElementById('telefono').value,
            experiencia: parseInt(document.getElementById('experiencia').value)
        };
    }

    validarFormulario() {
        const codigo = document.getElementById('codigo').value;
        const email = document.getElementById('email').value;
        const telefono = document.getElementById('telefono').value;
        
        // Validar formato de código
        if (!codigo.match(/^PROF\d{1,2}$/)) {
            this.mostrarMensaje('El código debe tener el formato PROF1, PROF2, etc.', 'error');
            return false;
        }
        
        // Validar email
        if (!email.includes('@')) {
            this.mostrarMensaje('Por favor ingrese un email válido', 'error');
            return false;
        }
        
        // Validar teléfono
        if (!telefono.match(/^\d{9}$/)) {
            this.mostrarMensaje('El teléfono debe tener 9 dígitos', 'error');
            return false;
        }
        
        return true;
    }

    async crearProfesor(profesor) {
        // Verificar si el código ya existe
        const { data: existente, error: errorBusqueda } = await supabase
            .from('profesores')
            .select('codigo')
            .eq('codigo', profesor.codigo)
            .single();
        
        if (existente) {
            throw new Error('Ya existe un profesor con este código');
        }
        
        // Insertar nuevo profesor
        const { data, error } = await supabase
            .from('profesores')
            .insert([profesor]);
        
        if (error) {
            throw new Error(error.message);
        }
        
        this.mostrarMensaje('Profesor registrado exitosamente', 'exito');
        this.limpiarFormulario();
        await this.cargarProfesores();
    }

    async actualizarProfesor(profesor) {
        const { error } = await supabase
            .from('profesores')
            .update(profesor)
            .eq('id', this.profesorActual.id);
        
        if (error) {
            throw new Error(error.message);
        }
        
        this.mostrarMensaje('Profesor actualizado exitosamente', 'exito');
        this.cancelarEdicion();
        await this.cargarProfesores();
    }

    async cargarProfesores() {
        try {
            const { data: profesores, error } = await supabase
                .from('profesores')
                .select('*')
                .order('nombre');
            
            if (error) {
                throw new Error(error.message);
            }
            
            this.mostrarProfesores(profesores || []);
            
        } catch (error) {
            console.error('Error al cargar profesores:', error);
            this.mostrarMensaje('Error al cargar los profesores', 'error');
        }
    }

    async buscarProfesores() {
        const termino = document.getElementById('buscar').value.trim();
        
        if (!termino) {
            await this.cargarProfesores();
            return;
        }
        
        try {
            const { data: profesores, error } = await supabase
                .from('profesores')
                .select('*')
                .or(`nombre.ilike.%${termino}%,codigo.ilike.%${termino}%,especialidad.ilike.%${termino}%`)
                .order('nombre');
            
            if (error) {
                throw new Error(error.message);
            }
            
            this.mostrarProfesores(profesores || []);
            
        } catch (error) {
            console.error('Error al buscar profesores:', error);
            this.mostrarMensaje('Error al buscar profesores', 'error');
        }
    }

    mostrarProfesores(profesores) {
        const tbody = document.getElementById('tablaProfesores');
        
        if (!profesores || profesores.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-message">No hay profesores registrados</td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = profesores.map(profesor => `
            <tr>
                <td>${profesor.codigo}</td>
                <td>${profesor.nombre}</td>
                <td>${profesor.email}</td>
                <td>${profesor.especialidad}</td>
                <td>${profesor.departamento}</td>
                <td>${profesor.telefono}</td>
                <td>${profesor.experiencia} años</td>
                <td class="acciones">
                    <button class="btn-accion btn-editar" onclick="gestorProfesores.editarProfesor(${profesor.id})">Editar</button>
                    <button class="btn-accion btn-eliminar" onclick="gestorProfesores.eliminarProfesor(${profesor.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    editarProfesor(id) {
        this.cargarProfesorParaEditar(id);
    }

    async cargarProfesorParaEditar(id) {
        try {
            const { data: profesor, error } = await supabase
                .from('profesores')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) {
                throw new Error(error.message);
            }
            
            if (profesor) {
                this.profesorActual = profesor;
                this.llenarFormulario(profesor);
                
                document.getElementById('form-titulo').textContent = 'Editar Profesor';
                document.getElementById('btnGuardar').textContent = 'Actualizar Profesor';
                
                // Hacer scroll al formulario
                document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
            }
            
        } catch (error) {
            console.error('Error al cargar profesor:', error);
            this.mostrarMensaje('Error al cargar el profesor', 'error');
        }
    }

    llenarFormulario(profesor) {
        document.getElementById('profesorId').value = profesor.id;
        document.getElementById('codigo').value = profesor.codigo;
        document.getElementById('nombre').value = profesor.nombre;
        document.getElementById('email').value = profesor.email;
        document.getElementById('especialidad').value = profesor.especialidad;
        document.getElementById('departamento').value = profesor.departamento;
        document.getElementById('telefono').value = profesor.telefono;
        document.getElementById('experiencia').value = profesor.experiencia;
    }

    async eliminarProfesor(id) {
        if (!confirm('¿Está seguro de eliminar este profesor?')) {
            return;
        }
        
        try {
            const { error } = await supabase
                .from('profesores')
                .delete()
                .eq('id', id);
            
            if (error) {
                throw new Error(error.message);
            }
            
            this.mostrarMensaje('Profesor eliminado exitosamente', 'exito');
            await this.cargarProfesores();
            
        } catch (error) {
            console.error('Error al eliminar profesor:', error);
            this.mostrarMensaje('Error al eliminar el profesor', 'error');
        }
    }

    cancelarEdicion() {
        this.profesorActual = null;
        this.limpiarFormulario();
        
        document.getElementById('form-titulo').textContent = 'Registrar Nuevo Profesor';
        document.getElementById('btnGuardar').textContent = 'Registrar Profesor';
    }

    limpiarFormulario() {
        document.getElementById('formProfesor').reset();
        document.getElementById('profesorId').value = '';
    }

    limpiarBusqueda() {
        document.getElementById('buscar').value = '';
        this.cargarProfesores();
    }

    mostrarMensaje(texto, tipo) {
        const mensaje = document.getElementById('mensaje');
        mensaje.textContent = texto;
        mensaje.className = `mensaje ${tipo}`;
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            mensaje.className = 'mensaje';
        }, 5000);
    }
}

// Inicializar cuando el DOM esté listo
let gestorProfesores;
document.addEventListener('DOMContentLoaded', () => {
    gestorProfesores = new GestorProfesores();
    window.gestorProfesores = gestorProfesores; // Hacerlo global para los onclick
});