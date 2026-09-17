import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Recuperar } from './pages/recuperar/recuperar';
import { Personalizar } from './pages/personalizar/personalizar';
import { Cuenta } from './pages/cuenta/cuenta';
import { Amigos } from './pages/amigos/amigos';
import { Recompensas } from './pages/recompensas/recompensas';
import { VerificarCorreo } from './pages/verificar-correo/verificar-correo';
import { RestablecerPassword } from './pages/restablecer-password/restablecer-password';
import { CrearPassword } from './pages/crear-password/crear-password';
import { AccesoriosPagina } from './pages/accesorios/accesorios';
import { RetosPagina } from './pages/retos/retos';
import { MinijuegoPagina } from './pages/minijuego/minijuego';
import { JuegosPagina } from './pages/juegos/juegos';
import { AprendePagina } from './pages/aprende/aprende';
import { ExploraPagina } from './pages/explora/explora';
import { personajeCompletoGuard } from './core/guards/personaje-completo-guard';

// Rutas de sesion (entrar, crear cuenta, recuperar contrasena, etc.) y la
// propia /personalizar quedan SIN el guard de personaje_completo: son las
// unicas a las que una persona con el personaje sin terminar puede entrar.
// Todas las demas lo llevan puesto, asi que si intenta escribir la URL a
// mano, usar el boton "atras" del navegador, o cualquier otra forma de
// escaparse de /personalizar sin terminar, el guard la manda de vuelta.
export const routes: Routes = [
  { path: '', component: Home, canActivate: [personajeCompletoGuard] },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'recuperar', component: Recuperar },
  { path: 'verificar-correo', component: VerificarCorreo },
  { path: 'restablecer-password', component: RestablecerPassword },
  { path: 'crear-password', component: CrearPassword },
  { path: 'personalizar', component: Personalizar },
  { path: 'cuenta', component: Cuenta, canActivate: [personajeCompletoGuard] },
  { path: 'amigos', component: Amigos, canActivate: [personajeCompletoGuard] },
  { path: 'recompensas', component: Recompensas, canActivate: [personajeCompletoGuard] },
  { path: 'accesorios', component: AccesoriosPagina, canActivate: [personajeCompletoGuard] },
  { path: 'retos', component: RetosPagina, canActivate: [personajeCompletoGuard] },
  { path: 'minijuego/:id', component: MinijuegoPagina, canActivate: [personajeCompletoGuard] },
  { path: 'juegos', component: JuegosPagina, canActivate: [personajeCompletoGuard] },
  { path: 'aprender', component: AprendePagina, canActivate: [personajeCompletoGuard] },
  { path: 'explorar', component: ExploraPagina, canActivate: [personajeCompletoGuard] },
];

