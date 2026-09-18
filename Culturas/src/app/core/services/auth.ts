import { Service, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Usuario {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  peinado?: string | null;
  tono_piel?: string | null;
  ropa?: string | null;
  nombre_personaje?: string | null;
  personaje_completo?: boolean;
  puntos?: number;
  monedas?: number;
  accesorios?: string[] | null;
  retos_completados?: string[] | null;
  minijuegos_progreso?: Record<string, number> | null;
  google_email?: string | null;
  password_usable?: boolean;
}

export interface Amigo {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  tono_piel?: string | null;
  nombre_personaje?: string | null;
  puntos?: number;
}

export interface Solicitud {
  solicitud_id: number;
  usuario_id: number;
  name: string;
  nombre_personaje?: string | null;
  avatar?: string | null;
}

export interface Bloqueado {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  nombre_personaje?: string | null;
}

export interface Aviso {
  id: number;
  mensaje: string;
}

// Un logro de Recompensas, con su porcentaje calculado de verdad en el
// servidor (cuantos jugadores registrados lo tienen, sobre el total).
export interface Logro {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  desbloqueado: boolean;
  // Fecha en la que se desbloqueo (o null si todavia no). Se calcula en
  // el servidor la primera vez que se ve que el logro ya se cumple.
  desbloqueado_en: string | null;
  porcentaje: number;
  rareza: 'ultra_raro' | 'raro' | 'medio' | 'comun';
}

export interface Reto {
  id: string;
  titulo: string;
  descripcion: string;
  puntos: number;
  tipo: 'manual' | 'personaje' | 'amigos' | 'quiz';
  completado: boolean;
  especial?: boolean;
  disponible_hasta?: string | null;
  proxima_activacion?: string | null;
  activo?: boolean;
}

// El quiz de 5 preguntas que hay que aprobar para completar un reto
// especial de tipo "quiz" (en vez de un boton "Ya lo hice").
export interface PreguntaReto {
  indice: number;
  pregunta: string;
  opciones: string[];
  correcta: number;
}

export interface QuizReto {
  id: string;
  titulo: string;
  puntos: number;
  minimo_correctas: number;
  preguntas: PreguntaReto[];
}

export interface ResultadoQuizReto {
  aprobado: boolean;
  correctas: number;
  total: number;
  minimo_correctas?: number;
  user?: Usuario;
}

export interface MinijuegoResumen {
  id: string;
  titulo: string;
  descripcion: string;
  color: string;
  puntos: number;
  nivel_requerido: number;
  dificultad: 'facil' | 'medio' | 'dificil';
  bloqueado: boolean;
}

export interface PreguntaMinijuego {
  indice: number;
  pregunta: string;
  opciones: string[];
  correcta: number;
}

export interface RespuestaMinijuego {
  indice: number;
  opcion: number;
}

// Cada minijuego tiene 3 rondas (facil, medio, dificil). La ronda 2 pide
// haber intentado la 1 (y la 3, haber intentado la 2) para desbloquearse.
export interface RondaMinijuego {
  ronda: number;
  multiplicador: number;
  puntos: number;
  estrellas: number;
  desbloqueada: boolean;
}

export interface MinijuegoRondas {
  id: string;
  titulo: string;
  descripcion: string;
  color: string;
  dificultad: 'facil' | 'medio' | 'dificil';
  rondas: RondaMinijuego[];
}

export interface MinijuegoDetalle {
  id: string;
  titulo: string;
  color: string;
  dificultad: 'facil' | 'medio' | 'dificil';
  ronda: number;
  multiplicador: number;
  puntos: number;
  preguntas: PreguntaMinijuego[];
  mejor_estrellas: number;
}

export interface ResultadoMinijuego {
  ronda: number;
  correctas: number;
  total: number;
  estrellas: number;
  mejor_estrellas: number;
  monedas_ganadas: number;
  puntos_ganados: number;
  siguiente_ronda_desbloqueada: boolean;
  user: Usuario;
}

export interface DatosPersonaje {
  avatar: string;
  peinado: string;
  tono_piel: string;
  ropa: string;
  nombre_personaje: string;
  accesorios?: string[];
}

interface RespuestaAuth {
  user: Usuario;
  token: string;
}

@Service()
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  // En produccion (build para GitHub Pages) usa la URL fija del backend
  // publicado. En desarrollo, usa el mismo host con el que se abrio la
  // pagina (localhost en la PC, o la IP de la PC cuando se entra desde
  // el celular), asi no hay que tocar este archivo para probar desde
  // otro dispositivo en la red.
  private apiUrl = environment.production
    ? environment.apiUrl
    : `http://${window.location.hostname}:8000/api`;
  usuarioActual = signal<Usuario | null>(this.leerUsuarioGuardado());

  private leerUsuarioGuardado(): Usuario | null {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  }

  login(email: string, password: string) {
    return this.http.post<RespuestaAuth>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((respuesta) => this.guardarSesion(respuesta))
    );
  }

  // Se registra solo con nombre y correo. Por ahora (mientras el envio de
  // correos no esta activo) entra directo, sin pasar por confirmar el
  // correo, y la contrasena se crea justo despues en /crear-password.
  registrar(name: string, email: string) {
    return this.http
      .post<RespuestaAuth>(`${this.apiUrl}/register`, { name, email })
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  // Inicia sesion (o crea la cuenta si es la primera vez) usando el
  // "credential" que devuelve el boton de Google. Como Google ya confirmo
  // el correo, esto entra directo, sin pedir confirmacion por correo.
  loginConGoogle(credential: string) {
    return this.http
      .post<RespuestaAuth>(`${this.apiUrl}/auth/google`, { credential })
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  private guardarSesion(respuesta: RespuestaAuth) {
    localStorage.setItem('token', respuesta.token);
    localStorage.setItem('usuario', JSON.stringify(respuesta.user));
    this.usuarioActual.set(respuesta.user);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.usuarioActual.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  estaLogueado(): boolean {
    return !!this.usuarioActual();
  }

  // Vuelve a pedir los datos del usuario al servidor (puntos, retos
  // completados, etc.) y actualiza lo que se muestra en pantalla. Se usa en
  // las paginas de Retos, Recompensas y Accesorios para que los puntos
  // salgan siempre actualizados, sin que la persona tenga que cerrar sesion
  // y volver a entrar.
  refrescarUsuario() {
    return this.http.get<Usuario>(`${this.apiUrl}/me`, { headers: this.headersAuth() }).pipe(
      tap((usuario) => {
        localStorage.setItem('usuario', JSON.stringify(usuario));
        this.usuarioActual.set(usuario);
      })
    );
  }

  guardarPersonaje(datos: DatosPersonaje) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });

    return this.http
      .post<{ user: Usuario }>(`${this.apiUrl}/personaje`, datos, { headers })
      .pipe(
        tap((respuesta) => {
          localStorage.setItem('usuario', JSON.stringify(respuesta.user));
          this.usuarioActual.set(respuesta.user);
        })
      );
  }

  // Guarda que accesorios tiene puestos el personaje (solo los que ya
  // desbloqueo con sus puntos).
  guardarAccesorios(accesorios: string[]) {
    return this.http
      .put<{ user: Usuario }>(
        `${this.apiUrl}/personaje/accesorios`,
        { accesorios },
        { headers: this.headersAuth() }
      )
      .pipe(
        tap((respuesta) => {
          localStorage.setItem('usuario', JSON.stringify(respuesta.user));
          this.usuarioActual.set(respuesta.user);
        })
      );
  }

  actualizarPerfil(name: string, email: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });

    return this.http
      .put<{ user: Usuario }>(`${this.apiUrl}/cuenta`, { name, email }, { headers })
      .pipe(
        tap((respuesta) => {
          localStorage.setItem('usuario', JSON.stringify(respuesta.user));
          this.usuarioActual.set(respuesta.user);
        })
      );
  }

  actualizarPassword(passwordActual: string, password: string, passwordConfirmation: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });

    return this.http
      .put<{ mensaje: string; user: Usuario }>(
        `${this.apiUrl}/cuenta/password`,
        {
          password_actual: passwordActual,
          password,
          password_confirmation: passwordConfirmation,
        },
        { headers }
      )
      .pipe(
        tap((respuesta) => {
          if (respuesta.user) {
            localStorage.setItem('usuario', JSON.stringify(respuesta.user));
            this.usuarioActual.set(respuesta.user);
          }
        })
      );
  }

  // Vincula (o cambia) la cuenta de Google usando el "credential" que
  // entrega el boton de Google, para la cuenta ya logueada.
  vincularGoogle(credential: string) {
    return this.http
      .post<{ user: Usuario }>(`${this.apiUrl}/cuenta/google`, { credential }, { headers: this.headersAuth() })
      .pipe(
        tap((respuesta) => {
          localStorage.setItem('usuario', JSON.stringify(respuesta.user));
          this.usuarioActual.set(respuesta.user);
        })
      );
  }

  desvincularGoogle() {
    return this.http
      .delete<{ user: Usuario }>(`${this.apiUrl}/cuenta/google`, { headers: this.headersAuth() })
      .pipe(
        tap((respuesta) => {
          localStorage.setItem('usuario', JSON.stringify(respuesta.user));
          this.usuarioActual.set(respuesta.user);
        })
      );
  }

  eliminarCuenta(password: string) {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/cuenta`, {
      headers: this.headersAuth(),
      body: { password },
    });
  }

  private headersAuth(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
  }

  // Confirma el correo y de una vez deja la sesion abierta (asi la persona
  // sigue directo a crear su contrasena, sin tener que iniciar sesion a
  // mano justo despues).
  verificarCorreo(token: string) {
    return this.http
      .post<RespuestaAuth>(`${this.apiUrl}/email/verificar`, { token })
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  olvidePassword(email: string) {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/forgot-password`, { email });
  }

  restablecerPassword(token: string, email: string, password: string, passwordConfirmation: string) {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/reset-password`, {
      token,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
  }

  buscarAmigos(texto: string) {
    return this.http.get<{ resultados: Amigo[] }>(`${this.apiUrl}/amigos/buscar`, {
      headers: this.headersAuth(),
      params: { q: texto },
    });
  }

  enviarSolicitudAmistad(amigoId: number) {
    return this.http.post<{ mensaje: string }>(
      `${this.apiUrl}/amigos/solicitudes`,
      { amigo_id: amigoId },
      { headers: this.headersAuth() }
    );
  }

  solicitudesRecibidas() {
    return this.http.get<{ solicitudes: Solicitud[] }>(`${this.apiUrl}/amigos/solicitudes/recibidas`, {
      headers: this.headersAuth(),
    });
  }

  solicitudesEnviadas() {
    return this.http.get<{ solicitudes: Solicitud[] }>(`${this.apiUrl}/amigos/solicitudes/enviadas`, {
      headers: this.headersAuth(),
    });
  }

  aceptarSolicitud(id: number) {
    return this.http.post<{ mensaje: string }>(
      `${this.apiUrl}/amigos/solicitudes/${id}/aceptar`,
      {},
      { headers: this.headersAuth() }
    );
  }

  rechazarSolicitud(id: number) {
    return this.http.post<{ mensaje: string }>(
      `${this.apiUrl}/amigos/solicitudes/${id}/rechazar`,
      {},
      { headers: this.headersAuth() }
    );
  }

  cancelarSolicitud(id: number) {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/amigos/solicitudes/${id}`, {
      headers: this.headersAuth(),
    });
  }

  quitarAmigo(amigoId: number) {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/amigos/${amigoId}`, {
      headers: this.headersAuth(),
    });
  }

  bloquearAmigo(id: number) {
    return this.http.post<{ mensaje: string }>(
      `${this.apiUrl}/amigos/${id}/bloquear`,
      {},
      { headers: this.headersAuth() }
    );
  }

  misBloqueados() {
    return this.http.get<{ bloqueados: Bloqueado[] }>(`${this.apiUrl}/amigos/bloqueados`, {
      headers: this.headersAuth(),
    });
  }

  desbloquearUsuario(id: number) {
    return this.http.post<{ mensaje: string }>(
      `${this.apiUrl}/amigos/${id}/desbloquear`,
      {},
      { headers: this.headersAuth() }
    );
  }

  obtenerAvisos() {
    return this.http.get<{ avisos: Aviso[] }>(`${this.apiUrl}/avisos`, {
      headers: this.headersAuth(),
    });
  }

  listarRetos() {
    return this.http.get<{ retos: Reto[] }>(`${this.apiUrl}/retos`, {
      headers: this.headersAuth(),
    });
  }

  completarReto(id: string) {
    return this.http
      .post<{ user: Usuario }>(`${this.apiUrl}/retos/${id}/completar`, {}, { headers: this.headersAuth() })
      .pipe(
        tap((respuesta) => {
          localStorage.setItem('usuario', JSON.stringify(respuesta.user));
          this.usuarioActual.set(respuesta.user);
        })
      );
  }

  obtenerQuizReto(id: string) {
    return this.http.get<QuizReto>(`${this.apiUrl}/retos/${id}/quiz`, {
      headers: this.headersAuth(),
    });
  }

  completarQuizReto(id: string, respuestas: RespuestaMinijuego[]) {
    return this.http
      .post<ResultadoQuizReto>(
        `${this.apiUrl}/retos/${id}/quiz/completar`,
        { respuestas },
        { headers: this.headersAuth() }
      )
      .pipe(
        tap((respuesta) => {
          if (respuesta.aprobado && respuesta.user) {
            localStorage.setItem('usuario', JSON.stringify(respuesta.user));
            this.usuarioActual.set(respuesta.user);
          }
        })
      );
  }

  listarLogros() {
    return this.http.get<{ logros: Logro[] }>(`${this.apiUrl}/logros`, {
      headers: this.headersAuth(),
    });
  }

  listarAmigos() {
    return this.http.get<{ amigos: Amigo[] }>(`${this.apiUrl}/amigos`, {
      headers: this.headersAuth(),
    });
  }

  listarMinijuegos() {
    return this.http.get<{ minijuegos: MinijuegoResumen[] }>(`${this.apiUrl}/minijuegos`, {
      headers: this.headersAuth(),
    });
  }

  listarRondas(id: string) {
    return this.http.get<MinijuegoRondas>(`${this.apiUrl}/minijuegos/${id}/rondas`, {
      headers: this.headersAuth(),
    });
  }

  obtenerMinijuego(id: string, ronda: number) {
    return this.http.get<MinijuegoDetalle>(`${this.apiUrl}/minijuegos/${id}/rondas/${ronda}`, {
      headers: this.headersAuth(),
    });
  }

  completarMinijuego(id: string, ronda: number, respuestas: RespuestaMinijuego[]) {
    return this.http
      .post<ResultadoMinijuego>(
        `${this.apiUrl}/minijuegos/${id}/rondas/${ronda}/completar`,
        { respuestas },
        { headers: this.headersAuth() }
      )
      .pipe(
        tap((respuesta) => {
          localStorage.setItem('usuario', JSON.stringify(respuesta.user));
          this.usuarioActual.set(respuesta.user);
        })
      );
  }
}
