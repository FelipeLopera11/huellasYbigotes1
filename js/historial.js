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

  mostrarMovimientosAgrupados(data);
}

function mostrarMovimientosAgrupados(movs) {
  lista.innerHTML = "";

  if (movs.length === 0) {
    lista.innerHTML = "<p>No hay movimientos</p>";
    return;
  }

  // 🔹 Agrupar por fecha
  const agrupados = {};

  movs.forEach(m => {
    if (!agrupados[m.fecha]) {
      agrupados[m.fecha] = [];
    }
    agrupados[m.fecha].push(m);
  });

  // 🔹 Recorrer cada fecha
  Object.keys(agrupados).forEach(fecha => {
    const movimientosDia = agrupados[fecha];

    let totalDia = 0;

    movimientosDia.forEach(m => {
      totalDia += m.tipo === "ingreso" ? m.monto : -m.monto;
    });

    // 📦 Card del día
    const cardDia = document.createElement("div");
    cardDia.className = "card";

    cardDia.innerHTML = `
      <h3>📅 ${fecha}</h3>
      <p id="total"><strong>Total del día:</strong> $${totalDia}</p>
      <hr>
    `;

    // 🔹 Movimientos del día
    movimientosDia.forEach(m => {
      const div = document.createElement("div");
      const signo = m.tipo === "ingreso" ? "+" : "-";
      const color = m.tipo === "ingreso" ? "green" : "red";

      div.innerHTML = `
        <p>
          ${m.concepto} -
          <span style="color:${color}; font-weight:bold">
            ${signo} $${m.monto}
          </span>
        </p>

        <button onclick="editar('${m.id}')">✏️ Modificar</button>
        <button onclick="eliminar('${m.id}')">🗑️ Eliminar</button>
        <hr>
      `;

      cardDia.appendChild(div);
    });

    lista.appendChild(cardDia);
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
    .eq("id", id);

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
    .eq("id", id);

  if (error) {
    alert("Error al eliminar");
    return;
  }

  cargarMovimientos();
};

// 📆 FILTRO
window.filtrarPorFecha = () => {
  const fecha = document.getElementById("filtroFecha").value;
  cargarMovimientos(fecha || null);
};

// 🚀 INICIO
cargarMovimientos();
