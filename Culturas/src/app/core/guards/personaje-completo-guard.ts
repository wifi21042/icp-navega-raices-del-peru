import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

// Si la persona ya inicio sesion pero todavia no termino de crear su
// personaje (personaje_completo === false), no la dejamos entrar a
// ninguna otra pagina de la app: la mandamos de vuelta a /personalizar
// hasta que lo complete y le de "Listo". Esto se aplica en TODAS las
// rutas menos las de sesion (login, registro, etc.) y la propia
// /personalizar, que estan en la lista de excepciones en app.routes.ts.
//
// Si no hay sesion iniciada, este guard no hace nada (cada pagina que
// de verdad necesita sesion ya redirige sola a /login).
export const personajeCompletoGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  const usuario = auth.usuarioActual();

  if (usuario && !usuario.personaje_completo) {
    return router.createUrlTree(['/personalizar']);
  }

  return true;
};
