// profesores.js - Gestión de profesores con Supabase (versión simplificada)
import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Página de profesores cargada');
    
    // Inicializar
    cargarProfesores();
    setupEventListeners();
});

// Configurar eventos
function setupEventListeners() {
    // Formulario de registro/edición
    const form = document.getElementById('formProfesor');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
    
    // Botones
    const btnCancelar = document.getElementById('btnCancelar');
    const btnBuscar = document.getElementById('btnBuscar');
    const btnLimpiar = document.getElementById('btnLimpiar');
    
    if (btnCancelar) btnCancelar.addEventListener('click', cancelarEdicion);
    if (btnBuscar) btnBuscar.addEventListener('click', buscarProfesores);
    if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarBusqueda);
    
    // Buscar con Enter
    const buscarInput = document.getElementById('buscar');
    if (buscarInput) {
        buscarInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarProfesores();
            }
        });
    }
}

// Variables globales
let profesorEditando = null;

// Manejar envío del formulario
async function handleSubmit(e) {
    e.preventDefault();
    
    console.log('📝 Enviando formulario...');
    
    // Validar formulario
    if (!validarFormulario()) {
        return;
    }
    
    // Obtener datos del formulario
    const profesorData = {
        codigo: document.getElementById('codigo').value.trim(),
        nombre: document.getElementById('nombre').value.trim(),
        email: document.getElementById('email').value.trim(),
        especialidad: document.getElementById('especialidad').value.trim(),
        departamento: document.getElementById('departamento').value,
        telefono: document.getElementById('telefono').value.trim(),
        experiencia: parseInt(document.getElementById('experiencia').value)
    };
    
    console.log('Datos del profesor:', profesorData);
    
    const btnGuardar = document.getElementById('btnGuardar');
    const textoOriginal = btnGuardar.textContent;
    
    // Cambiar estado del botón
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';
    
    try {
        if (profesorEditando) {
            // Actualizar profesor existente
            await actualizarProfesor(profesorEditando.id, profesorData);
            mostrarMensaje('✅ Profesor actualizado exitosamente', 'exito');
        } else {
            // Crear nuevo profesor
            await crearProfesor(profesorData);
            mostrarMensaje('✅ Profesor registrado exitosamente', 'exito');
        }
        
        // Limpiar formulario y recargar lista
        limpiarFormulario();
        await cargarProfesores();
        
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarMensaje('❌ Error: ' + error.message, 'error');
    } finally {
        // Restaurar botón
        btnGuardar.disabled = false;
        btnGuardar.textContent = textoOriginal;
    }
}

// Validar formulario
function validarFormulario() {
    const codigo = document.getElementById('codigo').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const experiencia = document.getElementById('experiencia').value;
    
    // Validar código (PROF seguido de números)
    if (!/^PROF\d{1,4}$/i.test(codigo)) {
        mostrarMensaje('❌ El código debe ser PROF seguido de números (ej: PROF001)', 'error');
        return false;
    }
    
    // Validar email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarMensaje('❌ Ingrese un email válido', 'error');
        return false;
    }
    
    // Validar teléfono (9 dígitos)
    if (!/^\d{9}$/.test(telefono)) {
        mostrarMensaje('❌ El teléfono debe tener 9 dígitos', 'error');
        return false;
    }
    
    // Validar experiencia (0-50)
    const expNum = parseInt(experiencia);
    if (isNaN(expNum) || expNum < 0 || expNum > 50) {
        mostrarMensaje('❌ La experiencia debe ser entre 0 y 50 años', 'error');
        return false;
    }
    
    return true;
}

// Crear nuevo profesor
async function crearProfesor(profesorData) {
    console.log('Creando profesor:', profesorData);
    
    const { data, error } = await supabase
        .from('profesores')
        .insert([profesorData])
        .select()
        .single();
    
    if (error) {
        console.error('Error Supabase:', error);
        if (error.code === '23505') {
            if (error.message.includes('profesores_codigo_key')) {
                throw new Error('Ya existe un profesor con este código');
            }
            if (error.message.includes('profesores_email_key')) {
                throw new Error('Ya existe un profesor con este email');
            }
        }
        throw new Error(error.message || 'Error al crear profesor');
    }
    
    return data;
}

// Actualizar profesor existente
async function actualizarProfesor(id, profesorData) {
    console.log('Actualizando profesor ID:', id);
    
    const { data, error } = await supabase
        .from('profesores')
        .update(profesorData)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error Supabase:', error);
        throw new Error(error.message || 'Error al actualizar profesor');
    }
    
    return data;
}

