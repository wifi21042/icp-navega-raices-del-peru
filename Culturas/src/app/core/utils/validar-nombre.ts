// Validacion compartida para el nombre de usuario (Registro, Mi cuenta) y
// para el nombre del personaje (Personalizar): solo letras (nada de
// numeros, puntos ni arrobas) y que no tenga palabras ofensivas.
//
// Esto es solo para avisar rapido en el formulario. El servidor vuelve a
// revisar lo mismo, asi que no hay forma de saltarse esto llamando a la API
// directamente.

// Lista basica de groserias/insultos comunes en español. No es
// exhaustiva, pero cubre los casos mas comunes.
const PALABRAS_PROHIBIDAS = [
  'puta', 'puto', 'putona', 'putazo', 'putisima',
  'mierda', 'mierd',
  'pendejo', 'pendeja',
  'verga',
  'cabron', 'cabrona', 'cabrones',
  'imbecil',
  'idiota',
  'estupido', 'estupida',
  'gilipollas',
  'maricon', 'marica',
  'zorra',
  'perra',
  'culero', 'culera', 'culiao', 'culia',
  'hijueputa', 'hdp', 'hijodeputa',
  'malparido', 'malparida',
  'joder',
  'chinga', 'chingada', 'chingado', 'chingar', 'chingatumadre',
  'coño',
  'polla',
  'concha',
  'boludo', 'pelotudo',
  'nazi', 'hitler',
  'violador', 'violacion',
  'puñeta',
];

const SOLO_LETRAS_Y_ESPACIOS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

function quitarTildes(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Devuelve un mensaje de error si el nombre no es valido, o null si esta
// bien.
export function errorDeNombre(nombre: string): string | null {
  const limpio = nombre.trim();

  if (!limpio) {
    return 'Escribe un nombre.';
  }

  if (!SOLO_LETRAS_Y_ESPACIOS.test(limpio)) {
    return 'El nombre solo puede tener letras: nada de numeros, puntos ni arrobas.';
  }

  const normalizado = quitarTildes(limpio.toLowerCase());

  if (PALABRAS_PROHIBIDAS.some((palabra) => normalizado.includes(palabra))) {
    return 'Ese nombre no esta permitido. Elige uno mas respetuoso.';
  }

  return null;
}
