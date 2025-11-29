import { supabase } from "./supabaseClient";

async function cargarEstudiantes() {
    let { data: estudiantes, error } = await supabase.from("estudiantes").select("*");
    if (error) {
        console.error("Error al cargar estudiantes:", error);
        return;
    }
    
    let listaEstudiantes = document.getElementById("lista-estudiantes");
    listaEstudiantes.innerHTML = "";
    
    estudiantes.forEach(estudiante => {
        let li = document.createElement("li");
        li.textContent = estudiante.nombre;
        listaEstudiantes.appendChild(li);
    });
}