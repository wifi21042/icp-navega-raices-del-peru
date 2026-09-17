import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type RegionId = 'costa' | 'sierra' | 'selva';

interface RegionInfo {
  id: RegionId;
  icono: string;
  titulo: string;
  resumen: string;
  contenido: string;
  maravilla: string;
  imagen: string;
}

interface Destino {
  id: string;
  icono: string;
  titulo: string;
  resumen: string;
  contenido: string;
  imagen: string;
  region: RegionId;
}

// Las 3 regiones naturales del Peru (costa, sierra y selva), con su
// "maravilla" mas conocida. Acompaña a los retos "machu_picchu", "costa"
// y "selva", que ya mencionan recorrer estas regiones.
const REGIONES: RegionInfo[] = [
  {
    id: 'costa',
    icono: '🏖️',
    titulo: 'Costa',
    resumen: 'Desde playas y desiertos hasta ciudadelas milenarias de barro.',
    contenido:
      'La costa peruana es una franja larga y angosta de desierto junto al oceano Pacifico, donde se encuentra Lima, la capital del pais. Alli tambien esta Chan Chan, cerca de Trujillo: la ciudad de barro (adobe) mas grande de America y antigua capital del reino Chimu. Mas al sur, en el desierto de Nazca, estan las famosas Lineas de Nazca, enormes figuras de animales y formas geometricas dibujadas en el suelo hace mas de 1500 años, tan grandes que solo se aprecian completas desde el aire.',
    maravilla: '✨ Maravilla: Lineas de Nazca',
    imagen: 'img/costa-region.jpg',
  },
  {
    id: 'sierra',
    icono: '🏔️',
    titulo: 'Sierra',
    resumen: 'Los Andes, el Imperio Inca y la ciudadela mas famosa del mundo.',
    contenido:
      'La sierra peruana esta formada por la cordillera de los Andes, la cadena montañosa mas larga del mundo. Alli se encuentra Cusco, la antigua capital del Imperio Inca, y a pocas horas de camino, Machu Picchu: una ciudadela inca construida en lo alto de una montaña, considerada una de las 7 maravillas del mundo moderno. La sierra tambien alberga el lago Titicaca, el lago navegable mas alto del mundo, compartido entre Peru y Bolivia.',
    maravilla: '✨ Maravilla: Machu Picchu',
    imagen: 'img/sierra-region.jpeg',
  },
  {
    id: 'selva',
    icono: '🌴',
    titulo: 'Selva',
    resumen: 'La selva mas grande del planeta, llena de vida y de rios gigantes.',
    contenido:
      'La selva peruana forma parte de la Amazonia, el bosque tropical mas grande del mundo, y cubre mas de la mitad del territorio del Peru. Por ella pasa el rio Amazonas, el rio mas caudaloso del planeta. Iquitos, la ciudad mas importante de la selva peruana, no tiene conexion por carretera con el resto del pais: solo se llega en avion o en barco. La Amazonia peruana es hogar de miles de especies de plantas y animales, muchas de las cuales todavia no han sido descubiertas por la ciencia.',
    maravilla: '✨ Maravilla: Rio Amazonas',
    imagen: 'img/selva-region.jpeg',
  },
];

