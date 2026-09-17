import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type Nivel = 'facil' | 'medio' | 'dificil';
type TemaId = 'historia' | 'cultura' | 'naturaleza';

interface Leccion {
  id: string;
  icono: string;
  titulo: string;
  resumen: string;
  contenido: string;
  imagen: string;
  tema: TemaId;
  nivel: Nivel;
}

interface Tema {
  id: TemaId;
  icono: string;
  titulo: string;
}

// 3 temas con 5 lecciones cada uno (15 en total), para mantener la pagina
// curada y facil de leer en vez de una lista interminable. Cada leccion
// tiene un nivel de dificultad visible (facil / medio / dificil).
const TEMAS: Tema[] = [
  { id: 'historia', icono: '🏛️', titulo: 'Historia y Civilizaciones' },
  { id: 'cultura', icono: '🎶', titulo: 'Cultura Viva' },
  { id: 'naturaleza', icono: '🌿', titulo: 'Naturaleza y Gastronomía' },
];

const LECCIONES: Leccion[] = [
  {
    id: 'incas',
    icono: "🏔️",
    titulo: "El Imperio Inca",
    resumen: "Conoce el imperio mas grande de la America precolombina.",
    contenido: "El Imperio Inca (o Tawantinsuyu) fue el imperio mas grande de la America precolombina, con su capital en Cusco. Se extendio por gran parte de la cordillera de los Andes, abarcando partes de los actuales Peru, Ecuador, Bolivia, Chile y Argentina. Los incas construyeron una red de caminos llamada Qhapaq Ñan y ciudadelas como Machu Picchu, hoy una de las maravillas del mundo. Su idioma oficial era el quechua, que todavia hablan millones de personas en los Andes. El imperio llego a su fin en 1533, tras la llegada de los conquistadores españoles liderados por Francisco Pizarro.",
    imagen: 'img/imperio-inca.jpg',
    tema: 'historia',
    nivel: 'medio',
  },
  {
    id: 'dato_001',
    icono: "🏛️",
    titulo: "Caral: La Civilización más Antigua",
    resumen: "Descubre la cuna de la civilización en el continente americano.",
    contenido: "Ubicada en el valle de Supe, Caral tiene más de 5,000 años de antigüedad. Destacó por su arquitectura piramidal, plazas circulares hundidas y por haber convivido pacíficamente sin restos de armas ni murallas bélicas.",
    imagen: 'img/caral.jpeg',
    tema: 'historia',
    nivel: 'facil',
  },
  {
    id: 'dato_013',
    icono: "🏰",
    titulo: "Machu Picchu: Maravilla Mundial",
    resumen: "Santuario de piedra integrado en la ceja de selva cusqueña.",
    contenido: "Construida en el siglo XV, combina templos astronómicos como el Intihuatana con terrazas agrícolas colgantes, utilizando ensambles de piedra antisísmicos que desafían las fallas geológicas.",
    imagen: 'img/machu-picchu.jpeg',
    tema: 'historia',
    nivel: 'medio',
  },
  {
    id: 'dato_007',
    icono: "🏰",
    titulo: "Chan Chan: Capital de Barro",
    resumen: "Recorre la ciudadela precolombina más grande del continente.",
    contenido: "Capital del Reino Chimú en Trujillo, abarca más de 20 kilómetros cuadrados de adobe decorados con frisos marinos de peces, redes y aves que reflejan su estrecho vínculo con el mar.",
    imagen: 'img/chan-chan.jpeg',
    tema: 'historia',
    nivel: 'medio',
  },
  {
    id: 'dato_005',
    icono: "👑",
    titulo: "El Señor de Sipán",
    resumen: "La tumba real más rica encontrada intacta en América.",
    contenido: "Hallado en Huaca Rajada (Lambayeque), este monarca mochica fue enterrado con pectorales, narigueras de oro, turquesas y ornamentos que demostraron el avanzado nivel de la metalurgia costeña.",
    imagen: 'img/el-senor-de-sipan.jpg',
    tema: 'historia',
    nivel: 'dificil',
  },
  {
    id: 'musica_danza',
    icono: "🎵",
    titulo: "Musica y Danzas Andinas",
    resumen: "Descubre los sonidos e instrumentos tradicionales de los Andes.",
    contenido: "La musica andina peruana usa instrumentos unicos como la zampoña (una flauta de cañas de distintos tamaños), la quena (flauta de una sola caña) y el charango (un instrumento de cuerdas hecho tradicionalmente con caparazon de armadillo). Entre las danzas mas conocidas esta el Huayno, bailado en parejas al ritmo de estos instrumentos, y la Danza de las Tijeras, una danza acrobatica originaria de Ayacucho y Huancavelica, declarada Patrimonio Cultural Inmaterial de la Humanidad por la UNESCO.",
    imagen: 'img/musica-danzas-andinas.jpeg',
    tema: 'cultura',
    nivel: 'facil',
  },
  {
    id: 'idiomas',
    icono: "🗣️",
    titulo: "Idiomas Originarios",
    resumen: "El Peru tiene mas de 40 lenguas originarias ademas del español.",
    contenido: "Ademas del español, el Peru reconoce oficialmente el quechua y el aymara, hablados principalmente en la sierra, junto con mas de 40 lenguas amazonicas como el ashaninka y el shipibo. El quechua fue el idioma del Imperio Inca y hoy lo hablan mas de 4 millones de personas en el Peru, siendo la lengua indigena mas hablada de America.",
    imagen: 'img/idiomas-originarios.jpg',
    tema: 'cultura',
    nivel: 'facil',
  },
  {
    id: 'dato_048',
    icono: "☀️",
    titulo: "Inti Raymi: La Fiesta del Sol",
    resumen: "La recreación del rito solar del solsticio andino.",
    contenido: "Cada 24 de junio, Cusco revive la ceremonia inca con oraciones en quechua, música autóctona y danzas que inician en el Coricancha y culminan en la explanada de Sacsayhuamán.",
    imagen: 'img/inti-raymi.jpg',
    tema: 'cultura',
    nivel: 'medio',
  },
  {
    id: 'dato_024',
    icono: "💃",
    titulo: "La Marinera Norteña",
    resumen: "Danza nacional de elegancia, galanteo y zapateo.",
    contenido: "Parejas bailan con pañuelo blanco al aire; la mujer demuestra gracia descalza sobre la arena o el tabladillo mientras el varón la corteja con traje de chalán y sombrero de paja de jipijapa.",
    imagen: 'img/marinera-nortena.jpeg',
    tema: 'cultura',
    nivel: 'facil',
  },
  {
    id: 'dato_047',
    icono: "🛖",
    titulo: "Arte Textil de Taquile",
    resumen: "La tradición puneña donde los varones tejen a mano.",
    contenido: "En esta isla del Titicaca, los hombres tejen finos chullos y fajas cuyos colores y patrones geométricos indican el estado civil, la jerarquía y el rol comunitario de cada portador.",
    imagen: 'img/arte-textil-taquile.jpeg',
    tema: 'cultura',
    nivel: 'medio',
  },
  {
    id: 'gastronomia',
    icono: "🍽️",
    titulo: "Gastronomia Peruana",
    resumen: "Un recorrido por los sabores que hicieron famosa la cocina peruana.",
    contenido: "La cocina peruana es reconocida como una de las mas variadas del mundo, mezclando tradiciones indigenas, españolas, africanas, chinas y japonesas. El ceviche, pescado marinado en limon, es el plato bandera del pais. Otros platos famosos incluyen el lomo saltado, la causa limeña y el aji de gallina. El Peru tambien es el lugar de origen de la papa, con miles de variedades cultivadas en los Andes desde hace mas de 7000 años.",
    imagen: 'img/gastronomia-peruana.jpeg',
    tema: 'naturaleza',
    nivel: 'facil',
  },
  {
    id: 'amazonia',
    icono: "🌿",
    titulo: "Culturas de la Amazonia",
    resumen: "La selva peruana es hogar de decenas de pueblos indigenas.",
    contenido: "La Amazonia peruana alberga una enorme diversidad de pueblos indigenas, como los Ashaninka, los Shipibo-Konibo y los Aguaruna, cada uno con su propia lengua y tradiciones. La selva cubre mas de la mitad del territorio peruano y es hogar de miles de especies de plantas y animales, incluyendo el paiche (uno de los peces de agua dulce mas grandes del mundo) y el jaguar, el felino mas grande de America.",
    imagen: 'img/culturas-amazonia.jpg',
    tema: 'naturaleza',
    nivel: 'facil',
  },
  {
    id: 'dato_070',
    icono: "🍲",
    titulo: "El Cebiche Tradicional",
    resumen: "Patrimonio Cultural Inmaterial de la Humanidad.",
    contenido: "Pescado fresco del litoral cortado en dados, curado brevemente con jugo de limón norteño, ají limo y sal, acompañado de camote dulce, choclo tierno y cebolla roja crujiente.",
    imagen: 'img/cebiche-tradicional.jpeg',
    tema: 'naturaleza',
    nivel: 'facil',
  },
  {
    id: 'dato_085',
    icono: "🦅",
    titulo: "El Cóndor Andino",
    resumen: "El señor de los vientos con más de 3 metros de alas.",
    contenido: "Símbolo sagrado del mundo celestial (Hanan Pacha), esta majestuosa ave carroñera planea durante horas sin aletear aprovechando las corrientes térmicas de los cañones.",
    imagen: 'img/condor-andino.jpeg',
    tema: 'naturaleza',
    nivel: 'medio',
  },
  {
    id: 'dato_056',
    icono: "🛶",
    titulo: "Río Amazonas: El Gigante Fluvial",
    resumen: "La arteria acuática más caudalosa y extensa del planeta.",
    contenido: "Nacido en los glaciares de Arequipa, serpentea por la llanura amazónica albergando miles de especies de peces y sirviendo como principal vía de transporte e intercambio de la selva.",
    imagen: 'img/rio-amazonas.jpeg',
    tema: 'naturaleza',
    nivel: 'dificil',
  },
];

const ORDEN_NIVEL: Record<Nivel, number> = { facil: 0, medio: 1, dificil: 2 };
const TEXTO_NIVEL: Record<Nivel, string> = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' };

@Component({
  imports: [RouterLink],
  selector: 'app-aprende',
  styleUrl: './aprende.scss',
  templateUrl: './aprende.html',
})
export class AprendePagina {
  temas = TEMAS;
  lecciones = LECCIONES;
  leccionAbierta = signal<Leccion | null>(null);

  leccionesPorTema(temaId: TemaId): Leccion[] {
    return this.lecciones
      .filter((l) => l.tema === temaId)
      .sort((a, b) => ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]);
  }

  nivelTexto(nivel: Nivel): string {
    return TEXTO_NIVEL[nivel];
  }

  abrirLeccion(leccion: Leccion) {
    this.leccionAbierta.set(leccion);
  }

  cerrarLeccion() {
    this.leccionAbierta.set(null);
  }
}
