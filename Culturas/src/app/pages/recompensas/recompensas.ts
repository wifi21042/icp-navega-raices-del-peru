import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth, Logro } from '../../core/services/auth';
import { calcularNivel } from '../../core/utils/niveles';

@Component({
  imports: [RouterLink],
  selector: 'app-recompensas',
  styleUrl: './recompensas.scss',
  templateUrl: './recompensas.html',
})
export class Recompensas {
  // Los logros ya vienen calculados de verdad desde el servidor: cada uno
  // trae si TU ya lo desbloqueaste (y cuando, la primera vez que se
  // detecto) y el porcentaje real de jugadores que lo tienen (jugadores
  // con el logro / total de jugadores registrados), asi que no hay nada
  // que aproximar aca.
  logros = signal<Logro[]>([]);
  cargandoLogros = signal(true);

  // Dos pestañas, como en Steam: "Mis logros" (tu progreso personal, con
  // fecha de cuando desbloqueaste cada uno) y "Logros globales" (la lista
  // completa ordenada de mas raro a mas comun, con un check en los que ya
  // tienes).
  pestanaActiva = signal<'mios' | 'globales'>('mios');

  constructor(
    public auth: Auth,
    private router: Router
  ) {
    if (!this.auth.estaLogueado()) {
      this.router.navigate(['/login']);
      return;
    }

    // Trae los puntos actualizados del servidor apenas se entra a la
    // pagina, para que el nivel y el progreso no se queden pegados en un
    // numero viejo.
    this.auth.refrescarUsuario().subscribe({ error: () => {} });

    this.auth.listarLogros().subscribe({
      next: (respuesta) => {
        this.logros.set(respuesta.logros);
        this.cargandoLogros.set(false);
      },
      error: () => this.cargandoLogros.set(false),
    });
  }

  // Pestaña "Mis logros": arriba los que ya desbloqueaste, del mas
  // reciente al mas antiguo (como el historial de Steam); abajo los que
  // todavia te faltan, del mas cerca de conseguir (mas comun) al mas
  // lejos (mas raro).
  logrosDesbloqueados = computed(() =>
    this.logros()
      .filter((l) => l.desbloqueado)
      .sort((a, b) => (b.desbloqueado_en ?? '').localeCompare(a.desbloqueado_en ?? ''))
  );

  logrosPendientes = computed(() =>
    this.logros()
      .filter((l) => !l.desbloqueado)
      .sort((a, b) => b.porcentaje - a.porcentaje)
  );

  // Pestaña "Logros globales": todos, del mas raro al mas comun (el orden
  // que ya manda el servidor).
  logrosGlobales = computed(() => this.logros());

  cantidadDesbloqueados(): number {
    return this.logrosDesbloqueados().length;
  }

  // Texto y color del "badge" de rareza, estilo Steam: mientras menos
  // jugadores lo tienen, mas llamativo se ve.
  etiquetaRareza(logro: Logro): string {
    return `${logro.porcentaje}% de los jugadores tienen este logro`;
  }

  // "Desbloqueado el 16 sep, 2026", con el mismo formato en toda la
  // pagina.
  etiquetaFecha(logro: Logro): string {
    if (!logro.desbloqueado_en) {
      return '';
    }
    const fecha = new Date(logro.desbloqueado_en.replace(' ', 'T'));
    if (Number.isNaN(fecha.getTime())) {
      return '';
    }
    const texto = new Intl.DateTimeFormat('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(fecha);
    return `Desbloqueado el ${texto}`;
  }

  // Nivel 1 empieza en 0 puntos, el nivel 2 pide 1000, el 3 pide 3000, y de
  // ahi en adelante lo que hace falta para el siguiente nivel sube de a 200
  // cada vez, hasta el nivel 100 (el maximo por ahora).
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

  premios: { icono: string; titulo: string }[] = [
    { icono: '⭐', titulo: '+100 pts' },
    { icono: '👒', titulo: 'Sombrero Andino' },
    { icono: '🎵', titulo: 'Instrumento Especial' },
    { icono: '🏞️', titulo: 'Fondo Exclusivo' },
  ];
}
