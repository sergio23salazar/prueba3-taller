const express = require("express");
const path = require("path");
const PDFDocument = require("pdfkit");

const app = express();

// 🔹 Usa el mismo puerto que estás usando con Live Server
const PORT = 5502;

// Para que Express pueda leer JSON del fetch
app.use(express.json());

// Servir archivos estáticos (admin.html, css, js, etc.)
app.use(express.static(__dirname));
// Si tu admin.html estuviera dentro de otra carpeta,
// podrías usar: app.use(express.static(path.join(__dirname, "WebSitePizza-main")));

// Ruta para generar el reporte en PDF
app.post("/generate-report", (req, res) => {
  const { startDate, endDate, format } = req.body;

  // Por ahora solo implementamos PDF
  if (format !== "pdf") {
    return res
      .status(400)
      .json({ error: "Por ahora solo está implementado el formato PDF." });
  }

  // Configurar cabeceras de respuesta
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="report.pdf"');

  // Crear documento PDF
  const doc = new PDFDocument({ margin: 50 });

  // Enviar el PDF directamente como respuesta
  doc.pipe(res);

  // Contenido del PDF (luego podemos hacerlo más bonito)
  doc.fontSize(20).text("Informe de ventas", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Fecha de inicio: ${startDate || "-"}`);
  doc.text(`Fecha de fin: ${endDate || "-"}`);
  doc.moveDown();

  doc.text(
    "Este es un informe de ejemplo generado desde el servidor.\n" +
      "Más adelante aquí se pueden listar las ventas reales que estén " +
      "guardadas en Firebase entre esas fechas."
  );

  // Fin del PDF
  doc.end();
});

// Levantar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
