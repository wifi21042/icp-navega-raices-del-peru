import { Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { Amigo, Auth, Bloqueado, Solicitud } from '../../core/services/auth';

// Cada cuantos milisegundos se revisa si hay solicitudes o amigos nuevos,
// para que la pagina se actualice sola sin que la persona tenga que
// refrescar a mano.
const INTERVALO_ACTUALIZACION_MS = 10000;

@Component({
  imports: [RouterLink],
  selector: 'app-amigos',
  styleUrl: './amigos.scss',
  templateUrl: './amigos.html',
})
export class Amigos {
  texto = signal('');
  buscando = signal(false);
  resultados = signal<Amigo[]>([]);
  errorBusqueda = signal('');
  yaBusco = signal(false);

  amigos = signal<Amigo[]>([]);
  cargandoAmigos = signal(true);

  recibidas = signal<Solicitud[]>([]);
  enviadas = signal<Solicitud[]>([]);
  cargandoSolicitudes = signal(true);

  bloqueados = signal<Bloqueado[]>([]);
  cargandoBloqueados = signal(true);

  enviandoId = signal<number | null>(null);
  respondiendoId = signal<number | null>(null);
  quitandoId = signal<number | null>(null);
  bloqueandoId = signal<number | null>(null);
  desbloqueandoId = signal<number | null>(null);

  // Guarda que accion se esta por confirmar, con la forma "accion:id".
  // Mientras esto tenga un valor, esa fila muestra "seguro? Si / No" en vez
  // de su boton normal.
  confirmando = signal<string | null>(null);

  constructor(
    public auth: Auth,
    private router: Router
  ) {
    if (!this.auth.estaLogueado()) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarAmigos();
    this.cargarSolicitudes();
    this.cargarBloqueados();

    // Revisa cada cierto tiempo si llego una solicitud nueva, si alguien
    // acepto la tuya, etc. Asi no hay que refrescar la pagina a mano.
    interval(INTERVALO_ACTUALIZACION_MS)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.cargarAmigos(false);
        this.cargarSolicitudes(false);
        this.cargarBloqueados(false);
      });
  }

  // El parametro mostrarCargando se pone en false cuando la llamada viene de
  // la actualizacion automatica en segundo plano, para que no aparezca y
  // desaparezca el "Cargando..." cada pocos segundos.
  private cargarAmigos(mostrarCargando = true) {
    if (mostrarCargando) this.cargandoAmigos.set(true);
    this.auth.listarAmigos().subscribe({
      next: (respuesta) => {
        this.amigos.set(respuesta.amigos);
        this.cargandoAmigos.set(false);
      },
      error: () => this.cargandoAmigos.set(false),
    });
  }

  private cargarSolicitudes(mostrarCargando = true) {
    if (mostrarCargando) this.cargandoSolicitudes.set(true);
    this.auth.solicitudesRecibidas().subscribe({
      next: (respuesta) => this.recibidas.set(respuesta.solicitudes),
      error: () => {},
    });
    this.auth.solicitudesEnviadas().subscribe({
      next: (respuesta) => {
        this.enviadas.set(respuesta.solicitudes);
        this.cargandoSolicitudes.set(false);
      },
      error: () => this.cargandoSolicitudes.set(false),
    });
  }

  private cargarBloqueados(mostrarCargando = true) {
    if (mostrarCargando) this.cargandoBloqueados.set(true);
    this.auth.misBloqueados().subscribe({
      next: (respuesta) => {
        this.bloqueados.set(respuesta.bloqueados);
        this.cargandoBloqueados.set(false);
      },
      error: () => this.cargandoBloqueados.set(false),
    });
  }

  onTextoChange(valor: string) {
    this.texto.set(valor);
  }

  buscar() {
    this.errorBusqueda.set('');
    this.yaBusco.set(true);

    if (this.texto().trim().length < 2) {
      this.errorBusqueda.set('Escribe al menos 2 letras para buscar.');
      this.resultados.set([]);
      return;
    }

    this.buscando.set(true);
    this.auth.buscarAmigos(this.texto().trim()).subscribe({
      next: (respuesta) => {
        this.buscando.set(false);
        this.resultados.set(respuesta.resultados);
      },
      error: () => {
        this.buscando.set(false);
        this.errorBusqueda.set('No se pudo buscar en este momento.');
      },
    });
  }

  // --- Confirmaciones ---

  pedirConfirmacion(accion: string, id: number) {
    this.confirmando.set(`${accion}:${id}`);
  }

  cancelarConfirmacion() {
    this.confirmando.set(null);
  }

  esConfirmando(accion: string, id: number): boolean {
    return this.confirmando() === `${accion}:${id}`;
  }

  // --- Acciones ---

  enviarSolicitud(persona: Amigo) {
    this.enviandoId.set(persona.id);
    this.auth.enviarSolicitudAmistad(persona.id).subscribe({
      next: () => {
        this.enviandoId.set(null);
        this.resultados.update((lista) => lista.filter((p) => p.id !== persona.id));
        this.cargarSolicitudes();
      },
      error: () => this.enviandoId.set(null),
    });
  }

  aceptar(solicitud: Solicitud) {
    this.confirmando.set(null);
    this.respondiendoId.set(solicitud.solicitud_id);
    this.auth.aceptarSolicitud(solicitud.solicitud_id).subscribe({
      next: () => {
        this.respondiendoId.set(null);
        this.recibidas.update((lista) => lista.filter((s) => s.solicitud_id !== solicitud.solicitud_id));
        this.cargarAmigos();
      },
      error: () => this.respondiendoId.set(null),
    });
  }

  rechazar(solicitud: Solicitud) {
    this.respondiendoId.set(solicitud.solicitud_id);
    this.auth.rechazarSolicitud(solicitud.solicitud_id).subscribe({
      next: () => {
        this.respondiendoId.set(null);
        this.recibidas.update((lista) => lista.filter((s) => s.solicitud_id !== solicitud.solicitud_id));
      },
      error: () => this.respondiendoId.set(null),
    });
  }

  cancelar(solicitud: Solicitud) {
    this.confirmando.set(null);
    this.respondiendoId.set(solicitud.solicitud_id);
    this.auth.cancelarSolicitud(solicitud.solicitud_id).subscribe({
      next: () => {
        this.respondiendoId.set(null);
        this.enviadas.update((lista) => lista.filter((s) => s.solicitud_id !== solicitud.solicitud_id));
      },
      error: () => this.respondiendoId.set(null),
    });
  }

  quitar(amigo: Amigo) {
    this.confirmando.set(null);
    this.quitandoId.set(amigo.id);
    this.auth.quitarAmigo(amigo.id).subscribe({
      next: () => {
        this.quitandoId.set(null);
        this.amigos.update((lista) => lista.filter((persona) => persona.id !== amigo.id));
      },
      error: () => this.quitandoId.set(null),
    });
  }

  bloquear(amigo: Amigo) {
    this.confirmando.set(null);
    this.bloqueandoId.set(amigo.id);
    this.auth.bloquearAmigo(amigo.id).subscribe({
      next: () => {
        this.bloqueandoId.set(null);
        this.amigos.update((lista) => lista.filter((persona) => persona.id !== amigo.id));
        this.cargarBloqueados();
      },
      error: () => this.bloqueandoId.set(null),
    });
  }

  desbloquear(bloqueado: Bloqueado) {
    this.confirmando.set(null);
    this.desbloqueandoId.set(bloqueado.id);
    this.auth.desbloquearUsuario(bloqueado.id).subscribe({
      next: () => {
        this.desbloqueandoId.set(null);
        this.bloqueados.update((lista) => lista.filter((persona) => persona.id !== bloqueado.id));
      },
      error: () => this.desbloqueandoId.set(null),
    });
  }
}
