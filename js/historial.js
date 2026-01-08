import { supabase } from "./supabase.js";

const lista = document.getElementById("listaHistorial");

async function cargarMovimientos(fecha = null) {
  let query = supabase
    .from("Movimientos")
    .select("*")
    .order("fecha", { ascending: false });

  if (fecha) {
    query = query.eq("fecha", fecha);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    alert("Error al cargar historial");
    return;
  }

  mostrarMovimientos(data);
}

function mostrarMovimientos(movs) {
  lista.innerHTML = "";

  if (movs.length === 0) {
    lista.innerHTML = "<p>No hay movimientos</p>";
    return;
  }

  movs.forEach(m => {
    const div = document.createElement("div");
    div.className = "card";

    const signo = m.tipo === "ingreso" ? "+" : "-";

    div.innerHTML = `
      <strong>${m.fecha}</strong><br>
      ${m.concepto}<br>
      ${signo} $${m.monto}<br><br>

      <button onclick="editar('${m.id}')">✏️ Modificar</button>
      <button onclick="eliminar('${m.id}')">🗑️ Eliminar</button>
    `;

    lista.appendChild(div);
  });
}

// ✏️ EDITAR
window.editar = async (id) => {
  const concepto = prompt("Concepto:");
  const monto = prompt("Monto:");
  const fecha = prompt("Fecha (YYYY-MM-DD):");

  if (!concepto || !monto || !fecha) return;

  const { error } = await supabase
    .from("Movimientos")
    .update({
      concepto,
      monto: Number(monto),
      fecha
    })
    .eq("id", id); // 👈 UUID STRING

  if (error) {
    console.error(error);
    alert("Error al editar");
    return;
  }

  cargarMovimientos();
};

// 🗑️ ELIMINAR
window.eliminar = async (id) => {
  if (!confirm("¿Eliminar este movimiento?")) return;

  const { error } = await supabase
    .from("Movimientos")
    .delete()
    .eq("id", id); // 👈 UUID STRING

  if (error) {
    alert("Error al eliminar");
    return;
  }

  cargarMovimientos();
};

window.filtrarPorFecha = () => {
  const fecha = document.getElementById("filtroFecha").value;
  cargarMovimientos(fecha);
};

cargarMovimientos();