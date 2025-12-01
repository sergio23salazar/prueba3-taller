const express = require("express"); // Framework para crear el servidor HTTP y manejar rutas
const PDFDocument = require("pdfkit"); // librería para generar PDF.
const ExcelJS = require("exceljs"); // librería para generar Excel.
const admin = require("firebase-admin"); // SDK Admin para hablar con Firebase. 
const path = require("path"); // Módulo nativo de Node para manejar rutas de archivos y directorios
const cors = require("cors"); // Middleware para permitir peticiones desde otro origen (localhost, etc.)


const serviceAccount = require("./serviceAccountKey.json");

// Inicializamos la app Admin SOLO si no existe otra inicializada
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://crud-7fb63-default-rtdb.firebaseio.com"
  });
}

const db = admin.database();
const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos si los necesitas
app.use(express.static(path.join(__dirname, "public")));

// 👉 función helper para CLP
function formatCLP(value) {
  return value.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0
  });
}

// 👉 Parsear "YYYY-MM-DD" como fecha LOCAL (sin desfase de zona horaria)
function parseLocalDateFromInput(input) {
  if (input instanceof Date) return input;
  if (!input) return null;
  const [year, month, day] = input.split("-").map(Number);
  return new Date(year, month - 1, day); // local
}

// 👉 Formatear fecha a DD-MM-YYYY (usa la función de parseo local)
function formatDate(value) {
  const d = value instanceof Date ? value : parseLocalDateFromInput(value);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// ================== RUTA PRINCIPAL /generate-report ==================
app.post("/generate-report", async (req, res) => {
  try {
    const { startDate, endDate, format } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Fechas requeridas" });
    }

    const start = parseLocalDateFromInput(startDate);
    const end = parseLocalDateFromInput(endDate);

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Fechas inválidas" });
    }

    // incluir todo el día final
    end.setHours(23, 59, 59, 999);

    // 🔥 Intentar leer desde "clientes/compras" y, si no hay, desde "compras"
    let compras = {};
    let snap = await db.ref("clientes/compras").once("value");

    if (snap.exists()) {
      compras = snap.val();
    } else {
      snap = await db.ref("compras").once("value");
      if (snap.exists()) {
        compras = snap.val();
      }
    }

    if (!compras || Object.keys(compras).length === 0) {
      console.log("No se encontraron compras en Firebase para el reporte.");
    } else {
      console.log("Compras leídas:", Object.keys(compras).length);
    }

    // 1) Recorremos todas las compras en el rango
    // 2) Acumulamos por producto
    const productosAcumulados = {};
    let montoTotalGlobal = 0;

    for (const compraId in compras) {
      const compra = compras[compraId];
      if (!compra) continue;

      const compraDate = new Date(compra.date || compra.fecha || "");
      if (isNaN(compraDate.getTime())) continue;

      // filtrar por rango
      if (compraDate < start || compraDate > end) continue;

      // items puede estar guardado de distintas formas, pero en tu BD es "items"
      const items =
        compra.items ||
        compra.detalle ||
        compra.productos ||
        compra.lineas ||
        {};

      for (const itemId in items) {
        const item = items[itemId];
        if (!item) continue;

        const nombreProd =
          item.productName ||
          item.nombre ||
          item.name ||
          "Producto sin nombre";

        const cantidad = Number(item.quantity || item.cantidad || 0);
        const precioUnit = Number(
          item.price || item.precio || item.unitPrice || 0
        );
        const subtotal = cantidad * precioUnit;

        if (!productosAcumulados[nombreProd]) {
          productosAcumulados[nombreProd] = {
            producto: nombreProd,
            cantidad: 0,
            total: 0
          };
        }

        productosAcumulados[nombreProd].cantidad += cantidad;
        productosAcumulados[nombreProd].total += subtotal;
        montoTotalGlobal += subtotal;
      }
    }

    const filas = Object.values(productosAcumulados);

    console.log("Filas en el reporte:", filas.length);
    console.log("Monto total global:", montoTotalGlobal);

    if (format === "excel") {
      return generarExcel(filas, start, end, montoTotalGlobal, res);
    } else {
      return generarPDF(filas, start, end, montoTotalGlobal, res);
    }
  } catch (err) {
    console.error("Error generando reporte:", err);
    res.status(500).json({ error: "Error al generar el reporte" });
  }
});

