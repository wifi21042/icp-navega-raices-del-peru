import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { errorDeNombre } from '../../core/utils/validar-nombre';

interface OpcionAvatar {
  id: string;
  emoji: string;
  // "familia" dice que set de fotos usar (nina o nino): las 4 opciones de
  // avatar comparten solo 2 familias de fotos por ahora.
  familia: 'nina' | 'nino';
}

interface OpcionPeinado {
  id: string;
  icono: string;
  imagen: string;
}

interface OpcionRopa {
  id: string;
  color: string;
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
  avatares: OpcionAvatar[] = [
    { id: 'nina', emoji: '👧', familia: 'nina' },
    { id: 'nino', emoji: '👦', familia: 'nino' },
    { id: 'nina_flor', emoji: '👩', familia: 'nina' },
    { id: 'nino_pluma', emoji: '🧑', familia: 'nino' },
  ];

  peinados: OpcionPeinado[] = [
    { id: 'trenzas', icono: '🎀', imagen: '/img/personaje/peinados/trenzas.png' },
    { id: 'corto', icono: '✂️', imagen: '/img/personaje/peinados/corto.png' },
    { id: 'rizado', icono: '🌀', imagen: '/img/personaje/peinados/rizado.png' },
    { id: 'suelto', icono: '💫', imagen: '/img/personaje/peinados/suelto.png' },
  ];

  // Se sacaron "#7a4a2b" (Marron oscuro) y "#4a2c1a" (Marron muy oscuro/
  // Chocolate): las dos fotos se veian casi igual, asi que por ahora se deja
  // solo hasta el tono mas oscuro que si tiene una foto bien distinta.
  tonosPiel: string[] = ['#f5d3a8', '#e8b382', '#c98c53', '#a9673a'];

  ropas: OpcionRopa[] = [
    { id: 'poncho_morado', color: '#6c3fa1', etiqueta: 'Poncho morado' },
    { id: 'poncho_rojo', color: '#c0392b', etiqueta: 'Poncho rojo' },
    { id: 'chaleco_verde', color: '#2f6b3a', etiqueta: 'Chaleco verde' },
    { id: 'poncho_negro', color: '#2b2b2b', etiqueta: 'Poncho negro' },
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
    }
  }

  get avatarActual(): OpcionAvatar {
    return this.avatares[this.indiceAvatar()];
  }

  get ropaActual(): OpcionRopa {
    return this.ropas.find((r) => r.id === this.ropaSeleccionada()) ?? this.ropas[0];
  }

  // Arma la ruta de la foto para un avatar segun el tono de piel elegido
  // ahora mismo. Ej: familia "nina" + tono "#f5d3a8" ->
  // /img/personaje/avatares/nina-f5d3a8.png
  imagenParaAvatar(avatar: OpcionAvatar): string {
    const tono = this.tonoSeleccionado().replace('#', '');
    return `/img/personaje/avatares/${avatar.familia}-${tono}.png`;
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
  }

  avatarSiguiente() {
    this.indiceAvatar.set((this.indiceAvatar() + 1) % this.avatares.length);
  }

  seleccionarAvatar(indice: number) {
    this.indiceAvatar.set(indice);
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
