// estudiantes.js - Gestión de estudiantes con Supabase
import { supabase } from './supabaseClient.js';

class GestorEstudiantes {
    constructor() {
        this.estudianteActual = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.cargarEstudiantes();
        this.configurarFechaNacimiento();
    }

    setupEventListeners() {
        // Formulario
        const form = document.getElementById('formEstudiante');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Botones
        document.getElementById('btnCancelar')?.addEventListener('click', () => this.cancelarEdicion());
        document.getElementById('btnBuscar')?.addEventListener('click', () => this.buscarEstudiantes());
        document.getElementById('btnLimpiar')?.addEventListener('click', () => this.limpiarBusqueda());
        
        // Búsqueda al presionar Enter
        document.getElementById('buscar')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.buscarEstudiantes();
            }
        });
    }

    configurarFechaNacimiento() {
        const fechaInput = document.getElementById('fechaNacimiento');
        if (fechaInput) {
            const hoy = new Date();
            const fechaMaxima = new Date();
            fechaMaxima.setFullYear(hoy.getFullYear() - 16); // Mínimo 16 años
            const fechaMinima = new Date();
            fechaMinima.setFullYear(hoy.getFullYear() - 60); // Máximo 60 años
            
            fechaInput.max = fechaMaxima.toISOString().split('T')[0];
            fechaInput.min = fechaMinima.toISOString().split('T')[0];
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validarFormulario()) {
            return;
        }

        const estudiante = this.obtenerDatosFormulario();
        
        try {
            const btnGuardar = document.getElementById('btnGuardar');
            const textoOriginal = btnGuardar.textContent;
            
            btnGuardar.disabled = true;
            btnGuardar.textContent = 'Guardando...';
            
            if (this.estudianteActual) {
                // Actualizar estudiante existente
                await this.actualizarEstudiante(estudiante);
            } else {
                // Crear nuevo estudiante
                await this.crearEstudiante(estudiante);
            }
            
            btnGuardar.textContent = textoOriginal;
            btnGuardar.disabled = false;
            
        } catch (error) {
            console.error('Error al guardar estudiante:', error);
            this.mostrarMensaje('Error al guardar el estudiante: ' + error.message, 'error');
        }
    }

    obtenerDatosFormulario() {
        return {
            codigo: document.getElementById('codigo').value,
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value,
            curso: document.getElementById('curso').value,
            fecha_nacimiento: document.getElementById('fechaNacimiento').value
        };
    }

    validarFormulario() {
        const codigo = document.getElementById('codigo').value;
        const email = document.getElementById('email').value;
        const telefono = document.getElementById('telefono').value;
        const fechaNacimiento = new Date(document.getElementById('fechaNacimiento').value);
        const hoy = new Date();
        
        // Validar formato de código
        if (!codigo.match(/^[A-Z]{2}-[0-9]{2}$/)) {
            this.mostrarMensaje('El código debe tener el formato AB-12 (dos letras, guión, dos números)', 'error');
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
        
        // Validar edad mínima (16 años)
        const edadMinima = new Date();
        edadMinima.setFullYear(hoy.getFullYear() - 16);
        
        if (fechaNacimiento > edadMinima) {
            this.mostrarMensaje('El estudiante debe tener al menos 16 años', 'error');
            return false;
        }
        
        return true;
    }

    async crearEstudiante(estudiante) {
        // Verificar si el código ya existe
        const { data: existente, error: errorBusqueda } = await supabase
            .from('estudiantes')
            .select('codigo')
            .eq('codigo', estudiante.codigo)
            .single();
        
        if (existente) {
            throw new Error('Ya existe un estudiante con este código');
        }
        
        // Insertar nuevo estudiante
        const { data, error } = await supabase
            .from('estudiantes')
            .insert([estudiante]);
        
        if (error) {
            throw new Error(error.message);
        }
        
        this.mostrarMensaje('Estudiante registrado exitosamente', 'exito');
        this.limpiarFormulario();
        await this.cargarEstudiantes();
    }

    async actualizarEstudiante(estudiante) {
        const { error } = await supabase
            .from('estudiantes')
            .update(estudiante)
            .eq('id', this.estudianteActual.id);
        
        if (error) {
            throw new Error(error.message);
        }
        
        this.mostrarMensaje('Estudiante actualizado exitosamente', 'exito');
        this.cancelarEdicion();
        await this.cargarEstudiantes();
    }

    async cargarEstudiantes() {
        try {
            const { data: estudiantes, error } = await supabase
                .from('estudiantes')
                .select('*')
                .order('nombre');
            
            if (error) {
                throw new Error(error.message);
            }
            
            this.mostrarEstudiantes(estudiantes || []);
            
        } catch (error) {
            console.error('Error al cargar estudiantes:', error);
            this.mostrarMensaje('Error al cargar los estudiantes', 'error');
        }
    }

    async buscarEstudiantes() {
        const termino = document.getElementById('buscar').value.trim();
        
        if (!termino) {
            await this.cargarEstudiantes();
            return;
        }
        
        try {
            const { data: estudiantes, error } = await supabase
                .from('estudiantes')
                .select('*')
                .or(`nombre.ilike.%${termino}%,codigo.ilike.%${termino}%,curso.ilike.%${termino}%`)
                .order('nombre');
            
            if (error) {
                throw new Error(error.message);
            }
            
            this.mostrarEstudiantes(estudiantes || []);
            
        } catch (error) {
            console.error('Error al buscar estudiantes:', error);
            this.mostrarMensaje('Error al buscar estudiantes', 'error');
        }
    }

    mostrarEstudiantes(estudiantes) {
        const tbody = document.getElementById('tablaEstudiantes');
        
        if (!estudiantes || estudiantes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-message">No hay estudiantes registrados</td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = estudiantes.map(estudiante => {
            // Formatear fecha de nacimiento
            const fechaNac = estudiante.fecha_nacimiento ? 
                new Date(estudiante.fecha_nacimiento).toLocaleDateString('es-ES') : 
                'No especificada';
            
            return `
                <tr>
                    <td>${estudiante.codigo}</td>
                    <td>${estudiante.nombre}</td>
                    <td>${estudiante.email}</td>
                    <td>${estudiante.curso}</td>
                    <td>${estudiante.telefono}</td>
                    <td>${fechaNac}</td>
                    <td class="acciones">
                        <button class="btn-accion btn-editar" onclick="gestorEstudiantes.editarEstudiante(${estudiante.id})">Editar</button>
                        <button class="btn-accion btn-eliminar" onclick="gestorEstudiantes.eliminarEstudiante(${estudiante.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    editarEstudiante(id) {
        this.cargarEstudianteParaEditar(id);
    }

    async cargarEstudianteParaEditar(id) {
        try {
            const { data: estudiante, error } = await supabase
                .from('estudiantes')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) {
                throw new Error(error.message);
            }
            
            if (estudiante) {
                this.estudianteActual = estudiante;
                this.llenarFormulario(estudiante);
                
                document.getElementById('form-titulo').textContent = 'Editar Estudiante';
                document.getElementById('btnGuardar').textContent = 'Actualizar Estudiante';
                
                // Hacer scroll al formulario
                document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
            }
            
        } catch (error) {
            console.error('Error al cargar estudiante:', error);
            this.mostrarMensaje('Error al cargar el estudiante', 'error');
        }
    }

    llenarFormulario(estudiante) {
        document.getElementById('estudianteId').value = estudiante.id;
        document.getElementById('codigo').value = estudiante.codigo;
        document.getElementById('nombre').value = estudiante.nombre;
        document.getElementById('email').value = estudiante.email;
        document.getElementById('telefono').value = estudiante.telefono;
        document.getElementById('curso').value = estudiante.curso;
        
        if (estudiante.fecha_nacimiento) {
            const fecha = new Date(estudiante.fecha_nacimiento);
            document.getElementById('fechaNacimiento').value = fecha.toISOString().split('T')[0];
        }
    }

    async eliminarEstudiante(id) {
        if (!confirm('¿Está seguro de eliminar este estudiante?')) {
            return;
        }
        
        try {
            const { error } = await supabase
                .from('estudiantes')
                .delete()
                .eq('id', id);
            
            if (error) {
                throw new Error(error.message);
            }
            
            this.mostrarMensaje('Estudiante eliminado exitosamente', 'exito');
            await this.cargarEstudiantes();
            
        } catch (error) {
            console.error('Error al eliminar estudiante:', error);
            this.mostrarMensaje('Error al eliminar el estudiante', 'error');
        }
    }

    cancelarEdicion() {
        this.estudianteActual = null;
        this.limpiarFormulario();
        
        document.getElementById('form-titulo').textContent = 'Registrar Nuevo Estudiante';
        document.getElementById('btnGuardar').textContent = 'Registrar Estudiante';
    }

    limpiarFormulario() {
        document.getElementById('formEstudiante').reset();
        document.getElementById('estudianteId').value = '';
    }

    limpiarBusqueda() {
        document.getElementById('buscar').value = '';
        this.cargarEstudiantes();
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
let gestorEstudiantes;
document.addEventListener('DOMContentLoaded', () => {
    gestorEstudiantes = new GestorEstudiantes();
    window.gestorEstudiantes = gestorEstudiantes; // Hacerlo global para los onclick
});