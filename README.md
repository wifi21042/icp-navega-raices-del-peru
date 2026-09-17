# ICP - Navega por las Raices del Peru

Proyecto escolar con dos partes:

- **Cultura/** - Backend en Laravel (API + autenticacion con Sanctum).
- **Culturas/** - Frontend en Angular.

## Como correrlo

### Backend (Cultura)

```
cd Cultura
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

El backend queda corriendo en `http://127.0.0.1:8000`.

### Frontend (Culturas)

```
cd Culturas
npm install
ng serve
```

El frontend queda corriendo en `http://localhost:4200`.

## Version en vivo

- **Frontend (GitHub Pages):** https://wifi21042.github.io/icp-navega-raices-del-peru/ (se actualiza solo cada vez que se sube algo nuevo a `Culturas/`)
- **Backend (Render):** https://icp-cultura-backend.onrender.com (falta activarlo, ver abajo)

### Como activar el backend en Render (una sola vez)

1. Entra a https://render.com y crea una cuenta (puedes usar "Sign in with GitHub", no hace falta contraseña nueva).
2. Click en "New +" -> "Blueprint".
3. Elige el repositorio `icp-navega-raices-del-peru`. Render va a leer el archivo `render.yaml` solo y va a armar el servicio.
4. Antes de confirmar, te va a pedir varios valores que dejamos vacios a proposito, por seguridad:
   - `APP_KEY`: pon esta clave: (te la paso por aparte)
   - `GOOGLE_CLIENT_ID`: el Client ID de Google (si todavia no lo tienes configurado, puedes dejarlo vacio por ahora; el login con Google simplemente no va a funcionar hasta que lo agregues).
   - `BREVO_API_KEY`: ver la seccion de abajo, "Como mandar los correos de verdad (Brevo)".
   - `MAIL_FROM_ADDRESS`: tu correo (el que quieras que aparezca como remitente).
5. Dale "Apply" / "Create". Va a tardar unos minutos en construir la imagen la primera vez.

### Como mandar los correos de verdad (Brevo)

El correo de "confirma tu cuenta" y el de "restablecer contrasena" NO se pueden mandar por Gmail/SMTP normal desde Render: el plan gratis de Render bloquea las conexiones salientes por los puertos de SMTP (25, 465, 587) desde el 26 de setiembre del 2025, asi que no importa que tan bien esten puestas las credenciales de Gmail, la conexion nunca sale (por eso el registro se quedaba pegado en "Creando cuenta..." un buen rato y despues tiraba error). La solucion es mandar los correos por una API por HTTP (que si esta permitida) en vez de SMTP, usando Brevo, que en su plan gratis (300 correos/dia) deja mandar a cualquier destinatario apenas verificas un solo correo remitente, sin necesitar un dominio propio.

1. Entra a https://www.brevo.com y crea una cuenta gratis (con tu correo, sin tarjeta).
2. Ve a **Senders, Domains & Dedicated IPs** (o "Remitentes") y agrega como remitente el correo que quieras usar (por ejemplo tu Gmail). Brevo te manda un correo de confirmacion a esa direccion: entra y confirmalo.
3. Ve a **Settings -> SMTP & API -> API Keys** y genera una API key nueva (el boton dice "Generate a new API key"). Copia esa clave (empieza con `xkeysib-`).
4. Esa clave es la que va en `BREVO_API_KEY` al crear el Blueprint en Render (paso 4 de arriba), y `MAIL_FROM_ADDRESS` tiene que ser el mismo correo que verificaste como remitente en el paso 2.

### Si el backend ya estaba creado antes de agregar el correo

Si ya habias hecho el paso de arriba antes (el servicio `icp-cultura-backend` ya existe en Render), Render NO agrega solo las variables nuevas al servicio que ya tienes corriendo. Hay que agregarlas a mano una sola vez:

1. Entra a tu servicio `icp-cultura-backend` en Render.
2. Ve a la pestana "Environment".
3. Agrega estas variables (click en "Add Environment Variable" por cada una):
   - `FRONTEND_URL` = `https://wifi21042.github.io/icp-navega-raices-del-peru`
   - `BREVO_API_KEY` = tu API key de Brevo (ver arriba, "Como mandar los correos de verdad")
   - `MAIL_FROM_ADDRESS` = el correo que verificaste como remitente en Brevo
   - `MAIL_FROM_NAME` = `ICP - Navega por las Raices del Peru`
4. Guarda ("Save Changes"). Render va a reiniciar el servicio solo con las variables nuevas.

Sin `BREVO_API_KEY`, el correo de confirmacion y el de restablecer contrasena no se mandan (Laravel no tira error, pero tampoco los manda de verdad, solo intenta por SMTP, que esta bloqueado, y termina en error 500 despues de un buen rato esperando la conexion).

**Nota:** el plan gratis de Render "duerme" el servidor si nadie lo usa por 15 minutos. La primera vez que alguien entra despues de eso, tarda unos 30-60 segundos en despertar (es normal, no esta roto). Tambien, como es el plan gratis, cada vez que Render reinicie el servicio la base de datos SQLite se reinicia vacia (los usuarios/puntos que se hayan guardado ahi se pierden). Para un proyecto escolar esto deberia ser suficiente, pero si necesitas que los datos no se pierdan nunca, se puede conectar una base de datos de verdad (otro paso aparte).
