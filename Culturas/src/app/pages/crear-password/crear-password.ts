import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';

// Pantalla que se muestra justo despues de crear una cuenta (o entrar por
// primera vez) con Google, cuando esa cuenta todavia no tiene una
// contrasena de verdad. Sirve para que, ademas de entrar con Google, la
// persona tambien pueda entrar despues con su correo y una contrasena
// normal.
@Component({
  imports: [RouterLink],
  selector: 'app-crear-password',
  styleUrl: './crear-password.scss',
  templateUrl: './crear-password.html',
})
export class CrearPassword {
  password = signal('');
  passwordConfirmation = signal('');
  cargando = signal(false);
  error = signal('');
  exito = signal(false);

  constructor(
    public auth: Auth,
    private router: Router
  ) {
    if (!this.auth.estaLogueado()) {
      this.router.navigate(['/login']);
      return;
    }

    // Si esta cuenta ya tiene una contrasena de verdad, no hace falta esta
    // pantalla: la mandamos directo a donde le corresponda.
    if (this.auth.usuarioActual()?.password_usable !== false) {
      this.irAlSiguientePaso();
    }
  }

  onPasswordChange(valor: string) {
    this.password.set(valor);
  }

  onPasswordConfirmationChange(valor: string) {
    this.passwordConfirmation.set(valor);
  }

  private irAlSiguientePaso() {
    const destino = this.auth.usuarioActual()?.personaje_completo ? '/' : '/personalizar';
    this.router.navigate([destino]);
  }

  crear() {
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
    this.auth.actualizarPassword('', this.password(), this.passwordConfirmation()).subscribe({
      next: () => {
        this.cargando.set(false);
        this.exito.set(true);
        setTimeout(() => this.irAlSiguientePaso(), 1200);
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

  // Por si alguien prefiere hacerlo despues, desde Mi Cuenta.
  saltar() {
    this.irAlSiguientePaso();
  }
}
