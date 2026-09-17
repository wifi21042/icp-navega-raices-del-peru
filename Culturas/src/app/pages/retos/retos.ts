import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth, PreguntaReto, Reto } from '../../core/services/auth';
import { calcularNivel } from '../../core/utils/niveles';

const LETRAS = ['A', 'B', 'C', 'D'];

@Component({
  imports: [RouterLink],
  selector: 'app-retos',
  styleUrl: './retos.scss',
  templateUrl: './retos.html',
})
export class RetosPagina {
  retos = signal<Reto[]>([]);
  cargando = signal(true);
  error = signal('');
  idProcesando = signal<string | null>(null);
  mensajeExito = signal('');

  constructor(
    public auth: Auth,
    private router: Router
  ) {
    if (!this.auth.estaLogueado()) {
      this.router.navigate(['/login']);
      return;
    }

    // Trae los puntos actualizados del servidor apenas se entra a la
    // pagina, para que no se quede pegado en un numero viejo.
    this.auth.refrescarUsuario().subscribe({ error: () => {} });
    this.cargar();
  }

  private cargar() {
    this.cargando.set(true);
    this.auth.listarRetos().subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.retos.set(respuesta.retos);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('No se pudieron cargar los retos.');
      },
    });
  }

  get puntosActuales(): number {
    return this.auth.usuarioActual()?.puntos ?? 0;
  }

  get nivelActual(): number {
    return calcularNivel(this.puntosActuales).nivel;
  }

  // Cuantas horas le quedan a un reto especial en su ventana activa de
  // esta semana (se activa el miercoles en la noche y dura 24 horas).
  // null si el reto no esta activo ahorita.
  horasRestantes(reto: Reto): number | null {
    if (!reto.disponible_hasta) {
      return null;
    }
    const ahora = new Date();
    const limite = new Date(reto.disponible_hasta);
    const diferenciaMs = limite.getTime() - ahora.getTime();
    return Math.max(0, Math.ceil(diferenciaMs / (1000 * 60 * 60)));
  }

  etiquetaBoton(reto: Reto): string {
    if (reto.tipo === 'personaje') {
      return 'Ya arme mi personaje';
    }
    if (reto.tipo === 'amigos') {
      return 'Ya tengo 3 amigos';
    }
    if (reto.tipo === 'quiz') {
      return '🎮 Jugar quiz';
    }
    return 'Ya lo hice';
  }

  completar(reto: Reto) {
    if (reto.completado || this.idProcesando()) {
      return;
    }

    if (reto.tipo === 'quiz') {
      this.abrirQuiz(reto);
      return;
    }

    this.error.set('');
    this.idProcesando.set(reto.id);

    this.auth.completarReto(reto.id).subscribe({
      next: () => {
        this.idProcesando.set(null);
        this.mensajeExito.set(`¡Listo! Ganaste +${reto.puntos} pts 🎉`);
        this.cargar();
      },
      error: (err) => {
        this.idProcesando.set(null);
        this.error.set(err?.error?.message ?? 'No se pudo completar el reto.');
      },
    });
  }

  cerrarMensajeExito() {
    this.mensajeExito.set('');
  }

  // --- Quiz de los retos especiales ---
  // En vez de un boton "Ya lo hice", los retos tipo "quiz" abren estas 5
  // preguntas: si las respondes bien (minimo_correctas de 5), recien ahi
  // se activa la recompensa.
  quizReto = signal<Reto | null>(null);
  quizCargando = signal(false);
  quizError = signal('');
  quizPreguntas = signal<PreguntaReto[]>([]);
  quizMinimo = signal(4);

  quizIndice = signal(0);
  quizRespuestaSeleccionada = signal<number | null>(null);
  quizRespuestas = signal<number[]>([]);
  quizEnviando = signal(false);
  quizResultado = signal<{ aprobado: boolean; correctas: number; total: number } | null>(null);

  quizPreguntaActual = computed(() => this.quizPreguntas()[this.quizIndice()] ?? null);
  quizEsUltimaPregunta = computed(() => this.quizIndice() === this.quizPreguntas().length - 1);

  quizLetra(indice: number): string {
    return LETRAS[indice] ?? '?';
  }

  private abrirQuiz(reto: Reto) {
    this.quizReto.set(reto);
    this.quizCargando.set(true);
    this.quizError.set('');
    this.quizResultado.set(null);
    this.quizIndice.set(0);
    this.quizRespuestaSeleccionada.set(null);
    this.quizRespuestas.set([]);

    this.auth.obtenerQuizReto(reto.id).subscribe({
      next: (quiz) => {
        this.quizCargando.set(false);
        this.quizPreguntas.set(quiz.preguntas);
        this.quizMinimo.set(quiz.minimo_correctas);
      },
      error: (err) => {
        this.quizCargando.set(false);
        this.quizError.set(err?.error?.message ?? 'No se pudo cargar el quiz de este reto.');
      },
    });
  }

  cerrarQuiz() {
    this.quizReto.set(null);
  }

  quizElegir(indice: number) {
    if (this.quizRespuestaSeleccionada() !== null) {
      return;
    }
    this.quizRespuestaSeleccionada.set(indice);
    this.quizRespuestas.update((respuestas) => [...respuestas, indice]);
  }

  quizSiguiente() {
    if (this.quizEsUltimaPregunta()) {
      this.quizEnviar();
      return;
    }
    this.quizIndice.update((indice) => indice + 1);
    this.quizRespuestaSeleccionada.set(null);
  }

  private quizEnviar() {
    const reto = this.quizReto();
    if (!reto) {
      return;
    }

    const respuestasParaEnviar = this.quizRespuestas().map((opcion, indice) => ({ indice, opcion }));

    this.quizEnviando.set(true);
    this.auth.completarQuizReto(reto.id, respuestasParaEnviar).subscribe({
      next: (resultado) => {
        this.quizEnviando.set(false);
        this.quizResultado.set(resultado);
        if (resultado.aprobado) {
          this.cargar();
        }
      },
      error: (err) => {
        this.quizEnviando.set(false);
        this.quizError.set(err?.error?.message ?? 'No se pudo enviar el quiz. Intenta de nuevo.');
      },
    });
  }

  quizIntentarDeNuevo() {
    this.quizIndice.set(0);
    this.quizRespuestaSeleccionada.set(null);
    this.quizRespuestas.set([]);
    this.quizResultado.set(null);
  }
}
