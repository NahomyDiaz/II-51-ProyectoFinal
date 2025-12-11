import { supabase } from "./supabaseClient.js";

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