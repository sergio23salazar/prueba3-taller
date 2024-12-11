const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

// Configura la aplicación Express
const app = express();
const port = 3000;

// Middleware para parsear el cuerpo del formulario
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configura el transporte SMTP con las credenciales de Mailtrap
const transport = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: '5e9aeb4a259a15',  // Usa tu usuario de Mailtrap
    pass: 'c6d9b8b2ff99c4'   // Usa tu contraseña de Mailtrap
  }
});

// Ruta para procesar el formulario
app.post('/send-email', (req, res) => {
  const { name, email, phone, message } = req.body;

  const mailOptions = {
    from: email, // El correo que se ingresa en el formulario
    to: 'tu_correo@dominio.com', // El correo al que quieres que lleguen los mensajes
    subject: `Nuevo mensaje de ${name}`,
    text: `
      Nombre: ${name}
      Correo: ${email}
      Teléfono: ${phone}
      Mensaje: ${message}
    `
  };

  // Enviar el correo
  transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send('Error al enviar el mensaje');
    }
    res.status(200).send('Mensaje enviado con éxito');
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
