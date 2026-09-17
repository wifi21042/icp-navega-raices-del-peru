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
   - `MAIL_USERNAME`: tu correo de Gmail (el que uses para enviar el correo de "confirma tu cuenta").
   - `MAIL_PASSWORD`: una "contrasena de aplicacion" de Gmail (NO tu contrasena normal de Gmail). Se genera en myaccount.google.com -> Seguridad -> Verificacion en 2 pasos -> Contrasenas de aplicaciones.
   - `MAIL_FROM_ADDRESS`: el mismo correo que pusiste en `MAIL_USERNAME`.
5. Dale "Apply" / "Create". Va a tardar unos minutos en construir la imagen la primera vez.

### Si el backend ya estaba creado antes de agregar el correo

Si ya habias hecho el paso de arriba antes (el servicio `icp-cultura-backend` ya existe en Render), Render NO agrega solo las variables nuevas (`FRONTEND_URL`, `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_ENCRYPTION`, `MAIL_FROM_NAME`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`) al servicio que ya tienes corriendo. Hay que agregarlas a mano una sola vez:

1. Entra a tu servicio `icp-cultura-backend` en Render.
2. Ve a la pestana "Environment".
3. Agrega estas variables (click en "Add Environment Variable" por cada una):
   - `FRONTEND_URL` = `https://wifi21042.github.io/icp-navega-raices-del-peru`
   - `MAIL_MAILER` = `smtp`
   - `MAIL_HOST` = `smtp.gmail.com`
   - `MAIL_PORT` = `587`
   - `MAIL_ENCRYPTION` = `tls`
   - `MAIL_FROM_NAME` = `ICP - Navega por las Raices del Peru`
   - `MAIL_USERNAME` = tu correo de Gmail
   - `MAIL_PASSWORD` = tu contrasena de aplicacion de Gmail (no tu contrasena normal)
   - `MAIL_FROM_ADDRESS` = el mismo correo de `MAIL_USERNAME`
4. Guarda ("Save Changes"). Render va a reiniciar el servicio solo con las variables nuevas.

Sin esto, el correo de "confirma tu cuenta" no llega: Laravel no tira error, pero como no tiene con que mandar el correo de verdad, solo lo deja escrito en un log que nadie ve.

**Nota:** el plan gratis de Render "duerme" el servidor si nadie lo usa por 15 minutos. La primera vez que alguien entra despues de eso, tarda unos 30-60 segundos en despertar (es normal, no esta roto). Tambien, como es el plan gratis, cada vez que Render reinicie el servicio la base de datos SQLite se reinicia vacia (los usuarios/puntos que se hayan guardado ahi se pierden). Para un proyecto escolar esto deberia ser suficiente, pero si necesitas que los datos no se pierdan nunca, se puede conectar una base de datos de verdad (otro paso aparte).
