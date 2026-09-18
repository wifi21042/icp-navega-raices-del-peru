import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { errorDeNombre } from '../../core/utils/validar-nombre';

interface OpcionAvatar {
  id: string;
  emoji: string;
  // "familia" dice que set de fotos usar (nina o nino).
  familia: 'nina' | 'nino';
}

interface OpcionPeinado {
  id: string;
  icono: string;
  imagen: string;
}

interface OpcionRopa {
  id: string;
  imagen: string;
  etiqueta: string;
  // A que avatar (nina o nino) le corresponde este traje. Cada avatar
  // solo muestra los suyos (ver ropasDisponibles).
  familia: 'nina' | 'nino';
}

interface OpcionFondo {
  id: string;
  imagen: string;
  etiqueta: string;
}

@Component({
  imports: [RouterLink],
  selector: 'app-personalizar',
  styleUrl: './personalizar.scss',
  templateUrl: './personalizar.html',
})
export class Personalizar {
  // NOTA: por ahora el "personaje" se arma con emojis y colores para
  // peinados (todavia no tenemos esas ilustraciones). Los AVATARES si ya
  // tienen fotos reales, una por cada combinacion de familia (nina/nino) y
  // tono de piel: estan guardadas en public/img/personaje/avatares/ con el
  // nombre "<familia>-<tono sin #>.png" (por ejemplo nina-f5d3a8.png).
  // Cuando el usuario cambia el tono de piel, la foto del personaje cambia
  // sola porque el nombre del archivo se arma con el tono seleccionado.
  // Solo dos opciones: nina y nino (antes habia 4, pero las otras dos
  // usaban las mismas fotos que estas, asi que no se notaba la diferencia).
  avatares: OpcionAvatar[] = [
    { id: 'nina', emoji: '👧', familia: 'nina' },
    { id: 'nino', emoji: '👦', familia: 'nino' },
  ];

  peinados: OpcionPeinado[] = [
    { id: 'trenzas', icono: '🎀', imagen: 'img/personaje/peinados/trenzas.png' },
    { id: 'corto', icono: '✂️', imagen: 'img/personaje/peinados/corto.png' },
    { id: 'rizado', icono: '🌀', imagen: 'img/personaje/peinados/rizado.png' },
    { id: 'suelto', icono: '💫', imagen: 'img/personaje/peinados/suelto.png' },
  ];

  // Se sacaron "#7a4a2b" (Marron oscuro) y "#4a2c1a" (Marron muy oscuro/
  // Chocolate): las dos fotos se veian casi igual, asi que por ahora se deja
  // solo hasta el tono mas oscuro que si tiene una foto bien distinta.
  tonosPiel: string[] = ['#f5d3a8', '#e8b382', '#c98c53', '#a9673a'];

  // Trajes tipicos de verdad (fotos), a pedido de Alex, en vez de los
  // cuadrados de color de antes. Cada uno es solo de nina o solo de nino
  // (ver ropasDisponibles): al elegir un avatar nino solo se muestran
  // trajes de nino, y al reves.
  ropas: OpcionRopa[] = [
    { id: 'costa_nina_1', imagen: 'img/personaje/ropa/costa-nina-1.jpeg', etiqueta: 'Traje de la Costa', familia: 'nina' },
    { id: 'costa_nina_2', imagen: 'img/personaje/ropa/costa-nina-2.jpeg', etiqueta: 'Traje de la Costa 2', familia: 'nina' },
    { id: 'costa_nina_3', imagen: 'img/personaje/ropa/costa-nina-3.jpeg', etiqueta: 'Traje de la Costa 3', familia: 'nina' },
    { id: 'selva_nina', imagen: 'img/personaje/ropa/selva-nina.jpeg', etiqueta: 'Traje de la Selva', familia: 'nina' },
    { id: 'sierra_nina', imagen: 'img/personaje/ropa/sierra-nina.jpeg', etiqueta: 'Traje de la Sierra', familia: 'nina' },
    { id: 'costa_nino', imagen: 'img/personaje/ropa/costa-nino.jpeg', etiqueta: 'Traje de la Costa', familia: 'nino' },
    { id: 'selva_nino_1', imagen: 'img/personaje/ropa/selva-nino-1.jpeg', etiqueta: 'Traje de la Selva', familia: 'nino' },
    { id: 'selva_nino_2', imagen: 'img/personaje/ropa/selva-nino-2.jpeg', etiqueta: 'Traje de la Selva 2', familia: 'nino' },
    { id: 'sierra_nino', imagen: 'img/personaje/ropa/sierra-nino.jpeg', etiqueta: 'Traje de la Sierra', familia: 'nino' },
    { id: 'sierra_nino_1', imagen: 'img/personaje/ropa/sierra-nino-1.jpeg', etiqueta: 'Traje de la Sierra 2', familia: 'nino' },
    { id: 'sierra_nino_2', imagen: 'img/personaje/ropa/sierra-nino-2.jpeg', etiqueta: 'Traje de la Sierra 3', familia: 'nino' },
  ];

