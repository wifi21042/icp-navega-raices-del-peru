import { Component, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth, MinijuegoResumen } from '../../core/services/auth';
import { calcularNivel, tablaNiveles, FilaNivel } from '../../core/utils/niveles';

interface JuegoConImagen extends MinijuegoResumen {
  imagen: string;
}

const IMAGENES_JUEGO: Record<string, string> = {
  'aventura-andina': '/img/aventura-andina-personaje.jpg',
  'sabores-peru': '/img/costa.jpeg',
  'tesoros-amazonicos': '/img/selva.jpeg',
  'ritmos-danzas': '/img/danza.jpeg',
};

// Mismo catalogo fijo que se usa en el inicio para quien no tiene sesion
// iniciada (el servidor no puede decir que esta "bloqueado" sin saber tu
// nivel). Los puntos siguen la misma regla que el servidor:
// nivel_requerido x 100.
const JUEGOS_INVITADO: JuegoConImagen[] = [
  { id: 'aventura-andina', titulo: 'Aventura Andina', descripcion: 'Explora la sierra y descubre sus costumbres.', imagen: IMAGENES_JUEGO['aventura-andina'], puntos: 100, color: 'morado', nivel_requerido: 1, dificultad: 'facil', bloqueado: false },
  { id: 'ritmos-danzas', titulo: 'Ritmos y Danzas', descripcion: 'Aprende sobre nuestras danzas tipicas.', imagen: IMAGENES_JUEGO['ritmos-danzas'], puntos: 100, color: 'azul', nivel_requerido: 1, dificultad: 'facil', bloqueado: false },
  { id: 'sabores-peru', titulo: 'Sabores del Peru', descripcion: 'Descubre platos tipicos de cada region.', imagen: IMAGENES_JUEGO['sabores-peru'], puntos: 300, color: 'verde', nivel_requerido: 3, dificultad: 'medio', bloqueado: false },
  { id: 'tesoros-amazonicos', titulo: 'Tesoros Amazonicos', descripcion: 'Conoce la cultura y tradiciones de la selva.', imagen: IMAGENES_JUEGO['tesoros-amazonicos'], puntos: 500, color: 'naranja', nivel_requerido: 5, dificultad: 'dificil', bloqueado: false },
];

const ETIQUETAS_DIFICULTAD: Record<string, string> = {
  facil: '🟢 Facil',
  medio: '🟡 Medio',
  dificil: '🔴 Dificil',
};

@Component({
  imports: [RouterLink, DecimalPipe],
  selector: 'app-juegos',
  styleUrl: './juegos.scss',
  templateUrl: './juegos.html',
})
export class JuegosPagina {
  cargando = signal(true);
  juegos = signal<JuegoConImagen[]>([]);

  // Menu desplegable con los 100 niveles y cuantos puntos pide cada uno,
  // para que se vea cuanto falta para subir sin tener que ir a Recompensas.
  mostrarNiveles = signal(false);
  niveles: FilaNivel[] = tablaNiveles();

  constructor(public auth: Auth) {
    if (this.auth.estaLogueado()) {
      // Trae los puntos actualizados del servidor para que el nivel y el
      // progreso no se queden pegados en un numero viejo.
      this.auth.refrescarUsuario().subscribe({ error: () => {} });

      this.auth.listarMinijuegos().subscribe({
        next: (respuesta) => {
          this.cargando.set(false);
          this.juegos.set(
            respuesta.minijuegos.map((juego) => ({
              ...juego,
              imagen: IMAGENES_JUEGO[juego.id] ?? '/img/raices-del-peru.jpeg',
            }))
          );
        },
        error: () => {
          this.cargando.set(false);
          this.juegos.set(JUEGOS_INVITADO);
        },
      });
    } else {
      this.cargando.set(false);
      this.juegos.set(JUEGOS_INVITADO);
    }
  }

  // Nivel 1 empieza en 0 puntos, el nivel 2 pide 1000, el 3 pide 3000, y de
  // ahi en adelante lo que hace falta para el siguiente nivel sube de a 200
  // cada vez, hasta el nivel 100 (el maximo por ahora). Misma formula que
  // usan Retos y Recompensas.
  private get infoNivel() {
    return calcularNivel(this.auth.usuarioActual()?.puntos ?? 0);
  }

  get nivelActual(): number {
    return this.infoNivel.nivel;
  }

  get esNivelMaximo(): boolean {
    return this.infoNivel.esNivelMaximo;
  }

  get progresoPuntos(): number {
    const info = this.infoNivel;
    return (this.auth.usuarioActual()?.puntos ?? 0) - info.puntosNivelActual;
  }

  get metaPuntos(): number {
    const info = this.infoNivel;
    return info.esNivelMaximo ? this.progresoPuntos : (info.puntosProximoNivel as number) - info.puntosNivelActual;
  }

  get porcentajeProgreso(): number {
    return this.infoNivel.progreso;
  }

  toggleNiveles() {
    this.mostrarNiveles.update((valor) => !valor);
  }

  etiquetaDificultad(dificultad: string): string {
    return ETIQUETAS_DIFICULTAD[dificultad] ?? dificultad;
  }

  // Agrupa los juegos por dificultad, en el orden facil -> medio -> dificil,
  // para mostrar cada grupo en su propia seccion.
  juegosPorDificultad(dificultad: string): JuegoConImagen[] {
    return this.juegos().filter((juego) => juego.dificultad === dificultad);
  }
}
