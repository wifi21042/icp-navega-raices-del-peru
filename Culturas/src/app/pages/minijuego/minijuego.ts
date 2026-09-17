import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth, MinijuegoDetalle, ResultadoMinijuego, RondaMinijuego } from '../../core/services/auth';
import { calcularNivel } from '../../core/utils/niveles';

// Mismas imagenes que ya se usan en el inicio para cada juego, para que la
// pantalla del minijuego se sienta parte de la misma tarjeta que se toco.
const IMAGENES_FONDO: Record<string, string> = {
  'aventura-andina': 'img/aventura-andina-personaje.jpg',
  'sabores-peru': 'img/costa.jpeg',
  'tesoros-amazonicos': 'img/selva.jpeg',
  'ritmos-danzas': 'img/danza.jpeg',
};

const LETRAS = ['A', 'B', 'C', 'D'];

// Mismos colores que las tarjetas de juegos del inicio, para que cada
// minijuego se sienta "de su color" (los acentos, la barra de progreso, el
// boton de siguiente, etc.).
const COLORES_TEMA: Record<string, string> = {
  morado: '#6c3fa1',
  verde: '#2f6b3a',
  naranja: '#d97a2b',
  azul: '#2b6ca3',
};

const ICONOS_JUEGO: Record<string, string> = {
  'aventura-andina': '🏔️',
  'sabores-peru': '🍽️',
  'tesoros-amazonicos': '🌴',
  'ritmos-danzas': '💃',
};

// Etiquetas para las 3 rondas de cada minijuego: cada una mas dificil y
// con mas puntos que la anterior (el multiplicador real lo manda el
// servidor, esto es solo para mostrar el color/nombre).
const ETIQUETAS_RONDA: Record<number, string> = {
  1: '🟢 Facil',
  2: '🟡 Medio',
  3: '🔴 Dificil',
};

@Component({
  imports: [RouterLink],
  selector: 'app-minijuego',
  styleUrl: './minijuego.scss',
  templateUrl: './minijuego.html',
})
export class MinijuegoPagina {
  private emojisAvatar: Record<string, string> = {
    nina: '👧',
    nino: '👦',
    nina_flor: '👩',
    nino_pluma: '🧑',
  };

  private id!: string;

  // "rondas": eligiendo que ronda jugar (facil/medio/dificil).
  // "jugando": contestando las 5 preguntas de la ronda elegida.
  // El resultado final se muestra con "terminado()", como antes.
  vista = signal<'rondas' | 'jugando'>('rondas');

  cargando = signal(true);
  error = signal('');
  juego = signal<MinijuegoDetalle | null>(null);

  rondas = signal<RondaMinijuego[]>([]);
  tituloJuego = signal('');
  colorJuego = signal<string | null>(null);
  rondaActual = signal<number | null>(null);

  indicePregunta = signal(0);
  respuestaSeleccionada = signal<number | null>(null);
  respuestas = signal<number[]>([]);

  enviando = signal(false);
  terminado = signal(false);
  resultado = signal<ResultadoMinijuego | null>(null);

  constructor(
    public auth: Auth,
    private router: Router,
    private route: ActivatedRoute
  ) {
    if (!this.auth.estaLogueado()) {
      this.router.navigate(['/login']);
      return;
    }

    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.cargarRondas();
  }