  // Fondo detras del personaje en la vista previa (solo visual, no se
  // guarda en el servidor por ahora).
  fondos: OpcionFondo[] = [
    { id: 'costa', imagen: 'img/fondo-costa.jpeg', etiqueta: 'Costa' },
    { id: 'sierra', imagen: 'img/fondo-sierra.jpeg', etiqueta: 'Sierra' },
    { id: 'sierra2', imagen: 'img/fondo-sierra-2.jpeg', etiqueta: 'Sierra 2' },
    { id: 'selva', imagen: 'img/selva.jpeg', etiqueta: 'Selva' },
  ];

  // Guarda que imagenes ya intentamos cargar y fallaron (todavia no existe
  // el archivo), para mostrar el emoji de respaldo en esos casos nada mas.
  // La clave incluye el tono de piel (ver imagenParaAvatar), asi que si
  // falta una foto de un tono especifico no afecta a los demas tonos.
  imagenesFallidas = signal<Set<string>>(new Set());

  indiceAvatar = signal(0);
  peinadoSeleccionado = signal(this.peinados[0].id);
  tonoSeleccionado = signal(this.tonosPiel[0]);
  ropaSeleccionada = signal(this.ropas[0].id);
  fondoSeleccionado = signal(this.fondos[0].id);
  nombrePersonaje = signal('');

  guardando = signal(false);
  error = signal('');

  constructor(
    public auth: Auth,
    private router: Router
  ) {
    if (!this.auth.estaLogueado()) {
      this.router.navigate(['/login']);
      return;
    }

    // Si ya tiene un personaje hecho (lo esta editando, no creando uno por
    // primera vez), precargamos todo lo que ya eligio antes.
    const usuario = this.auth.usuarioActual();
    if (usuario?.personaje_completo) {
      const indiceExistente = this.avatares.findIndex((a) => a.id === usuario.avatar);
      if (indiceExistente !== -1) {
        this.indiceAvatar.set(indiceExistente);
      }

      if (usuario.peinado) {
        this.peinadoSeleccionado.set(usuario.peinado);
      }

      if (usuario.tono_piel) {
        this.tonoSeleccionado.set(usuario.tono_piel);
      }

      if (usuario.ropa) {
        this.ropaSeleccionada.set(usuario.ropa);
      }

      if (usuario.nombre_personaje) {
        this.nombrePersonaje.set(usuario.nombre_personaje);
      }

      // Por si el traje guardado ya no existe (por ejemplo, una cuenta
      // vieja con los colores de antes en vez de las fotos de ahora).
      this.asegurarRopaValida();
    }
  }

  get avatarActual(): OpcionAvatar {
    return this.avatares[this.indiceAvatar()];
  }

