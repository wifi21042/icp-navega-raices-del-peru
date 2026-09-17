import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';

interface OpcionAccesorio {
  id: string;
  emoji: string;
  imagen: string;
  // Solo las insignias nuevas (ver categoria "Insignias" mas abajo) usan
  // esto: la version CON fondo (la ilustracion completa) para mostrar
  // grande en el centro de la vista previa. Si no esta, se usa "imagen"
  // (que para los accesorios de siempre es la unica foto que hay).
  imagenCentro?: string;
  etiqueta: string;
  umbral: number;
}

interface CategoriaAccesorios {
  titulo: string;
  especial?: boolean;
  opciones: OpcionAccesorio[];
}

// Los mismos emojis que se usan en Personalizar, para el avatar y la ropa
// del personaje ya guardado.
const EMOJIS_AVATAR: Record<string, string> = {
  nina: '👧',
  nino: '👦',
  nina_flor: '👩',
  nino_pluma: '🧑',
};

// Misma familia de fotos que usa Personalizar para cada avatar (ver la nota
// en personalizar.ts): las fotos estan en public/img/personaje/avatares/
// con el nombre "<familia>-<tono sin #>.png", una por cada tono de piel.
const FAMILIA_AVATAR: Record<string, 'nina' | 'nino'> = {
  nina: 'nina',
  nino: 'nino',
  nina_flor: 'nina',
  nino_pluma: 'nino',
};

const ETIQUETAS_ROPA: Record<string, string> = {
  poncho_morado: 'Poncho morado',
  poncho_rojo: 'Poncho rojo',
  chaleco_verde: 'Chaleco verde',
  poncho_negro: 'Poncho negro',
};

// Accesorios que se dibujan encima del personaje, en el lugar del cuerpo
// que les corresponde, en vez de mostrarse como un circulo suelto debajo:
// el collar va al cuello, la corona de flores a la cabeza, y los animales
// se paran al costado (loro posado cerca del hombro, llama y alpaca de pie
// abajo a cada lado, a la altura de los pies). Las posiciones son
// porcentajes dentro del circulo de la vista previa (el mismo circulo
// donde va la foto del personaje).
//
// OJO: las fotos del personaje (public/img/personaje/avatares/) ya estan
// recortadas bien pegadas al personaje (casi sin espacio vacio alrededor),
// asi que dentro del circulo (con object-fit: contain) el personaje ocupa
// mas o menos del 8% al 92% de alto y del 29% al 71% de ancho. Los
// accesorios (public/img/accesorios/) SI tienen todavia harto espacio
// transparente alrededor en su propio archivo, por eso sus porcentajes de
// "width" acá se ven mas grandes de lo que se ve la parte pintada. Estos
// numeros salieron de medir pixel por pixel en una foto real donde esta
// la cabeza, el cuello y los pies, para que el collar, la corona y los
// animales queden pegados al cuerpo y no floten en el aire.
//
// Los instrumentos y la ceramica todavia no tienen una posicion natural
// (se sostienen con las manos), asi que por ahora se quedan en la fila de
// circulos de abajo.
const POSICION_SOBRE_PERSONAJE: Record<string, { top: string; left: string; width: string; z: number }> = {
  collar: { top: '49%', left: '50%', width: '41%', z: 2 },
  corona_flores: { top: '10%', left: '50%', width: '39%', z: 2 },
  loro: { top: '36%', left: '62%', width: '26%', z: 3 },
  llama: { top: '84.5%', left: '68.5%', width: '34%', z: 1 },
  alpaca: { top: '85%', left: '33.5%', width: '32%', z: 1 },
};

@Component({
  imports: [RouterLink],
  selector: 'app-accesorios',
  styleUrl: './accesorios.scss',
  templateUrl: './accesorios.html',
})
export class AccesoriosPagina {
  guardando = signal(false);
  error = signal('');
  exito = signal(false);
  accesoriosSeleccionados = signal<string[]>([]);
  imagenesFallidas = signal<Set<string>>(new Set());