// Cargar lista de profesores
async function cargarProfesores() {
    console.log('📋 Cargando profesores...');
    
    const tbody = document.getElementById('tablaProfesores');
    if (!tbody) {
        console.error('No se encontró tablaProfesores');
        return;
    }
    
    // Mostrar estado de carga
    tbody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 20px;">
                <div style="color: #4a90a4;">Cargando profesores...</div>
            </td>
        </tr>
    `;
    
    try {
        const { data: profesores, error } = await supabase
            .from('profesores')
            .select('*')
            .order('nombre');
        
        if (error) {
            throw new Error(error.message);
        }
        
        console.log('Profesores cargados:', profesores?.length || 0);
        
        if (!profesores || profesores.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px; color: #718096;">
                        No hay profesores registrados
                    </td>
                </tr>
            `;
            return;
        }
        
        // Generar tabla
        tbody.innerHTML = profesores.map(profesor => `
            <tr>
                <td>${profesor.codigo}</td>
                <td>${profesor.nombre}</td>
                <td>${profesor.email}</td>
                <td>${profesor.especialidad}</td>
                <td>${profesor.departamento}</td>
                <td>${profesor.telefono}</td>
                <td>${profesor.experiencia} años</td>
                <td>
                    <button onclick="editarProfesor(${profesor.id})" 
                            style="background: #4299e1; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                        Editar
                    </button>
                    <button onclick="eliminarProfesor(${profesor.id})" 
                            style="background: #f56565; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                        Eliminar
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando profesores:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 20px; color: #e53e3e;">
                    Error al cargar profesores: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Buscar profesores
async function buscarProfesores() {
    const termino = document.getElementById('buscar').value.trim();
    
    if (!termino) {
        await cargarProfesores();
        return;
    }
    
    console.log('🔍 Buscando:', termino);
    
    const tbody = document.getElementById('tablaProfesores');
    tbody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 20px;">
                <div style="color: #4a90a4;">Buscando...</div>
            </td>
        </tr>
    `;
    
    try {
        const { data: profesores, error } = await supabase
            .from('profesores')
            .select('*')
            .or(`nombre.ilike.%${termino}%,codigo.ilike.%${termino}%,especialidad.ilike.%${termino}%,departamento.ilike.%${termino}%`)
            .order('nombre');
        
        if (error) throw error;
        
        if (!profesores || profesores.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px; color: #718096;">
                        No se encontraron profesores con "${termino}"
                    </td>
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
                <td>
                    <button onclick="editarProfesor(${profesor.id})" 
                            style="background: #4299e1; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                        Editar
                    </button>
                    <button onclick="eliminarProfesor(${profesor.id})" 
                            style="background: #f56565; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                        Eliminar
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error buscando:', error);
        mostrarMensaje('❌ Error al buscar: ' + error.message, 'error');
        await cargarProfesores();
    }
}

// Editar profesor
async function editarProfesor(id) {
    console.log('✏️ Editando profesor ID:', id);
    
    try {
        const { data: profesor, error } = await supabase
            .from('profesores')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        if (profesor) {
            profesorEditando = profesor;
            
            // Llenar formulario
            document.getElementById('codigo').value = profesor.codigo;
            document.getElementById('nombre').value = profesor.nombre;
            document.getElementById('email').value = profesor.email;
            document.getElementById('especialidad').value = profesor.especialidad;
            document.getElementById('departamento').value = profesor.departamento;
            document.getElementById('telefono').value = profesor.telefono;
            document.getElementById('experiencia').value = profesor.experiencia;
            
            // Cambiar título y botón
            document.getElementById('form-titulo').textContent = 'Editar Profesor';
            document.getElementById('btnGuardar').textContent = 'Actualizar Profesor';
            
            // Scroll al formulario
            document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
            
            mostrarMensaje(`Editando a ${profesor.nombre}`, 'exito');
        }
        
    } catch (error) {
        console.error('Error cargando profesor:', error);
        mostrarMensaje('❌ Error al cargar profesor: ' + error.message, 'error');
    }
}

// Eliminar profesor
async function eliminarProfesor(id) {
    if (!confirm('¿Está seguro de eliminar este profesor?')) {
        return;
    }
    
    console.log('🗑️ Eliminando profesor ID:', id);
    
    try {
        const { error } = await supabase
            .from('profesores')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        mostrarMensaje('✅ Profesor eliminado exitosamente', 'exito');
        await cargarProfesores();
        
        // Si estábamos editando este profesor, limpiar formulario
        if (profesorEditando && profesorEditando.id === id) {
            cancelarEdicion();
        }
        
    } catch (error) {
        console.error('Error eliminando:', error);
        mostrarMensaje('❌ Error al eliminar: ' + error.message, 'error');
    }
}

// Cancelar edición
function cancelarEdicion() {
    profesorEditando = null;
    limpiarFormulario();
    document.getElementById('form-titulo').textContent = 'Registrar Nuevo Profesor';
    document.getElementById('btnGuardar').textContent = 'Registrar Profesor';
    mostrarMensaje('Edición cancelada', 'exito');
}

// Limpiar formulario
function limpiarFormulario() {
    document.getElementById('formProfesor').reset();
}

// Limpiar búsqueda
function limpiarBusqueda() {
    document.getElementById('buscar').value = '';
    cargarProfesores();
}

// Mostrar mensaje
function mostrarMensaje(texto, tipo) {
    const mensajeDiv = document.getElementById('mensaje');
    if (!mensajeDiv) return;
    
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.style.display = 'block';
    
    setTimeout(() => {
        mensajeDiv.style.display = 'none';
    }, 5000);
}

// Hacer funciones globales para los botones onclick
window.editarProfesor = editarProfesor;
window.eliminarProfesor = eliminarProfesor;