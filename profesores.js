import { supabase } from './supabaseClient.js';

let profesorEditando = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado');
    setupEventListeners();
    cargarProfesores();
});

function setupEventListeners() {
    console.log('Configurando eventos...');
    
    // Formulario
    const form = document.getElementById('formProfesor');
    if (form) {
        form.addEventListener('submit', handleSubmit);
        console.log('Formulario configurado');
    } else {
        console.error('No se encontró formProfesor');
    }
    
    // Botones
    const btnCancelar = document.getElementById('btnCancelar');
    const btnBuscar = document.getElementById('btnBuscar');
    const btnLimpiar = document.getElementById('btnLimpiar');
    
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarEdicion);
        console.log('Botón cancelar configurado');
    }
    
    if (btnBuscar) {
        btnBuscar.addEventListener('click', buscarProfesores);
        console.log('Botón buscar configurado');
    }
    
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarBusqueda);
        console.log('Botón limpiar configurado');
    }
    
    // Buscar con Enter
    const buscarInput = document.getElementById('buscar');
    if (buscarInput) {
        buscarInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarProfesores();
            }
        });
        console.log('Input búsqueda configurado');
    }
    
    // Hacer funciones globales
    window.editarProfesor = editarProfesor;
    window.eliminarProfesor = eliminarProfesor;
    
    console.log('Todos los eventos configurados');
}

// =========== FUNCIONES PRINCIPALES ===========

async function handleSubmit(e) {
    e.preventDefault();
    console.log('Enviando formulario...');
    
    if (!validarFormulario()) {
        return;
    }
    
    const profesorData = {
        codigo: document.getElementById('codigo').value.trim(),
        nombre: document.getElementById('nombre').value.trim(),
        email: document.getElementById('email').value.trim(),
        especialidad: document.getElementById('especialidad').value.trim(),
        departamento: document.getElementById('departamento').value,
        telefono: document.getElementById('telefono').value.trim(),
        experiencia: parseInt(document.getElementById('experiencia').value)
    };
    
    console.log('Datos:', profesorData);
    
    const btnGuardar = document.getElementById('btnGuardar');
    const textoOriginal = btnGuardar.textContent;
    
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';
    
    try {
        if (profesorEditando) {
            console.log('Actualizando profesor ID:', profesorEditando.id);
            await actualizarProfesor(profesorEditando.id, profesorData);
            mostrarMensaje('Profesor actualizado exitosamente', 'exito');
        } else {
            console.log('Creando nuevo profesor');
            await crearProfesor(profesorData);
            mostrarMensaje('Profesor registrado exitosamente', 'exito');
        }
        
        limpiarFormulario();
        await cargarProfesores();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error: ' + error.message, 'error');
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = textoOriginal;
    }
}

function validarFormulario() {
    const codigo = document.getElementById('codigo').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const experiencia = document.getElementById('experiencia').value;
    
    if (!/^PROF\d{1,4}$/i.test(codigo)) {
        mostrarMensaje('El código debe ser PROF seguido de números (ej: PROF001)', 'error');
        return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarMensaje('Ingrese un email válido', 'error');
        return false;
    }
    
    if (!/^\d{9}$/.test(telefono)) {
        mostrarMensaje('El teléfono debe tener 9 dígitos', 'error');
        return false;
    }
    
    const expNum = parseInt(experiencia);
    if (isNaN(expNum) || expNum < 0 || expNum > 50) {
        mostrarMensaje('La experiencia debe ser entre 0 y 50 años', 'error');
        return false;
    }
    
    return true;
}