  // Los accesorios se van desbloqueando con los puntos de la cuenta (igual
  // que los logros de Recompensas): todavia no hay un sistema que registre
  // cada reto completado por separado, asi que usamos los puntos como
  // referencia de cuanto has avanzado.
  //
  // "imagen" ya esta listo para cuando tengan el dibujo real de cada
  // accesorio: solo hay que guardar el archivo en esa ruta (dentro de
  // public/img/accesorios/) y aparece solo. Mientras no exista el archivo,
  // se sigue viendo el emoji de siempre.
  //
  // Orden: de mayor a menor puntaje (los objetos especiales, que cuestan
  // mas puntos, van primero) para que lo mas importante se vea de una vez,
  // sin tener que bajar tanto en la pantalla.
  categorias: CategoriaAccesorios[] = [
    {
      titulo: 'Objetos especiales',
      especial: true,
      opciones: [
        { id: 'collar', emoji: '📿', imagen: 'img/accesorios/collar.png', etiqueta: 'Collar', umbral: 1000 },
        { id: 'corona_flores', emoji: '💐', imagen: 'img/accesorios/corona-flores.png', etiqueta: 'Corona de flores', umbral: 800 },
        { id: 'ceramica', emoji: '🏺', imagen: 'img/accesorios/ceramica.png', etiqueta: 'Cerámica', umbral: 600 },
      ],
    },
    {
      titulo: 'Animales',
      opciones: [
        { id: 'alpaca', emoji: '🐑', imagen: 'img/accesorios/alpaca.png', etiqueta: 'Alpaca', umbral: 450 },
        { id: 'llama', emoji: '🦙', imagen: 'img/accesorios/llama.png', etiqueta: 'Llama', umbral: 350 },
        { id: 'loro', emoji: '🦜', imagen: 'img/accesorios/loro.png', etiqueta: 'Loro', umbral: 250 },
      ],
    },
    {
      titulo: 'Instrumentos',
      opciones: [
        { id: 'maraca', emoji: '🪇', imagen: 'img/accesorios/maraca.png', etiqueta: 'Maraca', umbral: 150 },
        { id: 'zampona', emoji: '🎶', imagen: 'img/accesorios/zampona.png', etiqueta: 'Zampoña', umbral: 50 },
        { id: 'quena', emoji: '🪈', imagen: 'img/accesorios/quena.png', etiqueta: 'Quena', umbral: 0 },
      ],
    },
    // Insignias nuevas (las imagenes "Gemini_Generated_Image_..." que se
    // agregaron a public/img/accesorios/): cada una tiene dos archivos,
    // uno "-removebg-preview.png" (sin fondo, se usa aca en el boton para
    // que quede igual que los demas) y uno ".jpeg" (con fondo/ilustracion
    // completa, se usa en imagenCentro para la vista previa grande).
    // Puntos puestos a ojo, mas altos que los accesorios de siempre para
    // que sean metas a mas largo plazo -- avisale a Alex si los quiere
    // distintos.
    {
      titulo: 'Insignias',
      opciones: [
        { id: 'insignia_mundo_cultura', emoji: '🌎', imagen: 'img/accesorios/Gemini_Generated_Image_4lwh8e4lwh8e4lwh-removebg-preview.png', imagenCentro: 'img/accesorios/Gemini_Generated_Image_4lwh8e4lwh8e4lwh.jpeg', etiqueta: 'Más cultura', umbral: 300 },
        { id: 'insignia_diferencias', emoji: '🦙', imagen: 'img/accesorios/Gemini_Generated_Image_4tzhcf4tzhcf4tzh-removebg-preview.png', imagenCentro: 'img/accesorios/Gemini_Generated_Image_4tzhcf4tzhcf4tzh.jpeg', etiqueta: 'Nuestras diferencias', umbral: 500 },
        { id: 'insignia_identidad', emoji: '🐆', imagen: 'img/accesorios/Gemini_Generated_Image_5nlcoz5nlcoz5nlc-removebg-preview.png', imagenCentro: 'img/accesorios/Gemini_Generated_Image_5nlcoz5nlcoz5nlc.jpeg', etiqueta: 'Cultura y identidad', umbral: 700 },
        { id: 'zampona_festiva', emoji: '🎶', imagen: 'img/accesorios/Gemini_Generated_Image_9o1nlk9o1nlk9o1n-removebg-preview.png', imagenCentro: 'img/accesorios/Gemini_Generated_Image_9o1nlk9o1nlk9o1n.jpeg', etiqueta: 'Zampoña festiva', umbral: 900 },
        { id: 'insignia_inclusion', emoji: '🥇', imagen: 'img/accesorios/Gemini_Generated_Image_ju8riaju8riaju8r-removebg-preview.png', imagenCentro: 'img/accesorios/Gemini_Generated_Image_ju8riaju8riaju8r.jpeg', etiqueta: 'Mundo inclusivo', umbral: 1100 },
        { id: 'insignia_libros', emoji: '📚', imagen: 'img/accesorios/Gemini_Generated_Image_t2zkr3t2zkr3t2zk-removebg-preview.png', imagenCentro: 'img/accesorios/Gemini_Generated_Image_t2zkr3t2zkr3t2zk.jpeg', etiqueta: 'Historias del mundo', umbral: 1300 },
        { id: 'sombrero_flores', emoji: '🌻', imagen: 'img/accesorios/Gemini_Generated_Image_u5vq1gu5vq1gu5vq-removebg-preview.png', imagenCentro: 'img/accesorios/Gemini_Generated_Image_u5vq1gu5vq1gu5vq.jpeg', etiqueta: 'Sombrero de flores', umbral: 1500 },
        { id: 'camara_viajera', emoji: '📸', imagen: 'img/accesorios/Gemini_Generated_Image_vqt65lvqt65lvqt6-removebg-preview.png', imagenCentro: 'img/accesorios/Gemini_Generated_Image_vqt65lvqt65lvqt6.jpeg', etiqueta: 'Cámara viajera', umbral: 1700 },
        { id: 'insignia_condor', emoji: '🦅', imagen: 'img/accesorios/Gemini_Generated_Image_vx4taxvx4taxvx4t-removebg-preview.png', imagenCentro: 'img/accesorios/Gemini_Generated_Image_vx4taxvx4taxvx4t.jpeg', etiqueta: 'Cóndor inclusivo', umbral: 1900 },
        { id: 'insignia_brujula', emoji: '🧭', imagen: 'img/accesorios/Gemini_Generated_Image_xvusq4xvusq4xvus-removebg-preview.png', imagenCentro: 'img/accesorios/Gemini_Generated_Image_xvusq4xvusq4xvus.jpeg', etiqueta: 'Brújula viajera', umbral: 2100 },
        { id: 'insignia_delfin', emoji: '🐬', imagen: 'img/accesorios/Gemini_Generated_Image_yivosvyivosvyivo-removebg-preview.png', imagenCentro: 'img/accesorios/Gemini_Generated_Image_yivosvyivosvyivo.jpeg', etiqueta: 'Cuidar la diversidad', umbral: 2300 },
        { id: 'insignia_manos', emoji: '🤝', imagen: 'img/accesorios/Gemini_Generated_Image_gm7nk4gm7nk4gm7n-removebg-preview.png', imagenCentro: 'img/accesorios/Gemini_Generated_Image_gm7nk4gm7nk4gm7n.jpeg', etiqueta: 'Fuerza en la diversidad', umbral: 2500 },
        { id: 'insignia_tortuga', emoji: '🐢', imagen: 'img/accesorios/Gemini_Generated_Image_eb3yiqeb3yiqeb3y-removebg-preview.png', imagenCentro: 'img/accesorios/Gemini_Generated_Image_eb3yiqeb3yiqeb3y.jpeg', etiqueta: 'Pequeñas acciones', umbral: 2700 },
      ],
    },
  ];

