import { supabase } from './supabaseClient.js';

// Variables globales
let editando = false;

// Cuando la página cargue
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página cargada, conectando a Supabase...');
    cargarEstudiantes();
    configurarFormulario();
    configurarBuscador();
});

// Configurar el formulario
function configurarFormulario() {
    const formulario = document.getElementById('formEstudiante');
    const btnCancelar = document.getElementById('btnCancelar');
    
    formulario.addEventListener('submit', async function(e) {
        e.preventDefault();
        await guardarEstudiante();
    });
    
    btnCancelar.addEventListener('click', function() {
        resetearFormulario();
    });
}

// Configurar el buscador
function configurarBuscador() {
    const inputBuscar = document.getElementById('buscar');
    
    inputBuscar.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarEstudiantes();
        }
    });
}

// Cargar estudiantes desde Supabase
async function cargarEstudiantes() {
    try {
        console.log('Cargando estudiantes desde Supabase...');
        
        const { data: estudiantes, error } = await supabase
            .from('estudiantes')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error de Supabase:', error);
            throw error;
        }
        
        console.log('Estudiantes cargados:', estudiantes);
        mostrarEstudiantes(estudiantes);
        
    } catch (error) {
        console.error('Error al cargar estudiantes:', error);
        mostrarMensaje('Error al cargar los estudiantes: ' + error.message, 'error');
    }
}

