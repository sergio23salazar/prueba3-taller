const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;  // Puedes usar otro puerto si lo prefieres

// Middleware para parsear los datos del formulario
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuración de Nodemailer para Mailtrap
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "d920730d574db2",  // Tu usuario de Mailtrap
    pass: "c5d4e28a7046ef"   // Tu contraseña de Mailtrap
  }
});

// Ruta para procesar el formulario de contacto
app.post('/send-email', (req, res) => {
  const { name, email, phone, message } = req.body;

  const mailOptions = {
    from: email,  // El correo que llena el usuario
    to: 'tucorreo@ejemplo.com',  // Tu dirección de correo para recibir los mensajes
    subject: `Nuevo mensaje de ${name}`,
    text: `Nombre: ${name}\nCorreo: ${email}\nTeléfono: ${phone}\nMensaje: ${message}`
  };

  // Enviar el correo
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error al enviar el correo:", error);
      return res.status(500).send('Error al enviar el correo: ' + error.message); // Enviar el error exacto al cliente
    }
    console.log('Correo enviado: ' + info.response); // Imprimir detalles de la respuesta del servidor
    res.status(200).send('Mensaje enviado con éxito');
  });
});

// Servir el formulario HTML si lo necesitas
app.use(express.static('public'));  // Si tienes una carpeta "public" con el HTML y otros archivos

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
