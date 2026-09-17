<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\Racha;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MinijuegoController extends Controller
{
    // El catalogo de minijuegos (mismos 4 que se muestran en el inicio).
    // Cada uno tiene un banco de 15 preguntas; cada vez que se juega se
    // eligen 5 al azar, para que se sienta distinto cada vez.
    //
    // "nivel_requerido": el nivel del jugador que hace falta para poder
    // jugarlo. Asi no todos los minijuegos estan disponibles desde el
    // principio: se van "desbloqueando" segun subes de nivel, y el que
    // pide mas nivel da mas puntos.
    //
    // "correcta" es el indice (0, 1 o 2) de la opcion correcta. Se le
    // manda al navegador junto con la pregunta para que el juego se
    // sienta rapido (feedback al toque), pero los puntos que de verdad se
    // guardan siempre se recalculan en el servidor en completar(), asi
    // que nadie gana premios de mentira mirando esto.
    private const MINIJUEGOS = [
        'aventura-andina' => [
            'titulo' => 'Aventura Andina',
            'descripcion' => 'Explora la sierra y descubre sus costumbres.',
            'color' => 'morado',
            'puntos' => 100,
            'nivel_requerido' => 1,
            'dificultad' => 'facil',
            'preguntas' => [
                ['pregunta' => '¿Cual es el instrumento de viento hecho de canas de distintos tamanos, tipico de los Andes?', 'opciones' => ['Cajon', 'Zampona', 'Guitarra'], 'correcta' => 1],
                ['pregunta' => '¿Que animal andino se usa desde hace siglos para cargar cosas por la montana?', 'opciones' => ['Llama', 'Delfin', 'Mono'], 'correcta' => 0],
                ['pregunta' => '¿Cual es la ciudadela inca mas famosa, ubicada cerca de Cusco?', 'opciones' => ['Machu Picchu', 'Kuelap', 'Chan Chan'], 'correcta' => 0],
                ['pregunta' => '¿Que alimento fue domesticado por primera vez en los Andes peruanos hace miles de anos?', 'opciones' => ['Arroz', 'Papa', 'Trigo'], 'correcta' => 1],
                ['pregunta' => '¿Como se llama el baile de la sierra que se baila en parejas, muchas veces con panuelos?', 'opciones' => ['Marinera', 'Huayno', 'Festejo'], 'correcta' => 1],
                ['pregunta' => '¿Cual era la capital del antiguo Imperio Inca?', 'opciones' => ['Cusco', 'Lima', 'Arequipa'], 'correcta' => 0],
                ['pregunta' => '¿Como se llama el lago navegable mas alto del mundo, compartido entre Peru y Bolivia?', 'opciones' => ['Lago Titicaca', 'Lago Junin', 'Lago Paron'], 'correcta' => 0],
                ['pregunta' => '¿Que metal precioso era muy valorado por los incas y usado en sus templos?', 'opciones' => ['Oro', 'Hierro', 'Bronce'], 'correcta' => 0],
                ['pregunta' => '¿Como se llamaba el sistema de caminos que conectaba todo el Imperio Inca?', 'opciones' => ['Qhapaq Ñan (Camino Inca)', 'Ruta 66', 'Camino de Santiago'], 'correcta' => 0],
                ['pregunta' => '¿Que ciudad andina es conocida como la "Ciudad Blanca" por sus edificios de sillar?', 'opciones' => ['Arequipa', 'Trujillo', 'Iquitos'], 'correcta' => 0],
                ['pregunta' => '¿Como se llama el textil tradicional andino tejido a mano con lana de alpaca u oveja?', 'opciones' => ['Poncho', 'Sombrero de paja', 'Bikini'], 'correcta' => 0],
                ['pregunta' => '¿Que instrumento de cuerda pequeño, tradicionalmente hecho con caparazon de armadillo, es tipico de los Andes?', 'opciones' => ['Charango', 'Violin', 'Arpa'], 'correcta' => 0],
                ['pregunta' => '¿Cual era el idioma principal del Imperio Inca, que todavia se habla hoy en los Andes?', 'opciones' => ['Quechua', 'Nahuatl', 'Guarani'], 'correcta' => 0],
                ['pregunta' => '¿Como se llama la celebracion andina en honor al sol, que se realiza en Cusco cada junio?', 'opciones' => ['Inti Raymi', 'Dia de los Muertos', 'Carnaval'], 'correcta' => 0],
                ['pregunta' => '¿Que animal andino da una lana muy fina y suave, usada para tejidos de alta calidad?', 'opciones' => ['Alpaca', 'Cerdo', 'Vaca'], 'correcta' => 0],
            ],
        ],
        'ritmos-danzas' => [
            'titulo' => 'Ritmos y Danzas',
            'descripcion' => 'Aprende sobre nuestras danzas tipicas.',
            'color' => 'azul',
            'puntos' => 100,
            'nivel_requerido' => 1,
            'dificultad' => 'facil',
            'preguntas' => [
                ['pregunta' => '¿De que region es la Marinera, uno de los bailes mas conocidos del Peru?', 'opciones' => ['Costa', 'Sierra', 'Selva'], 'correcta' => 0],
                ['pregunta' => '¿De que region es el Huayno, bailado con musica de zampona y charango?', 'opciones' => ['Costa', 'Sierra', 'Selva'], 'correcta' => 1],
                ['pregunta' => '¿Como se llama el baile afroperuano en el que el cajon es el instrumento principal?', 'opciones' => ['Festejo', 'Huayno', 'Tondero'], 'correcta' => 0],
                ['pregunta' => '¿De que zona del Peru es tradicional la danza "Sicuri", tocada con zampona?', 'opciones' => ['Costa', 'Sierra altiplanica', 'Selva'], 'correcta' => 1],
                ['pregunta' => '¿Que instrumento de percusion, hecho de una caja de madera, es tipico de la musica criolla de la costa?', 'opciones' => ['Zampona', 'Cajon', 'Quena'], 'correcta' => 1],
                ['pregunta' => '¿De que region es el "Tondero", baile alegre asociado a Piura y Lambayeque?', 'opciones' => ['Costa', 'Sierra', 'Selva'], 'correcta' => 0],
                ['pregunta' => '¿Como se llama una danza tipica de la selva que representa el movimiento de la anaconda?', 'opciones' => ['Danza de la Anaconda', 'Ballet clasico', 'Tango'], 'correcta' => 0],
                ['pregunta' => '¿Que instrumento de viento hecho de una sola caña, comun en la sierra, se toca soplando por un extremo?', 'opciones' => ['Quena', 'Tambor', 'Maraca'], 'correcta' => 0],
                ['pregunta' => '¿Como se llama la danza de tijeras, muy fisica y acrobatica, originaria de Ayacucho y Huancavelica?', 'opciones' => ['Danza de las Tijeras', 'Vals', 'Salsa'], 'correcta' => 0],
                ['pregunta' => '¿De que region es el "Alcatraz", baile afroperuano donde se intenta quemar una cinta con una vela?', 'opciones' => ['Costa', 'Sierra', 'Selva'], 'correcta' => 0],
                ['pregunta' => '¿Como se llama el instrumento de percusion hecho con la quijada seca de un burro, usado en musica afroperuana?', 'opciones' => ['Quijada de burro', 'Tambor africano', 'Pandereta'], 'correcta' => 0],
                ['pregunta' => '¿En que zona del Peru se originó la danza "Diablada", con trajes coloridos y mascaras?', 'opciones' => ['Sierra altiplanica (Puno)', 'Costa', 'Selva'], 'correcta' => 0],
                ['pregunta' => '¿Cual es el nombre de la fiesta de danzas y musica mas grande de Puno, declarada Patrimonio Cultural?', 'opciones' => ['Virgen de la Candelaria', 'Inti Raymi', 'Semana Santa'], 'correcta' => 0],
                ['pregunta' => '¿Que baile de pareja, con panuelos, es tipico de la costa norte y se asocia a los caballos de paso?', 'opciones' => ['Marinera norteña', 'Huayno', 'Festejo'], 'correcta' => 0],
                ['pregunta' => '¿Como se llama el paso especial y elegante del "caballo de paso peruano" durante la Marinera?', 'opciones' => ['Paso llano', 'Galope', 'Trote saltado'], 'correcta' => 0],
            ],
        ],
        'sabores-peru' => [
            'titulo' => 'Sabores del Peru',
            'descripcion' => 'Descubre platos tipicos de cada region.',
            'color' => 'verde',
            'puntos' => 150,
            'nivel_requerido' => 3,
            'dificultad' => 'medio',
            'preguntas' => [
                ['pregunta' => '¿Cual es el plato bandera del Peru, hecho con pescado crudo marinado en limon?', 'opciones' => ['Ceviche', 'Lomo saltado', 'Aji de gallina'], 'correcta' => 0],
                ['pregunta' => '¿De que region es tipico el "rocoto relleno"?', 'opciones' => ['Costa', 'Sierra', 'Selva'], 'correcta' => 1],
                ['pregunta' => '¿Cual es el ingrediente principal del "lomo saltado"?', 'opciones' => ['Carne de res', 'Pollo', 'Pescado'], 'correcta' => 0],
                ['pregunta' => '¿Con que se prepara la "chicha morada", una bebida tipica peruana?', 'opciones' => ['Maiz morado', 'Uva', 'Manzana'], 'correcta' => 0],
                ['pregunta' => '¿Que fruta amazonica se usa mucho en jugos y helados por su alto contenido de vitamina C?', 'opciones' => ['Camu camu', 'Manzana', 'Pera'], 'correcta' => 0],
                ['pregunta' => '¿El pisco, bebida bandera del Peru, se obtiene destilando que fruta?', 'opciones' => ['Uva', 'Manzana', 'Piña'], 'correcta' => 0],
                ['pregunta' => '¿Como se llama el plato de pollo desmenuzado en una salsa cremosa de aji amarillo?', 'opciones' => ['Aji de gallina', 'Ceviche', 'Causa'], 'correcta' => 0],
                ['pregunta' => '¿Que plato frio a base de papa amarilla prensada, relleno de pollo o atun, es tipico de la costa?', 'opciones' => ['Causa limeña', 'Tamal', 'Anticucho'], 'correcta' => 0],
                ['pregunta' => '¿Que es el "anticucho", muy popular en las calles del Peru?', 'opciones' => ['Brochetas de corazon de res a la parrilla', 'Una sopa', 'Un postre'], 'correcta' => 0],
                ['pregunta' => '¿Cual es el ingrediente principal de la "papa a la huancaina"?', 'opciones' => ['Papa con salsa de queso y aji amarillo', 'Arroz con pollo', 'Pescado frito'], 'correcta' => 0],
                ['pregunta' => '¿Con que se prepara principalmente el "suspiro a la limeña", un postre limeño?', 'opciones' => ['Manjar blanco y merengue', 'Solo frutas', 'Chocolate y menta'], 'correcta' => 0],
                ['pregunta' => '¿De que region es tipico el "juane", un plato envuelto en hojas de bijao con arroz y pollo?', 'opciones' => ['Selva', 'Costa', 'Sierra'], 'correcta' => 0],
                ['pregunta' => '¿Cual es un pez de mar muy usado en el ceviche clasico de la costa peruana?', 'opciones' => ['Corvina', 'Trucha de rio', 'Salmon de rio'], 'correcta' => 0],
                ['pregunta' => '¿Que grano andino, muy nutritivo, se ha popularizado en el mundo como "superalimento"?', 'opciones' => ['Quinua', 'Trigo', 'Cebada'], 'correcta' => 0],
                ['pregunta' => '¿Como se llama la bebida gaseosa peruana de color dorado, hecha con hierba luisa?', 'opciones' => ['Inca Kola', 'Coca-Cola', 'Sprite'], 'correcta' => 0],
            ],
        ],
        'tesoros-amazonicos' => [
            'titulo' => 'Tesoros Amazonicos',
            'descripcion' => 'Conoce la cultura y tradiciones de la selva.',
            'color' => 'naranja',
            'puntos' => 200,
            'nivel_requerido' => 5,
            'dificultad' => 'dificil',
            'preguntas' => [
                ['pregunta' => '¿Cual es el rio que recorre gran parte de la selva peruana y es el mas caudaloso del mundo?', 'opciones' => ['Rio Amazonas', 'Rio Rimac', 'Rio Urubamba'], 'correcta' => 0],
                ['pregunta' => '¿Como se llama el pez gigante de agua dulce, tipico del rio Amazonas?', 'opciones' => ['Paiche', 'Atun', 'Trucha'], 'correcta' => 0],
                ['pregunta' => '¿Que ave de colores muy vivos es uno de los simbolos de la selva peruana?', 'opciones' => ['Guacamayo', 'Pinguino', 'Gaviota'], 'correcta' => 0],
                ['pregunta' => '¿Cual es un pueblo indigena que vive tradicionalmente en la selva peruana?', 'opciones' => ['Ashaninka', 'Aymara', 'Nazca'], 'correcta' => 0],
                ['pregunta' => '¿Por que a la selva amazonica se le suele llamar "el pulmon del mundo"?', 'opciones' => ['Por su gran cantidad de plantas que producen oxigeno', 'Por tener muchas montanas', 'Por su clima frio'], 'correcta' => 0],
                ['pregunta' => '¿Cual es la ciudad mas importante de la selva peruana, conocida como puerta de entrada a la Amazonia?', 'opciones' => ['Iquitos', 'Cusco', 'Trujillo'], 'correcta' => 0],
                ['pregunta' => '¿Como se le llama al bote tradicional, con motor pequeño, usado para navegar los rios de la selva?', 'opciones' => ['Peque-peque (canoa a motor)', 'Tren', 'Globo aerostatico'], 'correcta' => 0],
                ['pregunta' => '¿Que reptil grande habita los rios y cochas de la Amazonia peruana?', 'opciones' => ['Caiman', 'Camaleon', 'Iguana marina'], 'correcta' => 0],
                ['pregunta' => '¿Como se le llama a la gran extension de bosque tropical que cubre gran parte de la selva peruana?', 'opciones' => ['Bosque tropical amazonico', 'Desierto', 'Tundra'], 'correcta' => 0],
                ['pregunta' => '¿Que animal con caparazon, conocido por su lentitud, vive en los rios amazonicos?', 'opciones' => ['Tortuga taricaya', 'Erizo', 'Camello'], 'correcta' => 0],
                ['pregunta' => '¿Cual es el felino mas grande de America, que habita la selva amazonica?', 'opciones' => ['Jaguar', 'Leon', 'Tigre'], 'correcta' => 0],
                ['pregunta' => '¿Como se llama el fruto de una palmera muy popular en la selva, de cascara escamosa color rojiza?', 'opciones' => ['Aguaje', 'Coco de playa', 'Platano'], 'correcta' => 0],
                ['pregunta' => '¿Que insecto colorido y de alas grandes es comun observar en la selva peruana?', 'opciones' => ['Mariposa morpho', 'Escarabajo del desierto', 'Hormiga de nieve'], 'correcta' => 0],
                ['pregunta' => '¿Que producto natural, extraido de un arbol de la selva, se usa para hacer llantas y globos?', 'opciones' => ['Caucho (jebe)', 'Algodon', 'Lana'], 'correcta' => 0],
                ['pregunta' => '¿Como se llama la epoca del año en la que los rios de la selva suben mucho su nivel de agua?', 'opciones' => ['Creciente (temporada de lluvias)', 'Sequia', 'Invierno con nieve'], 'correcta' => 0],
            ],
        ],
    ];

    // Cada minijuego tiene 3 rondas (facil, medio, dificil dentro de ESE
    // minijuego, sin relacion con el "nivel_requerido" para desbloquear el
    // minijuego completo). La ronda 1 siempre esta disponible; la 2 pide
    // haber intentado la 1, y la 3 haber intentado la 2. Cada ronda da mas
    // puntos que la anterior segun su "multiplicador".
    private const MULTIPLICADORES_RONDA = [
        1 => 1,
        2 => 1.5,
        3 => 2,
    ];

    // Calcula el nivel del jugador a partir de sus puntos, con la misma
    // formula que usa el frontend (niveles.ts): el nivel 2 pide 300
    // puntos, el 3 pide 800, y de ahi en adelante lo que hace falta para
    // el siguiente nivel sube de a 200 cada vez.
    //
    // Estos numeros se rebalancearon (antes el nivel 5 pedia 7600 puntos,
    // pero jugando TODO lo que hay ahora mismo -todos los retos normales +
    // las 3 rondas de los 4 minijuegos con 3 estrellas- solo se llega a
    // como 3475, asi que el nivel 5 era practicamente imposible). Ahora el
    // nivel 5 pide 2400 (se llega jugando bastante, sin tener que
    // completar absolutamente todo), y el nivel 6 (3500) queda como la
    // meta para quien complete casi todo el contenido actual.
    private static function nivelDesdePuntos(int $puntos): int
    {
        $puntos = max(0, $puntos);
        $nivel = 1;
        $acumulado = 0;
        $salto = 300;

        for ($n = 2; $n <= 100; $n++) {
            $acumulado += $salto;
            if ($puntos < $acumulado) {
                break;
            }
            $nivel = $n;
            $salto = $n === 2 ? 500 : $salto + 200;
        }

        return $nivel;
    }

    // Lista los minijuegos disponibles (sin las preguntas, solo la info
    // para mostrar las tarjetas), marcando cuales todavia estan
    // bloqueados por nivel.
    public function index(Request $request)
    {
        $nivelUsuario = self::nivelDesdePuntos($request->user()->puntos ?? 0);

        $lista = collect(self::MINIJUEGOS)->map(function ($juego, $id) use ($nivelUsuario) {
            return [
                'id' => $id,
                'titulo' => $juego['titulo'],
                'descripcion' => $juego['descripcion'],
                'color' => $juego['color'],
                'puntos' => $juego['puntos'],
                'nivel_requerido' => $juego['nivel_requerido'],
                'dificultad' => $juego['dificultad'],
                'bloqueado' => $nivelUsuario < $juego['nivel_requerido'],
            ];
        })->values();

        return response()->json(['minijuegos' => $lista]);
    }

    // El progreso de un usuario en UN minijuego, ya normalizado como
    // Record<ronda, estrellas> (ej. [1 => 3, 2 => 2]). Si todavia esta
    // guardado en el formato viejo (un solo numero, de antes de que
    // existieran las rondas), lo tratamos como el resultado de la ronda 1,
    // para no perder el progreso de quien ya habia jugado.
    private function progresoRondas($user, string $id): array
    {
        $valor = ($user->minijuegos_progreso ?? [])[$id] ?? [];

        if (! is_array($valor)) {
            return $valor > 0 ? [1 => (int) $valor] : [];
        }

        return $valor;
    }

    // Lista las 3 rondas de un minijuego (facil, medio, dificil), con las
    // estrellas que ya sacaste en cada una y cuales estan desbloqueadas.
    public function rondas(Request $request, string $id)
    {
        $juego = self::MINIJUEGOS[$id] ?? null;

        if (! $juego) {
            return response()->json(['message' => 'Ese minijuego no existe.'], 404);
        }

        $nivelUsuario = self::nivelDesdePuntos($request->user()->puntos ?? 0);
        if ($nivelUsuario < $juego['nivel_requerido']) {
            return response()->json([
                'message' => 'Necesitas nivel ' . $juego['nivel_requerido'] . ' para jugar esto.',
                'nivel_requerido' => $juego['nivel_requerido'],
            ], 403);
        }

        $progreso = $this->progresoRondas($request->user(), $id);

        $rondas = [];
        foreach (self::MULTIPLICADORES_RONDA as $ronda => $multiplicador) {
            $rondas[] = [
                'ronda' => $ronda,
                'multiplicador' => $multiplicador,
                'puntos' => (int) round($juego['puntos'] * $multiplicador),
                'estrellas' => $progreso[$ronda] ?? 0,
                'desbloqueada' => $ronda === 1 || isset($progreso[$ronda - 1]),
            ];
        }

        return response()->json([
            'id' => $id,
            'titulo' => $juego['titulo'],
            'descripcion' => $juego['descripcion'],
            'color' => $juego['color'],
            'dificultad' => $juego['dificultad'],
            'rondas' => $rondas,
        ]);
    }

    // Trae 5 preguntas al azar (de las 15 del banco) para jugar una ronda
    // en especifico. Cada pregunta lleva su "indice" dentro del banco,
    // para que completar() pueda revisarla despues sin importar el orden
    // en que se mostraron.
    public function mostrar(Request $request, string $id, string $ronda)
    {
        $juego = self::MINIJUEGOS[$id] ?? null;

        if (! $juego) {
            return response()->json(['message' => 'Ese minijuego no existe.'], 404);
        }

        $ronda = (int) $ronda;
        if (! isset(self::MULTIPLICADORES_RONDA[$ronda])) {
            return response()->json(['message' => 'Esa ronda no existe.'], 404);
        }

        $nivelUsuario = self::nivelDesdePuntos($request->user()->puntos ?? 0);
        if ($nivelUsuario < $juego['nivel_requerido']) {
            return response()->json([
                'message' => 'Necesitas nivel ' . $juego['nivel_requerido'] . ' para jugar esto.',
                'nivel_requerido' => $juego['nivel_requerido'],
            ], 403);
        }

        $progreso = $this->progresoRondas($request->user(), $id);
        if ($ronda > 1 && ! isset($progreso[$ronda - 1])) {
            return response()->json(['message' => 'Todavia no desbloqueas esta ronda.'], 422);
        }

        // Cada ronda (facil/medio/dificil) usa su PROPIO grupo de preguntas
        // dentro del banco de 15, sin mezclarse con las otras rondas: la
        // ronda 1 siempre saca de las primeras, la 2 de las de en medio, y
        // la 3 de las ultimas. Asi nunca se repite una pregunta entre
        // rondas del mismo minijuego (antes se elegian 5 al azar de las 15
        // sin importar la ronda, asi que una pregunta de la ronda facil
        // podia volver a salir en la dificil). El orden de aparicion si se
        // sigue mezclando cada vez, para que no se sienta siempre igual.
        $totalDisponibles = count($juego['preguntas']);
        $porRonda = max(1, intdiv($totalDisponibles, count(self::MULTIPLICADORES_RONDA)));
        $inicio = ($ronda - 1) * $porRonda;
        $esUltimaRonda = $ronda === count(self::MULTIPLICADORES_RONDA);
        $fin = $esUltimaRonda ? $totalDisponibles - 1 : min($inicio + $porRonda, $totalDisponibles) - 1;

        if ($inicio > $fin) {
            // Seguridad por si algun banco tiene menos preguntas de las
            // esperadas: mejor repetir el ultimo grupo que romper la ronda.
            $inicio = max(0, $totalDisponibles - $porRonda);
            $fin = $totalDisponibles - 1;
        }

        $indices = range($inicio, $fin);
        shuffle($indices);

        $preguntas = array_map(function ($indice) use ($juego) {
            $pregunta = $juego['preguntas'][$indice];
            return [
                'indice' => $indice,
                'pregunta' => $pregunta['pregunta'],
                'opciones' => $pregunta['opciones'],
                'correcta' => $pregunta['correcta'],
            ];
        }, $indices);

        return response()->json([
            'id' => $id,
            'titulo' => $juego['titulo'],
            'color' => $juego['color'],
            'dificultad' => $juego['dificultad'],
            'ronda' => $ronda,
            'multiplicador' => self::MULTIPLICADORES_RONDA[$ronda],
            'puntos' => (int) round($juego['puntos'] * self::MULTIPLICADORES_RONDA[$ronda]),
            'preguntas' => $preguntas,
            'mejor_estrellas' => $progreso[$ronda] ?? 0,
        ]);
    }

    // Revisa las respuestas que mando el jugador (cada una con el
    // "indice" de su pregunta dentro del banco, para poder calificarla
    // sin importar en que orden se jugaron), calcula estrellas (0 a 3) y
    // da puntos solo si mejoro su mejor resultado anterior en esa ronda
    // (asi no se puede "farmear" jugando una y otra vez). Con
    // cualquier resultado (aunque sea 0 estrellas) la ronda queda marcada
    // como "intentada", que es lo que desbloquea la siguiente.
    public function completar(Request $request, string $id, string $ronda)
    {
        $juego = self::MINIJUEGOS[$id] ?? null;

        if (! $juego) {
            return response()->json(['message' => 'Ese minijuego no existe.'], 404);
        }

        $ronda = (int) $ronda;
        if (! isset(self::MULTIPLICADORES_RONDA[$ronda])) {
            return response()->json(['message' => 'Esa ronda no existe.'], 404);
        }

        $nivelUsuario = self::nivelDesdePuntos($request->user()->puntos ?? 0);
        if ($nivelUsuario < $juego['nivel_requerido']) {
            return response()->json([
                'message' => 'Necesitas nivel ' . $juego['nivel_requerido'] . ' para jugar esto.',
            ], 403);
        }

        $user = $request->user();
        $progresoJuego = $this->progresoRondas($user, $id);

        if ($ronda > 1 && ! isset($progresoJuego[$ronda - 1])) {
            return response()->json(['message' => 'Todavia no desbloqueas esta ronda.'], 422);
        }

        $totalPreguntas = count($juego['preguntas']);

        $validator = Validator::make($request->all(), [
            'respuestas' => ['required', 'array', 'min:1', 'max:5'],
            'respuestas.*.indice' => ['required', 'integer', 'min:0', 'max:' . ($totalPreguntas - 1)],
            'respuestas.*.opcion' => ['required', 'integer', 'min:0', 'max:2'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Respuestas invalidas.', 'errors' => $validator->errors()], 422);
        }

        $correctas = 0;
        foreach ($request->respuestas as $item) {
            $preguntaReal = $juego['preguntas'][$item['indice']] ?? null;
            if ($preguntaReal && (int) $item['opcion'] === $preguntaReal['correcta']) {
                $correctas++;
            }
        }

        $total = count($request->respuestas);
        $estrellas = match (true) {
            $correctas === $total => 3,
            $correctas >= (int) ceil($total * 0.6) => 2,
            $correctas >= 1 => 1,
            default => 0,
        };

        $mejorAnterior = $progresoJuego[$ronda] ?? null;
        $primerIntento = $mejorAnterior === null;
        $multiplicador = self::MULTIPLICADORES_RONDA[$ronda];

        $puntosGanados = 0;

        if ($primerIntento || $estrellas > $mejorAnterior) {
            // Solo se paga la "diferencia" de estrellas nuevas, para que no
            // sea gratis volver a jugar y sacar el mismo puntaje otra vez.
            //
            // Importante: el total se calcula completo para el nivel de
            // estrellas actual y para el anterior, y recien ahi se resta
            // (en vez de calcular puntos-por-estrella y multiplicarlo por
            // la diferencia). Asi, sacar las 3 estrellas de una siempre da
            // exactamente el total de la ronda (ej. 100 pts en la ronda 1),
            // sin perder puntos por el redondeo de cada estrella suelta
            // (33 + 33 + 33 = 99, en vez de 100).
            $puntosTotalActual = (int) round($juego['puntos'] * $multiplicador * $estrellas / 3);
            $puntosTotalAnterior = (int) round($juego['puntos'] * $multiplicador * ($mejorAnterior ?? 0) / 3);
            $puntosGanados = $puntosTotalActual - $puntosTotalAnterior;

            $progresoJuego[$ronda] = $estrellas;
            $progresoCompleto = $user->minijuegos_progreso ?? [];
            $progresoCompleto[$id] = $progresoJuego;
            $racha = Racha::calcular($user->ultima_actividad_racha, $user->racha_dias ?? 0);

            $user->update([
                'minijuegos_progreso' => $progresoCompleto,
                'puntos' => ($user->puntos ?? 0) + $puntosGanados,
                'jugo_madrugada' => $user->jugo_madrugada || now()->hour < 4,
                'racha_dias' => $racha['racha_dias'],
                'ultima_actividad_racha' => $racha['ultima_actividad_racha'],
            ]);
        }

        return response()->json([
            'ronda' => $ronda,
            'correctas' => $correctas,
            'total' => $total,
            'estrellas' => $estrellas,
            'mejor_estrellas' => max($estrellas, $mejorAnterior ?? 0),
            'puntos_ganados' => $puntosGanados,
            'siguiente_ronda_desbloqueada' => $ronda < 3 && $primerIntento,
            'user' => $user,
        ]);
    }
}
