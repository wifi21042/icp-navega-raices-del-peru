import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';

// Segundos que esperamos antes de mandar a la persona al siguiente paso
// despues de confirmar el correo con exito.
const SEGUNDOS_ANTES_DE_CONTINUAR = 1.5;

@Component({
  imports: [RouterLink],
  selector: 'app-verificar-correo',
  styleUrl: './verificar-correo.scss',
  templateUrl: './verificar-correo.html',
})
export class VerificarCorreo {
  cargando = signal(true);
  exito = signal(false);
  error = signal('');

  constructor(
    route: ActivatedRoute,
    auth: Auth,
    router: Router
  ) {
    const token = route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.cargando.set(false);
      this.error.set('Este enlace no es valido. Revisa que lo hayas copiado completo.');
      return;
    }

    auth.verificarCorreo(token).subscribe({
      next: () => {
        this.cargando.set(false);
        this.exito.set(true);
        // Ya queda con la sesion abierta (verificarCorreo la guarda), asi
        // que la mandamos directo a crear su contrasena y, de ahi, a armar
        // su personaje: no hace falta que inicie sesion a mano.
        const usuario = auth.usuarioActual();
        const destino =
          usuario?.password_usable === false
            ? '/crear-password'
            : usuario?.personaje_completo
              ? '/'
              : '/personalizar';
        setTimeout(() => router.navigate([destino]), SEGUNDOS_ANTES_DE_CONTINUAR * 1000);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo confirmar tu correo.');
      },
    });
  }
}