  private todosLosAccesorios: OpcionAccesorio[] = this.categorias.flatMap((c) => c.opciones);

  constructor(
    public auth: Auth,
    private router: Router
  ) {
    if (!this.auth.estaLogueado()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.auth.usuarioActual()?.personaje_completo) {
      this.router.navigate(['/personalizar']);
      return;
    }

    this.accesoriosSeleccionados.set(this.auth.usuarioActual()?.accesorios ?? []);

    // Trae los puntos actualizados del servidor apenas se entra a la
    // pagina, para que lo que esta desbloqueado o no sea siempre correcto.
    this.auth.refrescarUsuario().subscribe({
      next: (usuario) => this.accesoriosSeleccionados.set(usuario.accesorios ?? []),
      error: () => {},
    });
  }

  get emojiAvatar(): string {
    const avatar = this.auth.usuarioActual()?.avatar;
    return (avatar && EMOJIS_AVATAR[avatar]) || '🙂';
  }

  get imagenAvatar(): string | null {
    const avatar = this.auth.usuarioActual()?.avatar;
    const familia = avatar && FAMILIA_AVATAR[avatar];
    if (!familia) {
      return null;
    }
    const tono = this.tonoPiel.replace('#', '');
    return `img/personaje/avatares/${familia}-${tono}.png`;
  }

