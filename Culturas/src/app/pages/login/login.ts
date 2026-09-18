import { AfterViewInit, Component, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { environment } from '../../../environments/environment';
import { mostrarBotonGoogle } from '../../core/utils/google-login';

@Component({
  imports: [RouterLink],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login implements AfterViewInit {
  email = signal('');
  password = signal('');
  cargando = signal(false);
  error = signal('');
  exito = signal(false);

  constructor(
    public auth: Auth,
    private router: Router
  ) {}

  ngAfterViewInit(): void {
    mostrarBotonGoogle('boton-google-login', environment.googleClientId, (credential) =>
      this.entrarConGoogle(credential)
    );
  }

  private entrarConGoogle(credential: string) {
    this.error.set('');
    this.cargando.set(true);

    this.auth.loginConGoogle(credential).subscribe({
      next: () => {
        this.cargando.set(false);
        this.exito.set(true);

        // Si esta cuenta todavia no tiene una contrasena de verdad (por
        // ejemplo, es la primera vez que entra con Google), primero le
        // pedimos que cree una antes de seguir.
        const usuario = this.auth.usuarioActual();
        const destino =
          usuario?.password_usable === false
            ? '/crear-password'
            : usuario?.personaje_completo
              ? '/'
              : '/personalizar';
        setTimeout(() => this.router.navigate([destino]), 900);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo iniciar sesion con Google.');
      },
    });
  }

  onEmailChange(valor: string) {
    this.email.set(valor);
  }

  onPasswordChange(valor: string) {
    this.password.set(valor);
  }

  entrar() {
    this.error.set('');
    this.exito.set(false);
    this.cargando.set(true);

    this.auth.login(this.email(), this.password()).subscribe({
      next: () => {
        this.cargando.set(false);
        this.exito.set(true);

        const destino = this.auth.usuarioActual()?.personaje_completo ? '/' : '/personalizar';
        setTimeout(() => this.router.navigate([destino]), 900);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo conectar con el servidor.');
      },
    });
  }
}