// 18 destinos curados, 6 por region, para mantener la pagina enfocada
// (en vez de una lista larguisima). Organizados obligatoriamente en 3
// pestañas: Costa, Sierra y Selva.
const DESTINOS: Destino[] = [
  {
    id: 'destino_001',
    icono: "🌊",
    titulo: "Reserva Nacional de Paracas e Islas Ballestas (Ica)",
    resumen: "Navega junto a lobos marinos, pingüinos de Humboldt y el geoglifo del Candelabro.",
    contenido: "Santuario marino costero que combina formaciones rocosas sobre el mar con playas de arena roja y miles de aves guaneras.",
    imagen: 'img/paracas-ballestas.jpg',
    region: 'costa',
  },
  {
    id: 'destino_003',
    icono: "✈️",
    titulo: "Pampas y Líneas de Nazca (Ica)",
    resumen: "Sobrevuela los enigmáticos geoglifos milenarios trazados en el desierto.",
    contenido: "Extensas pampas áridas donde se aprecian gigantescas figuras zoomorfas como el colibrí, el mono, la araña y el astronauta.",
    imagen: 'img/lineas-nazca.webp',
    region: 'costa',
  },
  {
    id: 'destino_002',
    icono: "🏜️",
    titulo: "Oasis y Dunas de la Huacachina (Ica)",
    resumen: "Explora la laguna natural rodeada de gigantescas dunas de arena dorada.",
    contenido: "El único oasis natural de Sudamérica, ideal para recorrer el desierto en carros tubulares y deslizarse en tablas de sandboard.",
    imagen: 'img/huacachina.jpeg',
    region: 'costa',
  },
  {
    id: 'destino_014',
    icono: "🏰",
    titulo: "Ciudadela de Chan Chan (La Libertad)",
    resumen: "Camina por las plazas y murallas de la metrópoli de barro más grande de América.",
    contenido: "Capital del Reino Chimú, decorada con frisos en altorrelieve que representan olas marinas, pelícanos, peces y redes de pesca.",
    imagen: 'img/chan-chan-ciudadela.jpg',
    region: 'costa',
  },
  {
    id: 'destino_019',
    icono: "🏺",
    titulo: "Museo Tumbas Reales de Sipán (Lambayeque)",
    resumen: "Maravíllate con el ajuar funerario de oro y piedras preciosas del gobernante Mochica.",
    contenido: "Uno de los museos más modernos de América, construido con la forma de una pirámide moche para exhibir los tesoros de Sipán.",
    imagen: 'img/tumbas-reales-sipan.jpg',
    region: 'costa',
  },
  {
    id: 'destino_028',
    icono: "🏛️",
    titulo: "Centro Histórico de Lima y Catacumbas de San Francisco (Lima)",
    resumen: "Admira los balcones de madera tallada y las criptas subterráneas virreinales.",
    contenido: "Patrimonio de la Humanidad que resguarda la Plaza Mayor, iglesias barrocas y pasadizos funerarios coloniales.",
    imagen: 'img/centro-historico-lima.jpeg',
    region: 'costa',
  },
  {
    id: 'destino_035',
    icono: "🏰",
    titulo: "Santuario Histórico de Machu Picchu (Cusco)",
    resumen: "Explora la ciudadela de piedra inca oculta entre las montañas.",
    contenido: "Maravilla del mundo moderno que integra templos ceremoniales, terrazas agrícolas y recintos reales en armonía con la geografía andina.",
    imagen: 'img/machu-picchu-santuario.webp',
    region: 'sierra',
  },
  {
    id: 'destino_036',
    icono: "🧱",
    titulo: "Complejo Arqueológico de Sacsayhuamán (Cusco)",
    resumen: "Tócate con los colosales bloques de piedra megalítica encajados a la perfección.",
    contenido: "Fortaleza ceremonial cusqueña con tres niveles de murallas zigzagueantes y explanadas donde se celebra la Fiesta del Sol.",
    imagen: 'img/sacsayhuaman.jpeg',
    region: 'sierra',
  },
  {
    id: 'destino_037',
    icono: "🌈",
    titulo: "Montaña de Siete Colores - Vinicunca (Cusco)",
    resumen: "Asciende sobre los 5,000 metros para ver el lienzo mineral de los Andes.",
    contenido: "Cumbre andina con estratos multicolores expuestos por el deshielo, con vistas panorámicas al sagrado nevado Ausangate.",
    imagen: 'img/vinicunca.jpg',
    region: 'sierra',
  },
  {
    id: 'destino_040',
    icono: "🧂",
    titulo: "Salineras Milenarias de Maras (Cusco)",
    resumen: "Contempla las miles de pozas escalonadas de sal rosada natural.",
    contenido: "Pozo tras pozo alimentado por un manantial hipersalino subterráneo, cosechado a mano por comunidades locales desde tiempos preíncas.",
    imagen: 'img/salineras-maras.jpg',
    region: 'sierra',
  },
  {
    id: 'destino_046',
    icono: "🌊",
    titulo: "Lago Titicaca e Islas Flotantes de los Uros (Puno)",
    resumen: "Conoce el modo de vida ancestral sobre plataformas de totora viva.",
    contenido: "El lago navegable más alto del mundo (3,812 m s.n.m.), donde la comunidad edifica sus casas, escuelas e islas con juncos lacustres.",
    imagen: 'img/titicaca-uros.jpeg',
    region: 'sierra',
  },
  {
    id: 'destino_050',
    icono: "🦅",
    titulo: "Cañón del Colca y Mirador Cruz del Cóndor (Arequipa)",
    resumen: "Asómate al abismo cordillerano y admira el planeo del cóndor a corta distancia.",
    contenido: "Uno de los cañones más profundos del planeta, flanqueado por pueblos coloniales, andenes vivos y aguas termales en Chivay.",
    imagen: 'img/canon-colca.jpeg',
    region: 'sierra',
  },
  {
    id: 'destino_068',
    icono: "🛶",
    titulo: "Río Amazonas y Puerto de Nanay (Iquitos / Loreto)",
    resumen: "Zarpa hacia el río más caudaloso y extenso del planeta Tierra.",
    contenido: "El punto de partida fluvial para internarse en el bosque tropical primario, navegando entre comunidades ribereñas y cruceros de expedición.",
    imagen: 'img/amazonas-nanay.jpeg',
    region: 'selva',
  },
  {
    id: 'destino_069',
    icono: "🪞",
    titulo: "Reserva Nacional Pacaya Samiria (Loreto)",
    resumen: "Explora la \"Selva de los Espejos\" en canoas tradicionales.",
    contenido: "Más de 2 millones de hectáreas inundables donde las aguas oscuras reflejan perfectamente el cielo, hogar del paiche, manatí y delfín rosado.",
    imagen: 'img/pacaya-samiria.png',
    region: 'selva',
  },
  {
    id: 'destino_070',
    icono: "🌳",
    titulo: "Parque Nacional del Manu (Madre de Dios / Cusco)",
    resumen: "Internate en el refugio de biodiversidad biológica más virgen del mundo.",
    contenido: "Desde bosques nublados andinos hasta la llanura amazónica, hábitat protegido del jaguar, nutrias gigantes y cientos de aves exóticas.",
    imagen: 'img/parque-manu.jpg',
    region: 'selva',
  },
  {
    id: 'destino_073',
    icono: "🌄",
    titulo: "Fortaleza Monumental de Kuélap (Amazonas)",
    resumen: "Sube en teleférico a la ciudad amurallada de los Chachapoyas sobre las nubes.",
    contenido: "Colosal complejo de piedra erigido en la cresta de una montaña con murallas de 20 metros y casas circulares decoradas con rombos.",
    imagen: 'img/kuelap.jpeg',
    region: 'selva',
  },
  {
    id: 'destino_074',
    icono: "💧",
    titulo: "Catarata Gocta: El Chorro Blanco (Amazonas)",
    resumen: "Camina por bosques de neblina hasta una de las caídas de agua más altas del mundo.",
    contenido: "Impresionante cascada de 771 metros en dos saltos, rodeada de orquídeas silvestres, helechos gigantes y gallitos de las rocas.",
    imagen: 'img/catarata-gocta.jpg',
    region: 'selva',
  },
  {
    id: 'destino_071',
    icono: "🦜",
    titulo: "Lago Sandoval en la Reserva Nacional Tambopata (Madre de Dios)",
    resumen: "Navega en aguas calmas rodeadas de palmeras de aguaje y lobos de río.",
    contenido: "Lago de meandro en forma de herradura donde conviven caimanes negros, monos aulladores y colonias de nutrias gigantes.",
    imagen: 'img/lago-sandoval-tambopata.jpg',
    region: 'selva',
  },
];

@Component({
  imports: [RouterLink],
  selector: 'app-explora',
  styleUrl: './explora.scss',
  templateUrl: './explora.html',
})
export class ExploraPagina {
  regiones = REGIONES;
  destinos = DESTINOS;
  tabActiva = signal<RegionId>('costa');
  destinoAbierto = signal<Destino | null>(null);

  cambiarTab(region: RegionId) {
    this.tabActiva.set(region);
  }

  regionActiva(): RegionInfo {
    return this.regiones.find((r) => r.id === this.tabActiva())!;
  }

  destinosDeTab(): Destino[] {
    return this.destinos.filter((d) => d.region === this.tabActiva());
  }

  abrirDestino(destino: Destino) {
    this.destinoAbierto.set(destino);
  }

  cerrarDestino() {
    this.destinoAbierto.set(null);
  }
}
