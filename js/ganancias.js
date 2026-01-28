import { supabase } from "./supabase.js";

const fechaSemana = document.getElementById("fechaSemana");
const mesInput = document.getElementById("mesSeleccionado");
const resultado = document.getElementById("resultado");
const resultadoMes = document.getElementById("resultadoMes");

/* ========================= */
/* 📊 INSTANCIAS DE GRÁFICAS */
/* ========================= */
let chartIngresosGastos = null;
let chartGastosConcepto = null;

/* 💰 Formato pesos COP */
function formatoPesos(valor) {
    return Number(valor).toLocaleString("es-CO");
}

/* 📆 Fecha local */
function crearFechaLocal(fechaISO) {
    const [y, m, d] = fechaISO.split("-");
    return new Date(y, m - 1, d);
}

/* 📆 Semana lunes a domingo */
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

    let total = 0;

    data.forEach(m => {
        const f = crearFechaLocal(m.fecha);
        if (f >= lunes && f <= domingo) {
            total += m.tipo.toLowerCase() === "ingreso"
                ? Number(m.monto)
                : -Number(m.monto);
        }
    });

    resultado.innerHTML = `
    <div class="card">
      <h3>Semana</h3>
      <p style="font-size:26px;font-weight:bold">
        $ ${formatoPesos(total)}
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

    let total = 0;

    data.forEach(m => {
        const f = crearFechaLocal(m.fecha);
        if (f >= inicioMes && f <= finMes) {
            total += m.tipo.toLowerCase() === "ingreso"
                ? Number(m.monto)
                : -Number(m.monto);
        }
    });

    resultadoMes.innerHTML = `
    <div class="card">
      <h3>Mes</h3>
      <p style="font-size:28px;font-weight:bold">
        $ ${formatoPesos(total)}
      </p>
    </div>
  `;
});

/* ========================= */
/* 🎨 FUNCIONES DE ESTILO EXCEL */
/* ========================= */

function estiloEncabezado(ws) {
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
        if (!cell) continue;

        cell.s = {
            fill: { fgColor: { rgb: "1F2937" } }, // Gris oscuro corporativo
            font: { bold: true, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: "center", vertical: "center" }
        };
    }
}

function formatoMoneda(ws, columna) {
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = 1; R <= range.e.r; ++R) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: columna })];
        if (cell) {
            cell.z = '"$"#,##0;[Red]-"$"#,##0';
        }
    }
}

function ajustarColumnas(ws, widths) {
    ws["!cols"] = widths.map(w => ({ wch: w }));
}

/* ========================= */
/* 📥 DESCARGAR EXCEL PRO */
/* ========================= */
window.descargarExcel = async function () {

    const { data, error } = await supabase
        .from("Movimientos")
        .select("fecha, tipo, monto, concepto");

    if (error) {
        alert("Error al generar Excel");
        return;
    }

    let totalIngresos = 0;
    let totalGastos = 0;

    const ingresos = [];
    const gastos = [];
    const resumenSemanal = {};
    const resumenMensual = {};

    data.forEach(m => {

        const tipo = m.tipo.toLowerCase();
        const monto = Number(m.monto);
        const fecha = crearFechaLocal(m.fecha);
        const concepto = m.concepto || "";

        /* INGRESOS / GASTOS */
        if (tipo === "ingreso") {
            totalIngresos += monto;
            ingresos.push({
                Fecha: m.fecha,
                Concepto: `Ingreso ${concepto}`.trim(),
                Monto: monto
            });
        } else {
            totalGastos += monto;
            gastos.push({
                Fecha: m.fecha,
                Concepto: `Gasto ${concepto}`.trim(),
                Monto: -monto
            });
        }

        /* RESUMEN SEMANAL */
        const { lunes, domingo } = obtenerSemana(m.fecha);
        const keySemana = `${lunes.toISOString().split("T")[0]} a ${domingo.toISOString().split("T")[0]}`;

        if (!resumenSemanal[keySemana]) {
            resumenSemanal[keySemana] = { ingresos: 0, gastos: 0 };
        }

        tipo === "ingreso"
            ? resumenSemanal[keySemana].ingresos += monto
            : resumenSemanal[keySemana].gastos += monto;

        /* RESUMEN MENSUAL */
        const keyMes = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;

        if (!resumenMensual[keyMes]) {
            resumenMensual[keyMes] = { ingresos: 0, gastos: 0 };
        }

        tipo === "ingreso"
            ? resumenMensual[keyMes].ingresos += monto
            : resumenMensual[keyMes].gastos += monto;
    });

    const neto = totalIngresos - totalGastos;

    /* 📄 HOJAS */
    const wsResumen = XLSX.utils.aoa_to_sheet([
        ["Concepto", "Valor"],
        ["Total Ingresos", totalIngresos],
        ["Total Gastos", totalGastos],
        ["Neto", neto]
    ]);

    const wsIngresos = XLSX.utils.json_to_sheet(ingresos);
    const wsGastos = XLSX.utils.json_to_sheet(gastos);

    const wsSemanal = XLSX.utils.json_to_sheet(
        Object.entries(resumenSemanal).map(([semana, v]) => ({
            Semana: semana,
            Ingresos: v.ingresos,
            Gastos: v.gastos,
            Neto: v.ingresos - v.gastos,
            Ahorro: v.ingresos - v.gastos > 0 ? (v.ingresos - v.gastos) * 0.2 : 0
        }))
    );

    const wsMensual = XLSX.utils.json_to_sheet(
        Object.entries(resumenMensual).map(([mes, v]) => ({
            Mes: mes,
            Ingresos: v.ingresos,
            Gastos: v.gastos,
            Neto: v.ingresos - v.gastos,
            Ahorro: v.ingresos - v.gastos > 0 ? (v.ingresos - v.gastos) * 0.2 : 0
        }))
    );

    /* 🎨 APLICAR ESTILOS */
    estiloEncabezado(wsResumen);
    ajustarColumnas(wsResumen, [25, 18]);

    estiloEncabezado(wsIngresos);
    formatoMoneda(wsIngresos, 2);
    ajustarColumnas(wsIngresos, [15, 40, 18]);

    estiloEncabezado(wsGastos);
    formatoMoneda(wsGastos, 2);
    ajustarColumnas(wsGastos, [15, 40, 18]);

    estiloEncabezado(wsSemanal);
    [1, 2, 3, 4].forEach(c => formatoMoneda(wsSemanal, c));
    ajustarColumnas(wsSemanal, [28, 18, 18, 18, 18]);

    estiloEncabezado(wsMensual);
    [1, 2, 3, 4].forEach(c => formatoMoneda(wsMensual, c));
    ajustarColumnas(wsMensual, [18, 18, 18, 18, 18]);

    /* 📦 LIBRO */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");
    XLSX.utils.book_append_sheet(wb, wsIngresos, "Ingresos");
    XLSX.utils.book_append_sheet(wb, wsGastos, "Gastos");
    XLSX.utils.book_append_sheet(wb, wsSemanal, "Resumen Semanal");
    XLSX.utils.book_append_sheet(wb, wsMensual, "Resumen Mensual");

    XLSX.writeFile(wb, "Ganancias_HuellasYBigotes.xlsx");
};

/* ========================= */
/* 📊 GRÁFICAS + RECOMENDACIONES */
/* ========================= */

async function generarGraficasYConsejos() {


    const { data, error } = await supabase
        .from("Movimientos")
        .select("fecha, tipo, monto, concepto");

    if (error) return;

    let ingresosMes = 0;
    let gastosMes = 0;

    const gastosPorConcepto = {};

    data.forEach(m => {
        const tipo = m.tipo.toLowerCase();
        const monto = Number(m.monto);
        const concepto = m.concepto || "Otros";

        if (tipo === "ingreso") {
            ingresosMes += monto;
        } else {
            gastosMes += monto;
            gastosPorConcepto[concepto] = (gastosPorConcepto[concepto] || 0) + monto;
        }
    });

    /* 📊 GRÁFICA INGRESOS VS GASTOS */
    if (chartIngresosGastos) {
        chartIngresosGastos.destroy();
    }
    chartIngresosGastos = new Chart(document.getElementById("graficaIngresosGastos"), {
        type: "bar",
        data: {
            labels: ["Ingresos", "Gastos"],
            datasets: [{
                data: [ingresosMes, gastosMes],
                backgroundColor: ["#2e7d32", "#c62828"]
            }]
        }
    });

    /* 🥧 GRÁFICA GASTOS POR CONCEPTO */
    if (chartGastosConcepto) {
        chartGastosConcepto.destroy();
    }
    chartGastosConcepto = new Chart(document.getElementById("graficaGastosConcepto"), {
        type: "pie",
        data: {
            labels: Object.keys(gastosPorConcepto),
            datasets: [{
                data: Object.values(gastosPorConcepto)
            }]
        }
    });

    /* 💡 RECOMENDACIONES */
    const recomendaciones = [];
    const contenedor = document.getElementById("recomendaciones");

    const gastoMayor = Object.entries(gastosPorConcepto)
        .sort((a, b) => b[1] - a[1])[0];

    if (gastoMayor) {
        const ahorro = gastoMayor[1] * 0.1;
        recomendaciones.push(
            `💡 Estás gastando mucho en <b>${gastoMayor[0]}</b>. 
       Si reduces un 10%, ahorrarías <b>$${formatoPesos(ahorro)}</b> al mes.`
        );
    }

    if (gastosMes > ingresosMes * 0.6) {
        recomendaciones.push(
            `⚠️ Tus gastos superan el 60% de tus ingresos. 
       Considera reducir gastos operativos para mejorar tu ahorro.`
        );
    }

    if (recomendaciones.length === 0) {
        recomendaciones.push("✅ Buen manejo financiero, sigue así 👏");
    }

    contenedor.innerHTML = `
    <h3>📌 Recomendaciones</h3>
    <ul>${recomendaciones.map(r => `<li>${r}</li>`).join("")}</ul>
  `;
}

/* AUTO CARGAR */
generarGraficasYConsejos();

/* ========================= */
/* 📊 DATOS PARA GRÁFICAS EXCEL */
/* ========================= */

const wsGraficas = XLSX.utils.aoa_to_sheet([
    ["Tipo", "Valor"],
    ["Ingresos", totalIngresos],
    ["Gastos", totalGastos],
    ["Neto", neto]
]);

// Formato moneda
["B2", "B3", "B4"].forEach(cell => {
    if (wsGraficas[cell]) {
        wsGraficas[cell].z = '"$"#,##0';
    }
});

XLSX.utils.book_append_sheet(wb, wsGraficas, "Datos Gráficas");

/* ========================= */
/* 🔄 REALTIME SUPABASE */
/* ========================= */

const canalMovimientos = supabase
  .channel("movimientos-realtime")
  .on(
    "postgres_changes",
    {
      event: "*",      // INSERT, UPDATE, DELETE
      schema: "public",
      table: "Movimientos"
    },
    () => {
      console.log("🔄 Cambios detectados en Movimientos");
      generarGraficasYConsejos();
    }
  )
  .subscribe();
