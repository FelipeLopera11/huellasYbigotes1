import { supabase } from "./supabase.js";

function validarTelefono(input) {
  const error = document.getElementById("errorTelefono");

  if (/[^0-9]/.test(input.value)) {
    error.style.display = "block";
    input.value = input.value.replace(/[^0-9]/g, "");
  } else {
    error.style.display = "none";
  }
}

window.validarTelefono = validarTelefono;

window.guardarCita = async function () {
  const cliente = document.getElementById("cliente").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const mascota = document.getElementById("mascota").value.trim();
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value.trim();
  const precio = Number(document.getElementById("precio").value);

  if (!cliente || !telefono || !mascota || !fecha || !hora || !precio) {
    alert("⚠️ Completa todos los campos");
    return;
  }

  const { error } = await supabase
    .from("Citas") // 👈 MAYÚSCULA
    .insert([
      { cliente, telefono, mascota, fecha, hora, precio }
    ]);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  alert("✅ Cita guardada correctamente");

  document.querySelectorAll("input").forEach(i => i.value = "");
  document.getElementById("errorTelefono").style.display = "none";
};