// cursos.js - Gestión de cursos con Supabase
import { supabase } from './supabaseClient.js';

class GestorCursos {
    constructor() {
        this.cursoActual = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.cargarCursos();
    }

    setupEventListeners() {
        // Formulario
        const form = document.getElementById('formCurso');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Botones
        document.getElementById('btnCancelar')?.addEventListener('click', () => this.cancelarEdicion());
        document.getElementById('btnBuscar')?.addEventListener('click', () => this.buscarCursos());
        document.getElementById('btnLimpiar')?.addEventListener('click', () => this.limpiarBusqueda());
        
        // Búsqueda al presionar Enter
        document.getElementById('buscar')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.buscarCursos();
            }
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validarFormulario()) {
            return;
        }

        const curso = this.obtenerDatosFormulario();
        
        try {
            const btnGuardar = document.getElementById('btnGuardar');
            const textoOriginal = btnGuardar.textContent;
            
            btnGuardar.disabled = true;
            btnGuardar.textContent = 'Guardando...';
            
            if (this.cursoActual) {
                // Actualizar curso existente
                await this.actualizarCurso(curso);
            } else {
                // Crear nuevo curso
                await this.crearCurso(curso);
            }
            
            btnGuardar.textContent = textoOriginal;
            btnGuardar.disabled = false;
            
        } catch (error) {
            console.error('Error al guardar curso:', error);
            this.mostrarMensaje('Error al guardar el curso: ' + error.message, 'error');
        }
    }

    obtenerDatosFormulario() {
        const curso = {
            codigo: document.getElementById('codigo').value,
            nombre: document.getElementById('nombre').value,
            profesor: document.getElementById('profesor').value,
            horario: document.getElementById('horario').value,
            creditos: parseInt(document.getElementById('creditos').value),
            descripcion: document.getElementById('descripcion').value
        };
        
        // Añadir timestamps
        const now = new Date().toISOString();
        if (!this.cursoActual) {
            curso.created_at = now;
        }
        curso.updated_at = now;
        
        return curso;
    }

    validarFormulario() {
        const codigo = document.getElementById('codigo').value;
        const creditos = document.getElementById('creditos').value;
        
        // Validar formato de código
        if (!codigo.match(/^[A-Z]{2}-[0-9]{2}$/)) {
            this.mostrarMensaje('El código debe tener el formato II-51, II-52, etc.', 'error');
            return false;
        }
        
        // Validar créditos
        if (creditos < 1 || creditos > 10) {
            this.mostrarMensaje('Los créditos deben estar entre 1 y 10', 'error');
            return false;
        }
        
        return true;
    }

    async crearCurso(curso) {
        // Verificar si el código ya existe
        const { data: existente, error: errorBusqueda } = await supabase
            .from('cursos')
            .select('codigo')
            .eq('codigo', curso.codigo)
            .single();
        
        if (existente) {
            throw new Error('Ya existe un curso con este código');
        }
        
        // Insertar nuevo curso
        const { data, error } = await supabase
            .from('cursos')
            .insert([curso]);
        
        if (error) {
            throw new Error(error.message);
        }
        
        this.mostrarMensaje('Curso registrado exitosamente', 'exito');
        this.limpiarFormulario();
        await this.cargarCursos();
    }

    async actualizarCurso(curso) {
        // Eliminar created_at para no sobreescribirlo
        delete curso.created_at;
        
        const { error } = await supabase
            .from('cursos')
            .update(curso)
            .eq('id', this.cursoActual.id);
        
        if (error) {
            throw new Error(error.message);
        }
        
        this.mostrarMensaje('Curso actualizado exitosamente', 'exito');
        this.cancelarEdicion();
        await this.cargarCursos();
    }

    async cargarCursos() {
        try {
            const { data: cursos, error } = await supabase
                .from('cursos')
                .select('*')
                .order('codigo');
            
            if (error) {
                throw new Error(error.message);
            }
            
            this.mostrarCursos(cursos || []);
            
        } catch (error) {
            console.error('Error al cargar cursos:', error);
            this.mostrarMensaje('Error al cargar los cursos', 'error');
        }
    }

    async buscarCursos() {
        const termino = document.getElementById('buscar').value.trim();
        
        if (!termino) {
            await this.cargarCursos();
            return;
        }
        
        try {
            const { data: cursos, error } = await supabase
                .from('cursos')
                .select('*')
                .or(`nombre.ilike.%${termino}%,codigo.ilike.%${termino}%,profesor.ilike.%${termino}%`)
                .order('codigo');
            
            if (error) {
                throw new Error(error.message);
            }
            
            this.mostrarCursos(cursos || []);
            
        } catch (error) {
            console.error('Error al buscar cursos:', error);
            this.mostrarMensaje('Error al buscar cursos', 'error');
        }
    }

    mostrarCursos(cursos) {
        const tbody = document.getElementById('tablaCursos');
        
        if (!cursos || cursos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-message">No hay cursos registrados</td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = cursos.map(curso => {
            // Truncar descripción si es muy larga
            const descripcionCorta = curso.descripcion && curso.descripcion.length > 50 
                ? curso.descripcion.substring(0, 50) + '...' 
                : curso.descripcion || 'Sin descripción';
            
            return `
                <tr>
                    <td>${curso.codigo}</td>
                    <td>${curso.nombre}</td>
                    <td>${curso.profesor}</td>
                    <td>${curso.horario}</td>
                    <td>${curso.creditos}</td>
                    <td title="${curso.descripcion || ''}">${descripcionCorta}</td>
                    <td class="acciones">
                        <button class="btn-accion btn-editar" onclick="gestorCursos.editarCurso(${curso.id})">Editar</button>
                        <button class="btn-accion btn-eliminar" onclick="gestorCursos.eliminarCurso(${curso.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    editarCurso(id) {
        this.cargarCursoParaEditar(id);
    }

    async cargarCursoParaEditar(id) {
        try {
            const { data: curso, error } = await supabase
                .from('cursos')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) {
                throw new Error(error.message);
            }
            
            if (curso) {
                this.cursoActual = curso;
                this.llenarFormulario(curso);
                
                document.getElementById('form-titulo').textContent = 'Editar Curso';
                document.getElementById('btnGuardar').textContent = 'Actualizar Curso';
                
                // Hacer scroll al formulario
                document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
            }
            
        } catch (error) {
            console.error('Error al cargar curso:', error);
            this.mostrarMensaje('Error al cargar el curso', 'error');
        }
    }

    llenarFormulario(curso) {
        document.getElementById('cursoId').value = curso.id;
        document.getElementById('codigo').value = curso.codigo;
        document.getElementById('nombre').value = curso.nombre;
        document.getElementById('profesor').value = curso.profesor;
        document.getElementById('horario').value = curso.horario;
        document.getElementById('creditos').value = curso.creditos;
        document.getElementById('descripcion').value = curso.descripcion || '';
    }

    async eliminarCurso(id) {
        if (!confirm('¿Está seguro de eliminar este curso?')) {
            return;
        }
        
        try {
            const { error } = await supabase
                .from('cursos')
                .delete()
                .eq('id', id);
            
            if (error) {
                throw new Error(error.message);
            }
            
            this.mostrarMensaje('Curso eliminado exitosamente', 'exito');
            await this.cargarCursos();
            
        } catch (error) {
            console.error('Error al eliminar curso:', error);
            this.mostrarMensaje('Error al eliminar el curso', 'error');
        }
    }

    cancelarEdicion() {
        this.cursoActual = null;
        this.limpiarFormulario();
        
        document.getElementById('form-titulo').textContent = 'Registrar Nuevo Curso';
        document.getElementById('btnGuardar').textContent = 'Registrar Curso';
    }

    limpiarFormulario() {
        document.getElementById('formCurso').reset();
        document.getElementById('cursoId').value = '';
    }

    limpiarBusqueda() {
        document.getElementById('buscar').value = '';
        this.cargarCursos();
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


let gestorCursos;
document.addEventListener('DOMContentLoaded', () => {
    gestorCursos = new GestorCursos();
    window.gestorCursos = gestorCursos; 
});