// ================== GENERAR PDF ==================
function generarPDF(filas, start, end, montoTotalGlobal, res) {
  const doc = new PDFDocument({ margin: 60 });
  const filename = "reporte_ventas.pdf";

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);

  // -------- TÍTULO --------
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#111111")
    .text("Informe de ventas", { align: "center" });

  doc.moveDown(1.5);

  const leftMargin = doc.page.margins.left;
  const rightMargin = doc.page.width - doc.page.margins.right;

  // -------- FECHAS + MONTO --------
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#000000")
    .text(`Fecha de inicio: ${formatDate(start)}`, leftMargin)
    .moveDown(0.2);

  doc
    .text(`Fecha de fin: ${formatDate(end)}`, leftMargin)
    .moveDown(0.8);

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(`Monto total: ${formatCLP(montoTotalGlobal)}`, leftMargin)
    .moveDown(1);

  // Línea separadora
  const sepY = doc.y;
  doc
    .moveTo(leftMargin, sepY)
    .lineTo(rightMargin, sepY)
    .lineWidth(0.5)
    .strokeColor("#dddddd")
    .stroke();

  doc.moveDown(1.2);

  // Si no hay filas, mostrar mensaje y cerrar
  if (!filas || filas.length === 0) {
    doc
      .font("Helvetica-Oblique")
      .fontSize(11)
      .fillColor("#555555")
      .moveDown(1)
      .text(
        "No se registran ventas en el rango de fechas seleccionado.",
        leftMargin
      );
    doc.end();
    return;
  }

  // -------- TABLA --------
  const tableTop = doc.y;
  const tableWidth = rightMargin - leftMargin;
  const headerHeight = 22;
  const rowHeight = 18;

  const colProductoX = leftMargin + 10;
  const colCantidadX = leftMargin + tableWidth * 0.65;
  const colTotalX = leftMargin + tableWidth * 0.80;

  // Encabezado (fondo amarillo)
  doc
    .rect(leftMargin, tableTop, tableWidth, headerHeight)
    .fill("#ffc928");

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#000000");

  doc.text("Producto", colProductoX, tableTop + 6);
  doc.text("Cantidad", colCantidadX, tableTop + 6, {
    width: 50,
    align: "right"
  });
  doc.text("Total", colTotalX, tableTop + 6, {
    width: 70,
    align: "right"
  });

  // Filas
  let y = tableTop + headerHeight;

  doc.font("Helvetica").fontSize(10).fillColor("#000000");

  filas.forEach((fila, index) => {
    // salto de página si nos pasamos
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.y;
    }

    // fondo tipo "zebra" en filas pares
    if (index % 2 === 0) {
      doc
        .rect(leftMargin, y, tableWidth, rowHeight)
        .fill("#fff9e6");
      doc.fillColor("#000000"); // volvemos al negro para el texto
    }

    const producto = fila.producto || "—";
    const cantidad = fila.cantidad ?? 0;
    const total = fila.total ?? 0;

    doc.text(producto, colProductoX, y + 4, {
      width: tableWidth * 0.6,
      ellipsis: true
    });

    doc.text(String(cantidad), colCantidadX, y + 4, {
      width: 50,
      align: "right"
    });

    doc.text(formatCLP(total), colTotalX, y + 4, {
      width: 70,
      align: "right"
    });

    y += rowHeight;
  });

  doc.end();
}

// ================== GENERAR EXCEL (opcional, mismo agrupamiento) ==================
function generarExcel(filas, start, end, montoTotalGlobal, res) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Ventas");

  sheet.addRow(["Informe de ventas"]);
  sheet.mergeCells("A1:C1");
  sheet.getCell("A1").font = { size: 16, bold: true };

  sheet.addRow([]);
  sheet.addRow([`Fecha de inicio: ${formatDate(start)}`]);
  sheet.addRow([`Fecha de fin: ${formatDate(end)}`]);
  sheet.addRow([`Monto total: ${formatCLP(montoTotalGlobal)}`]);
  sheet.addRow([]);

  // Encabezados
  sheet.addRow(["Producto", "Cantidad", "Total"]);

  filas.forEach((fila) => {
    sheet.addRow([fila.producto, fila.cantidad, fila.total]);
  });

  sheet.columns = [
    { key: "producto", width: 40 },
    { key: "cantidad", width: 15 },
    { key: "total", width: 18 }
  ];

  res.setHeader(
    "Content-Disposition",
    'attachment; filename="reporte_ventas.xlsx"'
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  workbook.xlsx.write(res).then(() => res.end());
}

// ================== LEVANTAR SERVIDOR ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor escuchando en el puerto", PORT);
});
