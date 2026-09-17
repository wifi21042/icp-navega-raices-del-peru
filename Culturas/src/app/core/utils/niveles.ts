// Tabla de niveles del jugador.
//
// Nivel 1 empieza en 0 puntos. Para llegar al nivel 2 hacen falta 300
// puntos en total. Para llegar al nivel 3 hacen falta 800 en total (un
// salto de 500). De ahi en adelante, lo que hace falta para el siguiente
// nivel sube de a 200 cada vez, hasta llegar al nivel 100 (el nivel
// maximo por ahora).
//
// Se rebalanceo esta tabla (antes el nivel 5 pedia 7600 puntos): jugando
// TODO lo que hay ahora mismo -todos los retos normales + las 3 rondas de
// los 4 minijuegos sacando 3 estrellas en cada una- solo se junta como
// 3475 puntos en total, asi que el nivel 5 (y ni hablar del 6) quedaba
// practicamente imposible de alcanzar. Con esta tabla nueva, el nivel 5
// pide 2400 (se llega jugando bastante, sin tener que completar
// absolutamente todo) y el nivel 6 (3500) queda como la meta para quien
// complete casi todo el contenido actual.
const NIVEL_MAXIMO = 100;

function construirUmbrales(): number[] {
  // umbrales[i] = puntos totales (acumulados) necesarios para el nivel (i + 2)
  const umbrales: number[] = [];
  let acumulado = 0;
  let salto = 300;

  for (let nivel = 2; nivel <= NIVEL_MAXIMO; nivel++) {
    acumulado += salto;
    umbrales.push(acumulado);
    salto = nivel === 2 ? 500 : salto + 200;
  }

  return umbrales;
}

const UMBRALES_NIVEL = construirUmbrales();

export interface InfoNivel {
  nivel: number;
  esNivelMaximo: boolean;
  puntosNivelActual: number;
  puntosProximoNivel: number | null;
  puntosParaSubir: number | null;
  progreso: number;
}

// Una fila de la tabla de "los 100 niveles" que se muestra en Juegos (que
// nivel es, y cuantos puntos TOTALES hacen falta para llegar ahi).
export interface FilaNivel {
  nivel: number;
  puntosRequeridos: number;
}

// Arma la tabla completa (nivel 1 al 100) para mostrarla entera, por
// ejemplo en el desplegable "Ver los 100 niveles" de la pagina Juegos.
export function tablaNiveles(): FilaNivel[] {
  const filas: FilaNivel[] = [{ nivel: 1, puntosRequeridos: 0 }];

  for (let i = 0; i < UMBRALES_NIVEL.length; i++) {
    filas.push({ nivel: i + 2, puntosRequeridos: UMBRALES_NIVEL[i] });
  }

  return filas;
}

export function calcularNivel(puntos: number): InfoNivel {
  const puntosSeguro = Math.max(0, puntos || 0);

  let nivel = 1;
  for (let i = 0; i < UMBRALES_NIVEL.length; i++) {
    if (puntosSeguro >= UMBRALES_NIVEL[i]) {
      nivel = i + 2;
    } else {
      break;
    }
  }

  const puntosNivelActual = nivel === 1 ? 0 : UMBRALES_NIVEL[nivel - 2];
  const indiceSiguiente = nivel - 1;
  const siguienteUmbral = indiceSiguiente < UMBRALES_NIVEL.length ? UMBRALES_NIVEL[indiceSiguiente] : null;

  const progreso =
    siguienteUmbral === null
      ? 100
      : Math.min(100, Math.max(0, ((puntosSeguro - puntosNivelActual) / (siguienteUmbral - puntosNivelActual)) * 100));

  return {
    nivel,
    esNivelMaximo: siguienteUmbral === null,
    puntosNivelActual,
    puntosProximoNivel: siguienteUmbral,
    puntosParaSubir: siguienteUmbral === null ? null : siguienteUmbral - puntosSeguro,
    progreso,
  };
}
