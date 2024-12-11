const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
const port = 5501;  // Cambia esto si deseas usar otro puerto

// Middleware para parsear el cuerpo de la solicitud como JSON
app.use(bodyParser.json());

// Configuración de nodemailer con las credenciales de Mailtrap
const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: '5e9aeb4a259a15',  // Usuario proporcionado por Mailtrap
    pass: 'c6d9b8b2ff99c4'   // Contraseña proporcionada por Mailtrap
  }
});

// Ruta para manejar el envío de correos
app.post('/send-email', (req, res) => {
  const { name, email, phone, message } = req.body;

  // Configuración del correo
  const mailOptions = {
    from: '"Formulario de Contacto" <no-reply@mueblesconcepcion.cl>',  // Dirección del remitente
    to: 'tu_correo@example.com',  // Tu correo de destino, donde recibirás los mensajes
    subject: 'Nuevo mensaje de contacto',
    text: `Has recibido un nuevo mensaje desde el formulario de contacto:\n\n
    Nombre: ${name}\n
    Correo: ${email}\n
    Teléfono: ${phone}\n
    Mensaje: ${message}`
  };

  // Enviar el correo
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error al enviar el mensaje:', error);
      return res.status(500).send({ message: 'Hubo un error al enviar tu mensaje.' });
    }
    console.log('Correo enviado:', info.response);
    res.status(200).send({ message: '¡Tu mensaje ha sido enviado!' });
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