// Mostrar estudiantes en la tabla
function mostrarEstudiantes(estudiantes) {
    const tabla = document.getElementById('tablaEstudiantes');
    
    if (!estudiantes || estudiantes.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">
                    No hay estudiantes registrados. ¡Registra el primero!
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    estudiantes.forEach(estudiante => {
        // Formatear fecha para mostrar
        let fechaFormateada = 'No especificada';
        if (estudiante.fecha_nacimiento) {
            const fecha = new Date(estudiante.fecha_nacimiento);
            fechaFormateada = fecha.toLocaleDateString('es-ES');
        }
        
        html += `
            <tr>
                <td><strong>${estudiante.codigo}</strong></td>
                <td>${estudiante.nombre}</td>
                <td>${estudiante.email || 'No especificado'}</td>
                <td>${estudiante.curso || 'No especificado'}</td>
                <td>${estudiante.telefono || 'No especificado'}</td>
                <td>
                    <div class="acciones-botones">
                        <button class="btn-accion btn-editar" onclick="editarEstudiante('${estudiante.id}')">
                            Editar
                        </button>
                        <button class="btn-accion btn-eliminar" onclick="eliminarEstudiante('${estudiante.id}')">
                            Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tabla.innerHTML = html;
}

// Guardar estudiante (Crear o Actualizar)
async function guardarEstudiante() {
    const btnGuardar = document.getElementById('btnGuardar');
    const textoOriginal = btnGuardar.textContent;
    
    // Validar campos obligatorios
    const codigo = document.getElementById('codigo').value.trim();
    const nombre = document.getElementById('nombre').value.trim();
    
    if (!codigo || !nombre) {
        mostrarMensaje('Código y Nombre son campos obligatorios', 'error');
        return;
    }
    
    // Deshabilitar botón
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';
    
    // Obtener datos del formulario
    const estudianteData = {
        codigo: codigo.toUpperCase(),
        nombre: nombre,
        email: document.getElementById('email').value.trim() || null,
        telefono: document.getElementById('telefono').value || null,
        curso: document.getElementById('curso').value || null,
        fecha_nacimiento: document.getElementById('fechaNacimiento').value || null
    };
    
    console.log('Datos a guardar:', estudianteData);
    
    try {
        if (editando) {
            // Actualizar estudiante existente
            const id = document.getElementById('estudianteId').value;
            
            console.log('Actualizando estudiante ID:', id);
            
            const { data, error } = await supabase
                .from('estudiantes')
                .update(estudianteData)
                .eq('id', id);
            
            if (error) throw error;
            
            console.log('Estudiante actualizado:', data);
            mostrarMensaje('✓ Estudiante actualizado correctamente', 'exito');
            
        } else {
            // Crear nuevo estudiante
            console.log('Creando nuevo estudiante...');
            
            const { data, error } = await supabase
                .from('estudiantes')
                .insert([estudianteData])
                .select();
            
            if (error) throw error;
            
            console.log('Estudiante creado:', data);
            mostrarMensaje('✓ Estudiante registrado correctamente', 'exito');
        }
        
        // Recargar la lista y resetear formulario
        resetearFormulario();
        await cargarEstudiantes();
        
    } catch (error) {
        console.error('Error completo:', error);
        
        let mensaje = 'Error al guardar el estudiante';
        
        if (error.code === '23505') {
            mensaje = 'El código de estudiante ya existe';
        } else if (error.message) {
            mensaje = '' + error.message;
        }
        
        mostrarMensaje(mensaje, 'error');
        
    } finally {
        // Restaurar botón
        btnGuardar.disabled = false;
        btnGuardar.textContent = textoOriginal;
    }
}

// Editar estudiante
async function editarEstudiante(id) {
    try {
        console.log('Editando estudiante ID:', id);
        
        const { data: estudiante, error } = await supabase
            .from('estudiantes')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        console.log('Datos del estudiante:', estudiante);
        
        // Llenar formulario con datos del estudiante
        document.getElementById('estudianteId').value = estudiante.id;
        document.getElementById('codigo').value = estudiante.codigo;
        document.getElementById('nombre').value = estudiante.nombre;
        document.getElementById('email').value = estudiante.email || '';
        document.getElementById('telefono').value = estudiante.telefono || '';
        document.getElementById('curso').value = estudiante.curso || '';
        document.getElementById('fechaNacimiento').value = estudiante.fecha_nacimiento || '';
        
        // Cambiar a modo edición
        editando = true;
        document.getElementById('form-titulo').textContent = 'Editar Estudiante';
        document.getElementById('btnGuardar').textContent = 'Actualizar Estudiante';
        document.getElementById('btnCancelar').style.display = 'inline-block';
        document.getElementById('codigo').disabled = true;
        
        // Desplazarse al formulario
        document.getElementById('formEstudiante').scrollIntoView({ 
            behavior: 'smooth' 
        });
        
        mostrarMensaje(`Editando estudiante: ${estudiante.nombre}`, 'exito');
        
    } catch (error) {
        console.error('Error al cargar estudiante:', error);
        mostrarMensaje('❌ Error al cargar los datos del estudiante', 'error');
    }
}

// Eliminar estudiante
async function eliminarEstudiante(id) {
    if (!confirm('¿Estás seguro de eliminar este estudiante?\nEsta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        console.log('Eliminando estudiante ID:', id);
        
        const { error } = await supabase
            .from('estudiantes')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        mostrarMensaje('✓ Estudiante eliminado correctamente', 'exito');
        await cargarEstudiantes();
        
    } catch (error) {
        console.error('Error al eliminar estudiante:', error);
        mostrarMensaje('❌ Error al eliminar el estudiante', 'error');
    }
}

// Buscar estudiantes
async function buscarEstudiantes() {
    const busqueda = document.getElementById('buscar').value.trim();
    
    if (!busqueda) {
        await cargarEstudiantes();
        return;
    }
    
    try {
        console.log('Buscando:', busqueda);
        
        const { data: estudiantes, error } = await supabase
            .from('estudiantes')
            .select('*')
            .or(`nombre.ilike.%${busqueda}%,codigo.ilike.%${busqueda}%,email.ilike.%${busqueda}%`)
            .order('nombre', { ascending: true });
        
        if (error) throw error;
        
        if (estudiantes.length === 0) {
            mostrarMensaje(`No se encontraron estudiantes con: "${busqueda}"`, 'error');
        }
        
        mostrarEstudiantes(estudiantes);
        
    } catch (error) {
        console.error('Error al buscar:', error);
        mostrarMensaje('❌ Error al buscar estudiantes', 'error');
    }
}

// Resetear formulario
function resetearFormulario() {
    document.getElementById('formEstudiante').reset();
    document.getElementById('estudianteId').value = '';
    
    editando = false;
    document.getElementById('form-titulo').textContent = 'Registrar Nuevo Estudiante';
    document.getElementById('btnGuardar').textContent = 'Registrar Estudiante';
    document.getElementById('btnCancelar').style.display = 'none';
    document.getElementById('codigo').disabled = false;
    
    // Enfocar el primer campo
    document.getElementById('codigo').focus();
}

// Mostrar mensajes
function mostrarMensaje(texto, tipo) {
    const mensajeDiv = document.getElementById('mensaje');
    
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.style.display = 'block';
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        mensajeDiv.style.display = 'none';
    }, 5000);
}

// Exportar funciones al scope global para los botones onclick
window.editarEstudiante = editarEstudiante;
window.eliminarEstudiante = eliminarEstudiante;
window.buscarEstudiantes = buscarEstudiantes;