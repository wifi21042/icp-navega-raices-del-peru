import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';

@Component({
  imports: [RouterLink],
  selector: 'app-restablecer-password',
  styleUrl: './restablecer-password.scss',
  templateUrl: './restablecer-password.html',
})
export class RestablecerPassword {
  token = '';
  email = '';
  enlaceInvalido = false;

  password = signal('');
  passwordConfirmation = signal('');
  cargando = signal(false);
  error = signal('');
  exito = signal(false);

  constructor(
    route: ActivatedRoute,
    private auth: Auth,
    private router: Router
  ) {
    this.token = route.snapshot.queryParamMap.get('token') ?? '';
    this.email = route.snapshot.queryParamMap.get('email') ?? '';
    this.enlaceInvalido = !this.token || !this.email;
  }

  onPasswordChange(valor: string) {
    this.password.set(valor);
  }

  onPasswordConfirmationChange(valor: string) {
    this.passwordConfirmation.set(valor);
  }

  restablecer() {
    this.error.set('');

    if (!this.password() || !this.passwordConfirmation()) {
      this.error.set('Completa los dos campos.');
      return;
    }

    if (this.password() !== this.passwordConfirmation()) {
      this.error.set('Las contrasenas no coinciden.');
      return;
    }

    this.cargando.set(true);
    this.auth
      .restablecerPassword(this.token, this.email, this.password(), this.passwordConfirmation())
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.exito.set(true);
          setTimeout(() => this.router.navigate(['/login']), 1800);
        },
        error: (err) => {
          this.cargando.set(false);
          const erroresValidacion = err?.error?.errors;
          if (erroresValidacion) {
            const primerCampo = Object.keys(erroresValidacion)[0];
            this.error.set(erroresValidacion[primerCampo][0]);
          } else {
            this.error.set(err?.error?.message ?? 'No se pudo conectar con el servidor.');
          }
        },
      });
  }
}
