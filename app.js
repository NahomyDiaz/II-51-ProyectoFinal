import { supabase } from "./supabaseClient.js";

HEAD
async function cargarEstudiantes() {
    try {
        let { data: estudiantes, error } = await supabase
            .from("estudiantes")
            .select("*");
            
        if (error) {
            console.error("Error al cargar estudiantes:", error);
            return;
        }
        
        console.log("Estudiantes cargados:", estudiantes);
        
        let listaEstudiantes = document.getElementById("lista-estudiantes");
        if (!listaEstudiantes) {
            console.error("No se encontró el elemento lista-estudiantes");
            return;
        }
        
        listaEstudiantes.innerHTML = "";
        
        estudiantes.forEach(estudiante => {
            let li = document.createElement("li");
            li.textContent = `${estudiante.nombre} (${estudiante.codigo})`;
            listaEstudiantes.appendChild(li);
        });
        
    } catch (error) {
        console.error("Error inesperado:", error);
    }
}

// Llamar la función cuando se cargue la página
document.addEventListener('DOMContentLoaded', cargarEstudiantes);
document.getElementById('formEstudiante').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const boton = document.getElementById('btnRegistrar');
    const textoOriginal = boton.textContent;
    boton.textContent = 'Registrando...';
    boton.disabled = true;
    
    const estudianteData = {
        codigo: document.getElementById('codigo').value,
        nombre: document.getElementById('nombre').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        curso: document.getElementById('curso').value,
        fecha_nacimiento: document.getElementById('fechaNacimiento').value
    };
    
    try {
        const { data, error } = await supabase
            .from('estudiantes')
            .insert([estudianteData]);
        
        if (error) throw error;
        
        mostrarMensaje('Estudiante registrado con éxito!', 'exito');
        this.reset();
        
    } catch (error) {
        console.error('Error:', error);
        let mensajeError = 'Error al registrar estudiante';
        
        if (error.code === '23505') {
            mensajeError = 'El código de estudiante ya existe';
        } else if (error.code === '42501') {
            mensajeError = 'Error de permisos. Verifica las políticas RLS en Supabase';
        }
        
        mostrarMensaje(mensajeError, 'error');
    } finally {
        boton.textContent = textoOriginal;
        boton.disabled = false;
    }
});

function mostrarMensaje(mensaje, tipo) {
    const divMensaje = document.getElementById('mensaje');
    divMensaje.textContent = mensaje;
    divMensaje.className = 'mensaje ' + tipo;
    divMensaje.style.display = 'block';
    
    setTimeout(() => {
        divMensaje.style.display = 'none';
    }, 5000);
}
document.addEventListener('DOMContentLoaded', function() {
    const fechaInput = document.getElementById('fechaNacimiento');
    const hoy = new Date();
    const fechaMinima = new Date();
    fechaMinima.setFullYear(hoy.getFullYear() - 60);
    const fechaMaxima = new Date();
    fechaMaxima.setFullYear(hoy.getFullYear() - 16);
    
    fechaInput.min = fechaMinima.toISOString().split('T')[0];
    fechaInput.max = fechaMaxima.toISOString().split('T')[0];
});
