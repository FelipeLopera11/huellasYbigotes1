import { supabase } from "./supabase.js";

const lista = document.getElementById("listaCitas");

async function cargarCitas(fecha = null) {
  lista.innerHTML = "";

  let query = supabase.from("Citas").select("*");

  if (fecha) query = query.eq("fecha", fecha);

  const { data, error } = await query.order("fecha", { ascending: true });

  if (error) {
    console.error(error);
    lista.innerHTML = "<p>Error cargando citas</p>";
    return;
  }

  if (data.length === 0) {
    lista.innerHTML = "<p>No hay citas para esta fecha</p>";
    return;
  }

  data.forEach(cita => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <strong>${cita.fecha} - ${cita.hora}</strong><br>
      Cliente: ${cita.cliente}<br>
      Mascota: ${cita.mascota}<br>
      Tel: ${cita.telefono}<br>
      💲 ${cita.precio}<br><br>

      <button class="btn btn-orange" onclick="eliminarCita('${cita.id}')">
        🗑️ Eliminar
      </button>
    `;

    lista.appendChild(div);
  });
}

window.filtrarPorFecha = function () {
  const fecha = document.getElementById("filtroFecha").value;
  cargarCitas(fecha || null);
};

window.eliminarCita = async function (id) {
  if (!confirm("¿Eliminar esta cita?")) return;

  const { error } = await supabase
    .from("Citas") // 👈 MAYÚSCULA
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Error al eliminar");
    return;
  }

  alert("🗑️ Cita eliminada");
  filtrarPorFecha();
};

cargarCitas();