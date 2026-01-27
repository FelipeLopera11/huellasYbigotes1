import { supabase } from "./supabase.js";

const fechaSemana = document.getElementById("fechaSemana");
const mesInput = document.getElementById("mesSeleccionado");
const resultado = document.getElementById("resultado");
const resultadoMes = document.getElementById("resultadoMes");

/* 💰 Formato COP */
function formatoPesos(valor) {
  return valor.toLocaleString("es-CO");
}

/* 📆 Fecha local real */
function crearFechaLocal(fechaISO) {
  const [y, m, d] = fechaISO.split("-");
  return new Date(y, m - 1, d);
}

/* 📆 Semana (lunes - domingo) */
function obtenerSemana(fechaISO) {
  const d = crearFechaLocal(fechaISO);
  const dia = d.getDay() === 0 ? 7 : d.getDay();

  const lunes = new Date(d);
  lunes.setDate(d.getDate() - dia + 1);

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  return { lunes, domingo };
}

/* ========================= */
/* 📆 GANANCIA SEMANAL */
/* ========================= */
fechaSemana.addEventListener("change", async () => {
  resultado.innerHTML = "";
  if (!fechaSemana.value) return;

  const { lunes, domingo } = obtenerSemana(fechaSemana.value);

  const { data, error } = await supabase
    .from("Movimientos")
    .select("fecha, monto, tipo");

  if (error) {
    alert("Error al cargar datos");
    return;
  }

  let totalSemana = 0;

  data.forEach(m => {
    const fechaMov = crearFechaLocal(m.fecha);
    if (fechaMov >= lunes && fechaMov <= domingo) {
      totalSemana += m.tipo === "ingreso"
        ? Number(m.monto)
        : -Number(m.monto);
    }
  });

  resultado.innerHTML = `
    <div class="card">
      <h3>
        📅 ${lunes.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
        -
        ${domingo.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
      </h3>
      <p style="font-size:26px;font-weight:bold;color:#2e7d32">
        $ ${formatoPesos(totalSemana)}
      </p>
    </div>
  `;
});

/* ========================= */
/* 📅 GANANCIA MENSUAL */
/* ========================= */
mesInput.addEventListener("change", async () => {
  resultadoMes.innerHTML = "";
  if (!mesInput.value) return;

  const [year, month] = mesInput.value.split("-");
  const inicioMes = new Date(year, month - 1, 1);
  const finMes = new Date(year, month, 0);

  const { data, error } = await supabase
    .from("Movimientos")
    .select("fecha, monto, tipo");

  if (error) {
    alert("Error al cargar datos");
    return;
  }

  let totalMes = 0;

  data.forEach(m => {
    const fechaMov = crearFechaLocal(m.fecha);
    if (fechaMov >= inicioMes && fechaMov <= finMes) {
      totalMes += m.tipo === "ingreso"
        ? Number(m.monto)
        : -Number(m.monto);
    }
  });

  resultadoMes.innerHTML = `
    <div class="card">
      <h3>
        📅 ${inicioMes.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
      </h3>
      <p style="font-size:28px;font-weight:bold;color:#1565c0">
        $ ${formatoPesos(totalMes)}
      </p>
    </div>
  `;
});
