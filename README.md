Guía rápida – Reportes PDF/Excel

1. Traer el proyecto 

git clone https://github.com/sergio23salazar/prueba3-taller.git
cd prueba3-taller
# si ya lo tenían:
git pull origin master

2. Instalar dependencias

Dentro de "prueba3-taller":

nmp install

3. Crear su propia "serviceAccountKey.json"

Cada uno hace esto EN SU PC:
a. Entrar a Firebase → Configuración del proyecto → Cuentas de servicio → SDK de Firebase Admin.
b. Click en “Generar nueva clave privada” → se descarga un .json.
c. Copiar ese archivo dentro de la carpeta del proyecto.
d. Renombrarlo a:

serviceAccountKey.json

Debe quedar al lado de "server.js" y "package.json".
⚠️ Ojo, no hacer "git add" de ese archivo (ya está ignorado).

4. Levantar el server

node server.js

Si se ve: "Servidor escuchando en el puerto 3000" → todo ok ✅ 

5. Generar reporte desde el Admin

a. Abrir admin.html.
b. Loguearse como admin.
c. Ir a pestaña TABLES → sección “Generar Informe de Ventas”.
d. Elegir fechas + formato (PDF o Excel) y apretar Generar Informe.
e. Se "descarga reporte_ventas.pdf" o ".xlsx".

⚠️ Importante: si no descarga nada o da error → revisen que el "server.js" esté corriendo.