  // Clave unica por avatar + tono, para que el respaldo a emoji sea por
  // combinacion exacta (si falta la foto de un tono no oculta las demas).
  get claveImagenAvatar(): string {
    return `avatar_${this.auth.usuarioActual()?.avatar}_${this.tonoPiel}`;
  }

  get colorRopa(): string {
    switch (this.auth.usuarioActual()?.ropa) {
      case 'poncho_morado':
        return '#6c3fa1';
      case 'poncho_rojo':
        return '#c0392b';
      case 'chaleco_verde':
        return '#2f6b3a';
      case 'poncho_negro':
        return '#2b2b2b';
      default:
        return '#6c3fa1';
    }
  }

  get etiquetaRopa(): string {
    const ropa = this.auth.usuarioActual()?.ropa;
    return (ropa && ETIQUETAS_ROPA[ropa]) || '';
  }

  get tonoPiel(): string {
    return this.auth.usuarioActual()?.tono_piel || '#f5d3a8';
  }

  get puntosActuales(): number {
    return this.auth.usuarioActual()?.puntos ?? 0;
  }

  get accesoriosElegidos(): OpcionAccesorio[] {
    return this.todosLosAccesorios.filter((a) => this.accesoriosSeleccionados().includes(a.id));
  }

  // De los accesorios elegidos, los que van dibujados sobre el personaje
  // (collar, corona de flores, animales) y los que se quedan en la fila de
  // circulos de abajo (instrumentos, ceramica).
  get accesoriosSobrePersonaje(): OpcionAccesorio[] {
    return this.accesoriosElegidos.filter((a) => POSICION_SOBRE_PERSONAJE[a.id]);
  }

  get accesoriosEnFila(): OpcionAccesorio[] {
    return this.accesoriosElegidos.filter((a) => !POSICION_SOBRE_PERSONAJE[a.id]);
  }

  posicionTop(id: string): string {
    return POSICION_SOBRE_PERSONAJE[id]?.top ?? '0';
  }

  posicionLeft(id: string): string {
    return POSICION_SOBRE_PERSONAJE[id]?.left ?? '0';
  }

  posicionAncho(id: string): string {
    return POSICION_SOBRE_PERSONAJE[id]?.width ?? '0';
  }

  posicionZ(id: string): number {
    return POSICION_SOBRE_PERSONAJE[id]?.z ?? 1;
  }

  estaDesbloqueado(accesorio: OpcionAccesorio): boolean {
    return this.puntosActuales >= accesorio.umbral;
  }

  estaSeleccionado(id: string): boolean {
    return this.accesoriosSeleccionados().includes(id);
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

  alternar(accesorio: OpcionAccesorio) {
    if (!this.estaDesbloqueado(accesorio)) {
      return;
    }

    // A pedido de Alex: solo se puede tener UN accesorio elegido a la
    // vez (antes se podian elegir varios juntos). Tocar el que ya esta
    // elegido lo destilda; tocar otro reemplaza al anterior.
    const actuales = this.accesoriosSeleccionados();
    this.accesoriosSeleccionados.set(actuales.includes(accesorio.id) ? [] : [accesorio.id]);
  }

  guardar() {
    this.error.set('');
    this.exito.set(false);
    this.guardando.set(true);

    this.auth.guardarAccesorios(this.accesoriosSeleccionados()).subscribe({
      next: () => {
        this.guardando.set(false);
        this.exito.set(true);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'No se pudieron guardar tus accesorios.');
      },
    });
  }
}
