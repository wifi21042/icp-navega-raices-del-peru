import { Component, ElementRef, HostListener, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { interval } from 'rxjs';
import { Amigo, Auth, Aviso, MinijuegoResumen } from '../../core/services/auth';

// Cada cuantos milisegundos se revisa si hay solicitudes o avisos nuevos,
// para que el avisito de "Comunidad" y el ranking se actualicen solos.
const INTERVALO_ACTUALIZACION_MS = 10000;

interface Juego extends MinijuegoResumen {
  imagen: string;
}

// Las imagenes se quedan aca (el servidor solo manda el id/titulo/puntos/
// nivel_requerido/bloqueado de cada minijuego).
const IMAGENES_JUEGO: Record<string, string> = {
  'aventura-andina': '/img/aventura-andina-personaje.jpg',
  'sabores-peru': '/img/costa.jpeg',
  'tesoros-amazonicos': '/img/selva.jpeg',
  'ritmos-danzas': '/img/danza.jpeg',
};

// Para quien todavia no tiene cuenta: el servidor no deja pedir la lista
// de minijuegos sin iniciar sesion (necesita saber tu nivel para decir
// cuales estan bloqueados), asi que a un visitante se le muestra esta
// version fija, sin candados, solo para que vea que hay para jugar.
// Los puntos siguen la misma regla que el servidor: nivel_requerido x 100.
const JUEGOS_INVITADO: Juego[] = [
  { id: 'aventura-andina', titulo: 'Aventura Andina', descripcion: 'Explora la sierra y descubre sus costumbres.', imagen: IMAGENES_JUEGO['aventura-andina'], puntos: 100, color: 'morado', nivel_requerido: 1, dificultad: 'facil', bloqueado: false },
  { id: 'ritmos-danzas', titulo: 'Ritmos y Danzas', descripcion: 'Aprende sobre nuestras danzas tipicas.', imagen: IMAGENES_JUEGO['ritmos-danzas'], puntos: 100, color: 'azul', nivel_requerido: 1, dificultad: 'facil', bloqueado: false },
  { id: 'sabores-peru', titulo: 'Sabores del Peru', descripcion: 'Descubre platos tipicos de cada region.', imagen: IMAGENES_JUEGO['sabores-peru'], puntos: 300, color: 'verde', nivel_requerido: 3, dificultad: 'medio', bloqueado: false },
  { id: 'tesoros-amazonicos', titulo: 'Tesoros Amazonicos', descripcion: 'Conoce la cultura y tradiciones de la selva.', imagen: IMAGENES_JUEGO['tesoros-amazonicos'], puntos: 500, color: 'naranja', nivel_requerido: 5, dificultad: 'dificil', bloqueado: false },
];

@Component({
  imports: [RouterLink, RouterLinkActive, DecimalPipe],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  // Mismos emojis usados en la pagina de personalizar, para mostrar el
  // avatar elegido por el usuario aqui en el header (respaldo si todavia
  // no existe la foto real de ese avatar + tono).
  private emojisAvatar: Record<string, string> = {
    nina: '👧',
    nino: '👦',
    nina_flor: '👩',
    nino_pluma: '🧑',
  };

  // Misma familia de fotos que usa Personalizar/Accesorios: una foto real
  // por cada combinacion de familia (nina/nino) y tono de piel, guardada en
  // public/img/personaje/avatares/<familia>-<tono sin #>.png
  private familiaAvatar: Record<string, 'nina' | 'nino'> = {
    nina: 'nina',
    nino: 'nino',
    nina_flor: 'nina',
    nino_pluma: 'nino',
  };

  // Guarda que fotos ya intentamos cargar y fallaron, para mostrar el emoji
  // de respaldo solo en esos casos (por ejemplo, un amigo cuyo tono_piel es
  // viejo y ya no tiene foto).
  imagenesFallidas = signal<Set<string>>(new Set());

  menuAbierto = signal(false);

  // Menu de navegacion "hamburguesa" para celular y tablet: en pantallas
  // angostas los links (Inicio, Juegos, Retos, etc.) se esconden en este
  // menu desplegable en vez de amontonarse en varias filas.
  menuNavAbierto = signal(false);

  // Ranking privado: solo se muestra a los amigos que el usuario agrego,
  // nunca un ranking mundial (por privacidad, esto es para un colegio).
  ranking = signal<Amigo[]>([]);
  cargandoRanking = signal(true);

  // Numero de solicitudes de amistad esperando respuesta, para el avisito
  // junto a "Comunidad" en el menu.
  solicitudesPendientes = signal(0);

  // Avisos discretos (por ejemplo, "ya no eres amigo de esa persona" cuando
  // alguien te bloquea). No dicen quien fue, solo informan el cambio.
  avisos = signal<Aviso[]>([]);

  constructor(
    public auth: Auth,
    private elementoActual: ElementRef<HTMLElement>
  ) {
    if (this.auth.estaLogueado()) {
      this.cargarRanking();
      this.cargarSolicitudesPendientes();
      this.cargarAvisos();
      this.cargarJuegos();

      // Revisa cada cierto tiempo si llego una solicitud nueva o un aviso,
      // para que no haya que refrescar la pagina a mano para verlo.
      interval(INTERVALO_ACTUALIZACION_MS)
        .pipe(takeUntilDestroyed())
        .subscribe(() => {
          this.cargarRanking();
          this.cargarSolicitudesPendientes();
          this.cargarAvisos();
        });
    } else {
      this.cargandoRanking.set(false);
      this.juegos.set(JUEGOS_INVITADO);
    }
  }

  private cargarJuegos() {
    this.auth.listarMinijuegos().subscribe({
      next: (respuesta) => {
        this.juegos.set(
          respuesta.minijuegos.map((juego) => ({
            ...juego,
            imagen: IMAGENES_JUEGO[juego.id] ?? '/img/raices-del-peru.jpeg',
          }))
        );
      },
      // Si falla (token vencido, servidor caido, etc.) mostramos igual el
      // catalogo de invitado en vez de dejar la seccion vacia, para que
      // nunca se vea "🎮 Juegos Destacados" sin ninguna tarjeta.
      error: () => {
        this.juegos.set(JUEGOS_INVITADO);
      },
    });
  }

  private cargarRanking() {
    this.auth.listarAmigos().subscribe({
      next: (respuesta) => {
        this.ranking.set(respuesta.amigos);
        this.cargandoRanking.set(false);
      },
      error: () => {
        this.cargandoRanking.set(false);
      },
    });
  }

  private cargarSolicitudesPendientes() {
    this.auth.solicitudesRecibidas().subscribe({
      next: (respuesta) => this.solicitudesPendientes.set(respuesta.solicitudes.length),
      error: () => {},
    });
  }

  private cargarAvisos() {
    this.auth.obtenerAvisos().subscribe({
      next: (respuesta) => {
        if (respuesta.avisos.length > 0) {
          this.avisos.update((lista) => [...lista, ...respuesta.avisos]);
        }
      },
      error: () => {},
    });
  }

  get emojiUsuario(): string {
    const avatar = this.auth.usuarioActual()?.avatar;
    return (avatar && this.emojisAvatar[avatar]) || '🙂';
  }

  // Foto real (avatar + tono de piel) del usuario que tiene la sesion
  // iniciada, para el circulo del menu de arriba a la derecha.
  get imagenUsuario(): string | null {
    return this.imagenPara(this.auth.usuarioActual()?.avatar, this.auth.usuarioActual()?.tono_piel);
  }

  get claveImagenUsuario(): string {
    return `usuario_${this.auth.usuarioActual()?.avatar}_${this.auth.usuarioActual()?.tono_piel}`;
  }

  // Misma idea para cada amigo del ranking: si tiene avatar y tono de piel
  // guardados, arma la ruta de su foto real; si no, se usa el emoji.
  imagenAmigo(amigo: Amigo): string | null {
    return this.imagenPara(amigo.avatar, amigo.tono_piel);
  }

  claveImagenAmigo(amigo: Amigo): string {
    return `amigo_${amigo.id}_${amigo.avatar}_${amigo.tono_piel}`;
  }

  emojiAmigo(amigo: Amigo): string {
    return (amigo.avatar && this.emojisAvatar[amigo.avatar]) || '🙂';
  }

  private imagenPara(avatar: string | null | undefined, tonoPiel: string | null | undefined): string | null {
    const familia = avatar && this.familiaAvatar[avatar];
    if (!familia || !tonoPiel) {
      return null;
    }
    return `/img/personaje/avatares/${familia}-${tonoPiel.replace('#', '')}.png`;
  }

  marcarImagenFallida(clave: string) {
    if (this.imagenesFallidas().has(clave)) {
      return;
    }
    const nuevo = new Set(this.imagenesFallidas());
    nuevo.add(clave);
    this.imagenesFallidas.set(nuevo);
  }

  imagenFallo(clave: string): boolean {
    return this.imagenesFallidas().has(clave);
  }

  toggleMenu() {
    this.menuAbierto.update((valor) => !valor);
  }

  cerrarMenu() {
    this.menuAbierto.set(false);
  }

  toggleMenuNav() {
    this.menuNavAbierto.update((valor) => !valor);
  }

  cerrarMenuNav() {
    this.menuNavAbierto.set(false);
  }

  cerrarSesion() {
    this.cerrarMenu();
    this.auth.logout();
  }

  cerrarAviso(id: number) {
    this.avisos.update((lista) => lista.filter((aviso) => aviso.id !== id));
  }

  @HostListener('document:click', ['$event'])
  alHacerClickFuera(evento: MouseEvent) {
    if (this.menuAbierto() && !this.elementoActual.nativeElement.contains(evento.target as Node)) {
      this.cerrarMenu();
    }
  }

  // Imagenes reales del proyecto, guardadas en public/img/
  // (todo lo que este en la carpeta "public" se sirve desde la raiz, por eso
  // se referencia como '/img/archivo.jpeg', sin escribir "public").
  escudo = '/img/escudo.jpg';
  imagenHero = '/img/raices-del-peru.jpeg';

  // Se llena al cargar la pagina, pidiendo la lista real al servidor (con
  // el nivel requerido y si esta bloqueado o no para el usuario actual).
  // Mientras no haya iniciado sesion se deja vacio: sin cuenta no hay
  // nivel que comparar, asi que no tiene sentido mostrar "bloqueado".
  juegos = signal<Juego[]>([]);
}