  // Solo los trajes del avatar elegido ahora (nina o nino).
  get ropasDisponibles(): OpcionRopa[] {
    return this.ropas.filter((r) => r.familia === this.avatarActual.familia);
  }

  get ropaActual(): OpcionRopa {
    const disponibles = this.ropasDisponibles;
    return disponibles.find((r) => r.id === this.ropaSeleccionada()) ?? disponibles[0];
  }

  // Si el traje elegido no es de la familia del avatar actual (por
  // ejemplo, se cambio de nina a nino), pasa al primer traje valido para
  // que la seleccion que se guarda siempre corresponda con el avatar que
  // se ve en la vista previa.
  private asegurarRopaValida() {
    if (!this.ropasDisponibles.some((r) => r.id === this.ropaSeleccionada())) {
      this.ropaSeleccionada.set(this.ropasDisponibles[0].id);
    }
  }

  get fondoActual(): OpcionFondo {
    return this.fondos.find((f) => f.id === this.fondoSeleccionado()) ?? this.fondos[0];
  }

  // Arma la ruta de la foto para un avatar segun el tono de piel elegido
  // ahora mismo. Ej: familia "nina" + tono "#f5d3a8" ->
  // /img/personaje/avatares/nina-f5d3a8.png
  imagenParaAvatar(avatar: OpcionAvatar): string {
    const tono = this.tonoSeleccionado().replace('#', '');
    return `img/personaje/avatares/${avatar.familia}-${tono}.png`;
  }

  get imagenAvatarActual(): string {
    return this.imagenParaAvatar(this.avatarActual);
  }

  // Clave unica por avatar + tono, para que el respaldo a emoji sea por
  // combinacion exacta (si falta la foto de un tono no oculta las demas).
  claveImagenAvatar(avatar: OpcionAvatar): string {
    return `avatar_${avatar.id}_${this.tonoSeleccionado()}`;
  }

  avatarAnterior() {
    this.indiceAvatar.set((this.indiceAvatar() - 1 + this.avatares.length) % this.avatares.length);
    this.asegurarRopaValida();
  }

  avatarSiguiente() {
    this.indiceAvatar.set((this.indiceAvatar() + 1) % this.avatares.length);
    this.asegurarRopaValida();
  }

  seleccionarAvatar(indice: number) {
    this.indiceAvatar.set(indice);
    this.asegurarRopaValida();
  }

  seleccionarPeinado(id: string) {
    this.peinadoSeleccionado.set(id);
  }

  seleccionarTono(color: string) {
    this.tonoSeleccionado.set(color);
  }

  seleccionarRopa(id: string) {
    this.ropaSeleccionada.set(id);
  }

  seleccionarFondo(id: string) {
    this.fondoSeleccionado.set(id);
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

  onNombreChange(valor: string) {
    this.nombrePersonaje.set(valor);
  }

  // Unica salida que tiene alguien que todavia no termino su personaje:
  // no puede navegar a ninguna otra pagina (el guard lo manda de vuelta
  // aqui), pero si puede cerrar sesion cuando quiera.
  cerrarSesion() {
    this.auth.logout();
  }

  listo() {
    this.error.set('');

    const errorNombre = errorDeNombre(this.nombrePersonaje());
    if (errorNombre) {
      this.error.set(errorNombre);
      return;
    }

    this.guardando.set(true);

    this.auth
      .guardarPersonaje({
        avatar: this.avatarActual.id,
        peinado: this.peinadoSeleccionado(),
        tono_piel: this.tonoSeleccionado(),
        ropa: this.ropaSeleccionada(),
        nombre_personaje: this.nombrePersonaje().trim(),
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.guardando.set(false);
          const erroresValidacion = err?.error?.errors;
          if (erroresValidacion) {
            const primerCampo = Object.keys(erroresValidacion)[0];
            this.error.set(erroresValidacion[primerCampo][0]);
          } else {
            this.error.set(err?.error?.message ?? 'No se pudo guardar tu personaje.');
          }
        },
      });
  }
}