async function crearProfesor(profesorData) {
    console.log('Creando profesor en Supabase...');
    
    const { data, error } = await supabase
        .from('profesores')
        .insert([profesorData])
        .select();
    
    console.log('Respuesta Supabase:', { data, error });
    
    if (error) {
        console.error('Error de Supabase:', error);
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

async function actualizarProfesor(id, profesorData) {
    console.log('Actualizando profesor ID:', id);
    
    const { data, error } = await supabase
        .from('profesores')
        .update(profesorData)
        .eq('id', id)
        .select();
    
    console.log('Respuesta actualización:', { data, error });
    
    if (error) {
        throw new Error(error.message || 'Error al actualizar profesor');
    }
    
    return data;
}

async function cargarProfesores() {
    console.log('Cargando profesores...');
    
    const tbody = document.getElementById('tablaProfesores');
    if (!tbody) {
        console.error('No se encontró tablaProfesores');
        return;
    }
    
    // Mostrar loading
    tbody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 40px; color: #4a90a4;">
                <div>Cargando profesores...</div>
            </td>
        </tr>
    `;
    
    try {
        const { data: profesores, error } = await supabase
            .from('profesores')
            .select('*')
            .order('nombre');
        
        console.log('Profesores cargados:', profesores, error);
        
        if (error) {
            throw new Error(error.message);
        }
        
        if (!profesores || profesores.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #718096;">
                        No hay profesores registrados
                    </td>
                </tr>
            `;
            return;
        }
        
        // Generar tabla
        tbody.innerHTML = profesores.map(profesor => `
            <tr>
                <td>${profesor.codigo || ''}</td>
                <td>${profesor.nombre || ''}</td>
                <td>${profesor.email || ''}</td>
                <td>${profesor.especialidad || ''}</td>
                <td>${profesor.departamento || ''}</td>
                <td>${profesor.telefono || ''}</td>
                <td>${profesor.experiencia || 0} años</td>
                <td>
                    <button onclick="editarProfesor(${profesor.id})" 
                            style="background: #4299e1; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px; font-size: 14px;">
                        Editar
                    </button>
                    <button onclick="eliminarProfesor(${profesor.id})" 
                            style="background: #f56565; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        Eliminar
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log(`${profesores.length} profesores mostrados`);
        
    } catch (error) {
        console.error('Error cargando profesores:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #e53e3e;">
                    <div>Error al cargar profesores</div>
                    <div style="font-size: 12px; margin-top: 10px;">${error.message}</div>
                </td>
            </tr>
        `;
    }
}

// =========== BÚSQUEDA ===========

async function buscarProfesores() {
    const termino = document.getElementById('buscar').value.trim();
    console.log('Buscando:', termino);
    
    if (!termino) {
        await cargarProfesores();
        return;
    }
    
    const tbody = document.getElementById('tablaProfesores');
    tbody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 40px; color: #4a90a4;">
                <div>Buscando "${termino}"...</div>
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
                    <td colspan="8" style="text-align: center; padding: 40px; color: #718096;">
                        No se encontraron profesores con "${termino}"
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = profesores.map(profesor => `
            <tr>
                <td>${profesor.codigo || ''}</td>
                <td>${profesor.nombre || ''}</td>
                <td>${profesor.email || ''}</td>
                <td>${profesor.especialidad || ''}</td>
                <td>${profesor.departamento || ''}</td>
                <td>${profesor.telefono || ''}</td>
                <td>${profesor.experiencia || 0} años</td>
                <td>
                    <button onclick="editarProfesor(${profesor.id})" 
                            style="background: #4299e1; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px; font-size: 14px;">
                        Editar
                    </button>
                    <button onclick="eliminarProfesor(${profesor.id})" 
                            style="background: #f56565; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        Eliminar
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error buscando:', error);
        mostrarMensaje('Error al buscar: ' + error.message, 'error');
        await cargarProfesores();
    }
}

// =========== EDICIÓN Y ELIMINACIÓN ===========

async function editarProfesor(id) {
    console.log('Editando profesor ID:', id);
    
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
        mostrarMensaje('Error al cargar profesor: ' + error.message, 'error');
    }
}

async function eliminarProfesor(id) {
    if (!confirm('¿Está seguro de eliminar este profesor?')) {
        return;
    }
    
    console.log('Eliminando profesor ID:', id);
    
    try {
        const { error } = await supabase
            .from('profesores')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        mostrarMensaje('Profesor eliminado exitosamente', 'exito');
        await cargarProfesores();
        
        // Si estábamos editando este profesor, limpiar formulario
        if (profesorEditando && profesorEditando.id === id) {
            cancelarEdicion();
        }
        
    } catch (error) {
        console.error('Error eliminando:', error);
        mostrarMensaje('Error al eliminar: ' + error.message, 'error');
    }
}

// =========== FUNCIONES AUXILIARES ===========

function cancelarEdicion() {
    profesorEditando = null;
    limpiarFormulario();
    document.getElementById('form-titulo').textContent = 'Registrar Nuevo Profesor';
    document.getElementById('btnGuardar').textContent = 'Registrar Profesor';
    mostrarMensaje('Edición cancelada', 'exito');
}

function limpiarFormulario() {
    document.getElementById('formProfesor').reset();
}

function limpiarBusqueda() {
    document.getElementById('buscar').value = '';
    cargarProfesores();
}

function mostrarMensaje(texto, tipo) {
    const mensajeDiv = document.getElementById('mensaje');
    if (!mensajeDiv) {
        console.error('No se encontró elemento mensaje');
        return;
    }
    
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.style.display = 'block';
    
    setTimeout(() => {
        mensajeDiv.style.display = 'none';
    }, 5000);
}

// Test de conexión al cargar
console.log('Probando conexión a Supabase...');
supabase.from('profesores').select('count', { count: 'exact', head: true })
    .then(({ count, error }) => {
        if (error) {
            console.error('Error de conexión:', error);
        } else {
            console.log(`Conexión exitosa. ${count} profesores en la base de datos`);
        }
    });