  private cargarRondas() {
    this.vista.set('rondas');
    this.cargando.set(true);
    this.error.set('');

    this.auth.listarRondas(this.id).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.tituloJuego.set(respuesta.titulo);
        this.colorJuego.set(respuesta.color);
        this.rondas.set(respuesta.rondas);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo cargar este minijuego.');
      },
    });
  }

  elegirRonda(ronda: RondaMinijuego) {
    if (!ronda.desbloqueada) {
      return;
    }
    this.rondaActual.set(ronda.ronda);
    this.vista.set('jugando');
    this.cargar();
  }

  etiquetaRonda(ronda: number): string {
    return ETIQUETAS_RONDA[ronda] ?? `Ronda ${ronda}`;
  }

  volverARondas() {
    this.cargarRondas();
  }

  private cargar() {
    const ronda = this.rondaActual();
    if (ronda === null) {
      return;
    }

    this.cargando.set(true);
    this.error.set('');
    this.indicePregunta.set(0);
    this.respuestaSeleccionada.set(null);
    this.respuestas.set([]);
    this.terminado.set(false);
    this.resultado.set(null);

    this.auth.obtenerMinijuego(this.id, ronda).subscribe({
      next: (juego) => {
        this.cargando.set(false);
        this.juego.set(juego);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo cargar esta ronda.');
      },
    });
  }

  get imagenFondo(): string {
    return IMAGENES_FONDO[this.id] ?? 'img/raices-del-peru.jpeg';
  }

  get emojiUsuario(): string {
    const avatar = this.auth.usuarioActual()?.avatar;
    return (avatar && this.emojisAvatar[avatar]) || '🙂';
  }

  get nivelActual(): number {
    return calcularNivel(this.auth.usuarioActual()?.puntos ?? 0).nivel;
  }

  get puntosActuales(): number {
    return this.auth.usuarioActual()?.puntos ?? 0;
  }

  get colorTema(): string {
    const color = this.juego()?.color ?? this.colorJuego();
    return (color && COLORES_TEMA[color]) || COLORES_TEMA['verde'];
  }

  get iconoJuego(): string {
    return ICONOS_JUEGO[this.id] ?? '🎮';
  }

  // Ojo: estas son signals de verdad (computed), no getters normales. Con
  // getters, el "@if" y el "@for" del template no siempre se enteraban de
  // que la pregunta habia cambiado al apretar "Siguiente pregunta", asi
  // que se quedaba pegado en la primera pregunta. Con computed() funciona
  // igual que el resto de la app (Retos, Recompensas), que ya usa signals.
  preguntaActual = computed(() => this.juego()?.preguntas[this.indicePregunta()] ?? null);

  esUltimaPregunta = computed(() => {
    const juego = this.juego();
    return !!juego && this.indicePregunta() === juego.preguntas.length - 1;
  });

  // Estrellas "en vivo": aplica la misma idea que el servidor (todo bien =
  // 3, la mayoria bien = 2, al menos una bien = 1) pero sobre las
  // respuestas contestadas hasta el momento, para que la persona vea como
  // le va mientras juega. El resultado final y real siempre lo calcula el
  // servidor cuando termina.
  estrellasEnVivo = computed(() => {
    const juego = this.juego();
    if (!juego) {
      return 0;
    }

    const total = juego.preguntas.length;
    const respuestas = this.respuestas();
    const correctas = respuestas.filter((respuesta, indice) => respuesta === juego.preguntas[indice].correcta).length;

    if (correctas === total && respuestas.length === total) {
      return 3;
    }
    if (correctas >= Math.ceil(total * 0.6)) {
      return 2;
    }
    if (correctas >= 1) {
      return 1;
    }
    return 0;
  });

  letra(indice: number): string {
    return LETRAS[indice] ?? '?';
  }

  elegir(indice: number) {
    if (this.respuestaSeleccionada() !== null) {
      return;
    }
    this.respuestaSeleccionada.set(indice);
    this.respuestas.update((respuestas) => [...respuestas, indice]);
  }

  siguiente() {
    if (this.esUltimaPregunta()) {
      this.enviar();
      return;
    }
    this.indicePregunta.update((indice) => indice + 1);
    this.respuestaSeleccionada.set(null);
  }

  private enviar() {
    const juego = this.juego();
    const ronda = this.rondaActual();
    if (!juego || ronda === null) {
      return;
    }

    // "respuestas" guarda solo la opcion elegida en cada posicion (0,1,2);
    // aca se junta con el "indice" real de esa pregunta dentro del banco
    // del servidor, para que pueda calificarla sin importar el orden en
    // que se jugaron.
    const respuestasParaEnviar = this.respuestas().map((opcion, posicion) => ({
      indice: juego.preguntas[posicion].indice,
      opcion,
    }));

    this.enviando.set(true);
    this.auth.completarMinijuego(this.id, ronda, respuestasParaEnviar).subscribe({
      next: (resultado) => {
        this.enviando.set(false);
        this.resultado.set(resultado);
        this.terminado.set(true);
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo guardar tu resultado. Intenta de nuevo.');
      },
    });
  }

  jugarDeNuevo() {
    this.cargar();
  }
}
