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
4. Antes de confirmar, te va a pedir 2 valores (los dejamos vacios a proposito, por seguridad):
   - `APP_KEY`: pon esta clave: (te la paso por aparte)
   - `GOOGLE_CLIENT_ID`: el Client ID de Google (si todavia no lo tienes configurado, puedes dejarlo vacio por ahora; el login con Google simplemente no va a funcionar hasta que lo agregues).
5. Dale "Apply" / "Create". Va a tardar unos minutos en construir la imagen la primera vez.

**Nota:** el plan gratis de Render "duerme" el servidor si nadie lo usa por 15 minutos. La primera vez que alguien entra despues de eso, tarda unos 30-60 segundos en despertar (es normal, no esta roto). Tambien, como es el plan gratis, cada vez que Render reinicie el servicio la base de datos SQLite se reinicia vacia (los usuarios/puntos que se hayan guardado ahi se pierden). Para un proyecto escolar esto deberia ser suficiente, pero si necesitas que los datos no se pierdan nunca, se puede conectar una base de datos de verdad (otro paso aparte).
