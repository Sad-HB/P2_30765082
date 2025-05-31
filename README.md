# Alquiler de Bicicletas Eléctricas y Scooters Urbanos

# Descripción
Proyecto web para la gestión de alquiler de bicicletas eléctricas y scooters urbanos, con formularios de contacto y pago, integración de reCAPTCHA, Google Analytics, notificaciones por correo y almacenamiento en SQLite.

# Configuración del Proyecto

# 1. Clonar el repositorio
```sh
git clone https://github.com/Sad-HB/P2_30765082.git
cd P2_30765082
```

# 2. Instalar dependencias
```sh
npm install
```

# 3. Variables de entorno
Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido (ajusta los valores según tus claves):

```
MAIL_USER=tu_correo@gmail.com
MAIL_PASS=tu_contraseña_o_app_password
RECAPTCHA_SECRET=tu_toke_secret
FAKEPAYMENT_API_KEY=tu_api_key_fakepayment
IPSTACK_KEY=tu_api_key_ipstack
```

> **Nota:** Nunca subas el archivo `.env` a un repositorio público.


# Integración de Servicios

# Google reCAPTCHA v2
- **Frontend:**
  - En `views/index.ejs` se incluye el widget de reCAPTCHA con la clave pública en el formulario de contacto.
  - `<div class="g-recaptcha" data-sitekey="TU_CLAVE_PUBLICA"></div>`
- **Backend:**
  - En `src/controllers/ContactsController.ts` se valida el token recibido usando la clave secreta desde la variable de entorno `RECAPTCHA_SECRET`.
  - Se realiza una petición a `https://www.google.com/recaptcha/api/siteverify` para validar el token.

# Google Analytics
- Se integra el script de Google Analytics en `views/index.ejs` usando el ID de medición proporcionado por Google.
- Ejemplo:
  ```html
  <script async src="https://www.googletagmanager.com/gtag/js?id=TU_ID_ANALYTICS"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'TU_ID_ANALYTICS');
  </script>
  ```

# Fake Payment API
- **Backend:**
  - En `src/controllers/PaymentsController.ts` se realiza la integración con la API de pagos falsa (`https://fakepayment.onrender.com/payments`).
  - La clave de API se toma de la variable de entorno `FAKEPAYMENT_API_KEY`.
  - Se manejan todos los posibles estados de respuesta y se retorna un mensaje claro al frontend.
- **Frontend:**
  - El formulario de pago en `views/index.ejs` envía los datos por AJAX y muestra el resultado debajo del formulario, con estilos y mensajes claros.

# Notificaciones por Correo (Nodemailer)
- **Backend:**
  - En `src/controllers/ContactsController.ts` se configura Nodemailer usando las variables de entorno `MAIL_USER` y `MAIL_PASS`.
  - Se envía un correo de notificación cada vez que se recibe un nuevo contacto.

# Geolocalización por IP (ipstack)
- **Backend:**
  - En `src/controllers/ContactsController.ts` se consulta la API de ipstack usando la clave de entorno `IPSTACK_KEY` para obtener el país del usuario a partir de su IP.

# Base de Datos SQLite
- **Backend:**
  - En `src/models/ContactsModel.ts` se gestiona el almacenamiento y recuperación de contactos usando SQLite.

---

# Despliegue en Render
1. Sube tu código a GitHub.
2. Crea un nuevo servicio web en [Render](https://render.com/), conecta tu repositorio y configura las variables de entorno en el panel de Render.
3. Render instalará dependencias y ejecutará el servidor automáticamente.

---

# Notas de Seguridad
- Nunca subas tu archivo `.env` ni claves privadas a un repositorio público.
- Usa contraseñas de aplicación para Gmail si tienes 2FA.

---

# Créditos
Desarrollado por **HENZO BRETO CI.30765082 SECCION 4** .
