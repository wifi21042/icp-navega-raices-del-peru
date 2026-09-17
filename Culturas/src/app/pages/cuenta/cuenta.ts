import { AfterViewInit, Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { errorDeNombre } from '../../core/utils/validar-nombre';
import { environment } from '../../../environments/environment';
import { mostrarBotonGoogle } from '../../core/utils/google-login';

@Component({
  imports: [RouterLink],
  selector: 'app-cuenta',
  styleUrl: './cuenta.scss',
  templateUrl: './cuenta.html',
})
export class Cuenta implements AfterViewInit {
  private emojisAvatar: Record<string, string> = {
    nina: '👧',
    nino: '👦',
    nina_flor: '👩',
    nino_pluma: '🧑',
  };

  get emojiUsuario(): string {
    const avatar = this.auth.usuarioActual()?.avatar;
    return (avatar && this.emojisAvatar[avatar]) || '🙂';
  }

  // Misma familia de fotos que usan Personalizar y Accesorios (ver la nota
  // en accesorios.ts): las fotos estan en public/img/personaje/avatares/
  // con el nombre "<familia>-<tono sin #>.png". Aca se usa la misma foto
  // para que la tarjeta de arriba muestre a tu personaje de verdad y no
  // solo el emoji generico.
  private familiaAvatar: Record<string, 'nina' | 'nino'> = {
    nina: 'nina',
    nino: 'nino',
    nina_flor: 'nina',
    nino_pluma: 'nino',
  };

  imagenesFallidas = signal<Set<string>>(new Set());

  get imagenAvatar(): string | null {
    const avatar = this.auth.usuarioActual()?.avatar;
    const familia = avatar && this.familiaAvatar[avatar];
    if (!familia) {
      return null;
    }
    const tono = (this.auth.usuarioActual()?.tono_piel || '#f5d3a8').replace('#', '');
    return `img/personaje/avatares/${familia}-${tono}.png`;
  }

  // Clave unica por avatar + tono, para que el respaldo a emoji sea por
  // combinacion exacta (si falta la foto de un tono no oculta las demas).
  get claveImagenAvatar(): string {
    return `avatar_${this.auth.usuarioActual()?.avatar}_${this.auth.usuarioActual()?.tono_piel}`;
  }

  marcarImagenFallida(id: string) {
    if (this.imagenesFallidas().has(id)) {
      return;
    }
    const nuevo = new Set(this.imagenesFallidas());
    nuevo.add(id);
    this.imagenesFallidas.set(nuevo);
  }

  imagenFallo(id: string): boolean {
    return this.imagenesFallidas().has(id);
  }

  name = signal('');
  email = signal('');
  guardandoPerfil = signal(false);
  errorPerfil = signal('');
  exitoPerfil = signal(false);

  passwordActual = signal('');
  passwordNueva = signal('');
  passwordConfirmacion = signal('');
  guardandoPassword = signal(false);
  errorPassword = signal('');
  exitoPassword = signal(false);

  // Vincular / desvincular cuenta de Google.
  errorGoogle = signal('');
  exitoGoogle = signal('');
  procesandoGoogle = signal(false);

  get necesitaCrearPassword(): boolean {
    return this.auth.usuarioActual()?.password_usable === false;
  }

  // Eliminar cuenta: primero pregunta "seguro?", luego pide la contrasena
  // para confirmar, y recien ahi borra todo.
  confirmandoEliminar = signal(false);
  pidiendoPasswordEliminar = signal(false);
  passwordEliminar = signal('');
  eliminando = signal(false);
  errorEliminar = signal('');
  cuentaEliminada = signal(false);

  constructor(
    public auth: Auth,
    private router: Router
  ) {
    if (!this.auth.estaLogueado()) {
      this.router.navigate(['/login']);
      return;
    }

    const usuario = this.auth.usuarioActual();
    this.name.set(usuario?.name ?? '');
    this.email.set(usuario?.email ?? '');
  }

  ngAfterViewInit(): void {
    this.renderizarBotonGoogle();
  }

  private renderizarBotonGoogle(): void {
    // El boton de Google solo se dibuja cuando la cuenta TODAVIA no esta
    // vinculada (el contenedor "boton-google-vincular" solo existe en ese
    // caso). Si ya esta vinculada, solo se muestra "Desvincular".
    if (this.auth.usuarioActual()?.google_email) {
      return;
    }
    mostrarBotonGoogle('boton-google-vincular', environment.googleClientId, (credential) =>
      this.vincularGoogle(credential)
    );
  }

  onNameChange(valor: string) {
    this.name.set(valor);
  }

  onEmailChange(valor: string) {
    this.email.set(valor);
  }

  onPasswordActualChange(valor: string) {
    this.passwordActual.set(valor);
  }

  onPasswordNuevaChange(valor: string) {
    this.passwordNueva.set(valor);
  }

  onPasswordConfirmacionChange(valor: string) {
    this.passwordConfirmacion.set(valor);
  }

  guardarPerfil() {
    this.errorPerfil.set('');
    this.exitoPerfil.set(false);

    if (!this.name().trim() || !this.email().trim()) {
      this.errorPerfil.set('Completa tu nombre y correo.');
      return;
    }

    const errorNombre = errorDeNombre(this.name());
    if (errorNombre) {
      this.errorPerfil.set(errorNombre);
      return;
    }

    this.guardandoPerfil.set(true);
    this.auth.actualizarPerfil(this.name().trim(), this.email().trim()).subscribe({
      next: () => {
        this.guardandoPerfil.set(false);
        this.exitoPerfil.set(true);
      },
      error: (err) => {
        this.guardandoPerfil.set(false);
        const erroresValidacion = err?.error?.errors;
        if (erroresValidacion) {
          const primerCampo = Object.keys(erroresValidacion)[0];
          this.errorPerfil.set(erroresValidacion[primerCampo][0]);
        } else {
          this.errorPerfil.set(err?.error?.message ?? 'No se pudo actualizar tu cuenta.');
        }
      },
    });
  }

  cambiarPassword() {
    this.errorPassword.set('');
    this.exitoPassword.set(false);

    if (!this.necesitaCrearPassword && !this.passwordActual()) {
      this.errorPassword.set('Completa tu contrasena actual y la nueva.');
      return;
    }

    if (!this.passwordNueva()) {
      this.errorPassword.set('Escribe tu nueva contrasena.');
      return;
    }

    if (this.passwordNueva() !== this.passwordConfirmacion()) {
      this.errorPassword.set('Las contrasenas nuevas no coinciden.');
      return;
    }

    this.guardandoPassword.set(true);
    this.auth
      .actualizarPassword(this.passwordActual(), this.passwordNueva(), this.passwordConfirmacion())
      .subscribe({
        next: () => {
          this.guardandoPassword.set(false);
          this.exitoPassword.set(true);
          this.passwordActual.set('');
          this.passwordNueva.set('');
          this.passwordConfirmacion.set('');
        },
        error: (err) => {
          this.guardandoPassword.set(false);
          const erroresValidacion = err?.error?.errors;
          if (erroresValidacion) {
            const primerCampo = Object.keys(erroresValidacion)[0];
            this.errorPassword.set(erroresValidacion[primerCampo][0]);
          } else {
            this.errorPassword.set(err?.error?.message ?? 'No se pudo cambiar tu contrasena.');
          }
        },
      });
  }

  private vincularGoogle(credential: string) {
    this.errorGoogle.set('');
    this.exitoGoogle.set('');
    this.procesandoGoogle.set(true);

    this.auth.vincularGoogle(credential).subscribe({
      next: () => {
        this.procesandoGoogle.set(false);
        this.exitoGoogle.set('Tu cuenta de Google quedo vinculada.');
        // El contenedor del boton cambia (de "vincular" a "cambiar"), asi
        // que hay que esperar un momento a que Angular lo vuelva a dibujar
        // antes de volver a poner el boton de Google adentro.
        setTimeout(() => this.renderizarBotonGoogle(), 50);
      },
      error: (err) => {
        this.procesandoGoogle.set(false);
        this.errorGoogle.set(err?.error?.message ?? 'No se pudo vincular tu cuenta de Google.');
      },
    });
  }

  desvincularGoogle() {
    this.errorGoogle.set('');
    this.exitoGoogle.set('');
    this.procesandoGoogle.set(true);

    this.auth.desvincularGoogle().subscribe({
      next: () => {
        this.procesandoGoogle.set(false);
        this.exitoGoogle.set('Tu cuenta de Google fue desvinculada.');
        setTimeout(() => this.renderizarBotonGoogle(), 50);
      },
      error: (err) => {
        this.procesandoGoogle.set(false);
        this.errorGoogle.set(err?.error?.message ?? 'No se pudo desvincular tu cuenta de Google.');
      },
    });
  }

  // --- Eliminar cuenta ---

  pedirConfirmacionEliminar() {
    this.confirmandoEliminar.set(true);
    this.errorEliminar.set('');
  }

  confirmarEliminar() {
    this.confirmandoEliminar.set(false);
    this.pidiendoPasswordEliminar.set(true);
  }

  cancelarEliminar() {
    this.confirmandoEliminar.set(false);
    this.pidiendoPasswordEliminar.set(false);
    this.passwordEliminar.set('');
    this.errorEliminar.set('');
  }

  onPasswordEliminarChange(valor: string) {
    this.passwordEliminar.set(valor);
  }

  eliminarCuenta() {
    this.errorEliminar.set('');

    if (!this.passwordEliminar()) {
      this.errorEliminar.set('Escribe tu contrasena para confirmar.');
      return;
    }

    this.eliminando.set(true);
    this.auth.eliminarCuenta(this.passwordEliminar()).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.cuentaEliminada.set(true);
        // El correo y el nombre de usuario quedan libres apenas se borra la
        // cuenta; esperamos un momento para que la persona alcance a leer el
        // mensaje antes de mandarla a login.
        setTimeout(() => this.auth.logout(), 1800);
      },
      error: (err) => {
        this.eliminando.set(false);
        const erroresValidacion = err?.error?.errors;
        if (erroresValidacion) {
          const primerCampo = Object.keys(erroresValidacion)[0];
          this.errorEliminar.set(erroresValidacion[primerCampo][0]);
        } else {
          this.errorEliminar.set(err?.error?.message ?? 'No se pudo eliminar tu cuenta.');
        }
      },
    });
  }
}
