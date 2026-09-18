import { AfterViewInit, Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { errorDeNombre } from '../../core/utils/validar-nombre';
import { environment } from '../../../environments/environment';
import { mostrarBotonGoogle } from '../../core/utils/google-login';

@Component({
  imports: [RouterLink],
  selector: 'app-registro',
  styleUrl: './registro.scss',
  templateUrl: './registro.html',
})
export class Registro implements AfterViewInit {
  name = signal('');
  email = signal('');
  cargando = signal(false);
  error = signal('');
  exito = signal(false);

  constructor(
    public auth: Auth,
    private router: Router
  ) {}

  ngAfterViewInit(): void {
    mostrarBotonGoogle('boton-google-registro', environment.googleClientId, (credential) =>
      this.registrarConGoogle(credential)
    );
  }

  private registrarConGoogle(credential: string) {
    this.error.set('');
    this.cargando.set(true);

    // Con Google no hace falta confirmar el correo (Google ya lo confirmo),
    // asi que entra directo, sin pasar por la pantalla de "revisa tu
    // correo".
    this.auth.loginConGoogle(credential).subscribe({
      next: () => {
        this.cargando.set(false);

        // Si esta cuenta todavia no tiene una contrasena de verdad (por
        // ejemplo, se acaba de crear con Google), primero le pedimos que
        // cree una antes de seguir a personalizar su personaje.
        const usuario = this.auth.usuarioActual();
        const destino =
          usuario?.password_usable === false
            ? '/crear-password'
            : usuario?.personaje_completo
              ? '/'
              : '/personalizar';
        this.router.navigate([destino]);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo continuar con Google.');
      },
    });
  }

  onNameChange(valor: string) { this.name.set(valor); }
  onEmailChange(valor: string) { this.email.set(valor); }

  registrar() {
    this.error.set('');
    this.exito.set(false);

    if (!this.name() || !this.email()) {
      this.error.set('Completa todos los campos.');
      return;
    }

    const errorNombre = errorDeNombre(this.name());
    if (errorNombre) {
      this.error.set(errorNombre);
      return;
    }

    this.cargando.set(true);
    this.auth.registrar(this.name(), this.email()).subscribe({
      next: () => {
        this.cargando.set(false);
        // Por ahora (sin correo de confirmacion) entra directo a crear su
        // contrasena, igual que cuando se registra con Google.
        this.router.navigate(['/crear-password']);
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
