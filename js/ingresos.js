import { supabase } from "./supabase.js";

const listaTemporal = document.getElementById("listaTemporal");
const totalTexto = document.getElementById("total");

let movimientosTemporales = [];
let totalDia = 0;

function agregarMovimiento(tipo) {
  const concepto = document.getElementById("concepto").value;
  const monto = Number(document.getElementById("valor").value);
  const fecha = document.getElementById("fecha").value;

  if (!concepto || !monto || !fecha) {
    alert("Completa todos los campos");
    return;
  }

  movimientosTemporales.push({ concepto, monto, tipo, fecha });
  totalDia += tipo === "ingreso" ? monto : -monto;

  mostrarLista();
  actualizarTotal();

  document.getElementById("concepto").value = "";
  document.getElementById("valor").value = "";
}

function mostrarLista() {
  listaTemporal.innerHTML = "";
  movimientosTemporales.forEach(m => {
    const signo = m.tipo === "ingreso" ? "+" : "-";
    listaTemporal.innerHTML += `<div>${m.concepto} ${signo} $${m.monto}</div>`;
  });
}

function actualizarTotal() {
  totalTexto.textContent = `Total del día: $${totalDia}`;
}

async function guardarEnHistorial() {
  if (movimientosTemporales.length === 0) {
    alert("No hay información");
    return;
  }

  const { error } = await supabase
    .from("Movimientos")
    .insert(movimientosTemporales);

  if (error) {
    console.error(error);
    alert("❌ Error al guardar");
    return;
  }

  alert("✅ Información guardada");

  movimientosTemporales = [];
  totalDia = 0;
  listaTemporal.innerHTML = "";
  actualizarTotal();
}

window.agregarMovimiento = agregarMovimiento;
window.guardarEnHistorial = guardarEnHistorial;