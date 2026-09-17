<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\Racha;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RetoController extends Controller
{
    // El catalogo de retos. "tipo" dice como se revisa si de verdad se
    // cumplio:
    //  - "manual": no tenemos como comprobarlo todavia (no hay quices ni
    //    mapa interactivo con seguimiento real), asi que el mismo usuario
    //    dice "ya lo hice" y se le cree.
    //  - "personaje": se revisa de verdad, mirando si ya completo su
    //    personaje.
    //  - "amigos": se revisa de verdad, contando sus amigos.
    //
    // "especial" + "recurrente_semanal": son retos especiales que se
    // repiten cada semana. Se activan todos los miercoles en la noche
    // (8pm) y quedan disponibles por 24 horas (hasta el jueves 8pm);
    // fuera de esa ventana quedan "dormidos" hasta el miercoles
    // siguiente. Dan una recompensa unica ademas de sus puntos (por
    // ahora solo puntos: la recompensa exacta se define mas adelante).
    // Dan mucho mas puntos que los retos normales para que ayuden a
    // subir de nivel mas rapido.
    private const RETOS = [
        ['id' => 'personaje_completo', 'titulo' => 'Completa tu personaje', 'descripcion' => 'Elige tu avatar, tu ropa y ponle nombre a tu personaje.', 'puntos' => 50, 'tipo' => 'personaje'],
        ['id' => 'machu_picchu', 'titulo' => 'Conoce Machu Picchu', 'descripcion' => 'Explora la maravilla inca en la seccion "Explora".', 'puntos' => 50, 'tipo' => 'manual'],
        ['id' => 'incas', 'titulo' => 'Aprende sobre los Incas', 'descripcion' => 'Lee sobre el Imperio Inca en la seccion "Aprende".', 'puntos' => 75, 'tipo' => 'manual'],
        ['id' => 'gastronomia', 'titulo' => 'Prueba la gastronomia peruana', 'descripcion' => 'Descubre los platos tipicos del Peru.', 'puntos' => 75, 'tipo' => 'manual'],
        ['id' => 'musica_andina', 'titulo' => 'Escucha musica andina', 'descripcion' => 'Conoce los instrumentos y sonidos de los Andes.', 'puntos' => 100, 'tipo' => 'manual'],
        ['id' => 'danza', 'titulo' => 'Aprende una danza tipica', 'descripcion' => 'Descubre una danza tradicional peruana.', 'puntos' => 100, 'tipo' => 'manual'],
        ['id' => 'selva', 'titulo' => 'Explora la selva amazonica', 'descripcion' => 'Recorre la region de la selva del Peru.', 'puntos' => 100, 'tipo' => 'manual'],
        ['id' => 'costa', 'titulo' => 'Recorre la costa del Peru', 'descripcion' => 'Conoce las ciudades y playas de la costa.', 'puntos' => 100, 'tipo' => 'manual'],
        ['id' => 'amigos', 'titulo' => 'Invita a 3 amigos', 'descripcion' => 'Agrega a 3 companeros en "Comunidad".', 'puntos' => 150, 'tipo' => 'amigos'],
        ['id' => 'maestro_cultura', 'titulo' => 'Maestro de la cultura peruana', 'descripcion' => 'El reto final: ya conoces todo el Peru.', 'puntos' => 200, 'tipo' => 'manual'],
        [
            'id' => 'especial_explorador_veloz',
            'titulo' => '⭐ Especial: Explorador veloz',
            'descripcion' => 'Reto especial por tiempo limitado. Responde bien el quiz antes de que se acabe el tiempo y gana una recompensa unica.',
            'puntos' => 500,
            'tipo' => 'quiz',
            'especial' => true,
            'recurrente_semanal' => true,
            'preguntas' => [
                ['pregunta' => '¿Cual es la capital del Peru?', 'opciones' => ['Lima', 'Cusco', 'Arequipa'], 'correcta' => 0],
                ['pregunta' => '¿Cual es el rio mas caudaloso del mundo, que pasa por la selva peruana?', 'opciones' => ['Rio Rimac', 'Rio Amazonas', 'Rio Urubamba'], 'correcta' => 1],
                ['pregunta' => '¿Cuantas regiones naturales tiene el Peru (costa, sierra y selva)?', 'opciones' => ['2', '3', '5'], 'correcta' => 1],
                ['pregunta' => '¿Cual es la moneda oficial del Peru?', 'opciones' => ['El Sol', 'El Peso', 'El Bolivar'], 'correcta' => 0],
                ['pregunta' => '¿Cual es el ave nacional del Peru?', 'opciones' => ['Condor andino', 'Gallito de las rocas', 'Guacamayo'], 'correcta' => 1],
            ],
        ],
        [
            'id' => 'especial_leyenda_peru',
            'titulo' => '⭐ Especial: Leyenda del Peru',
            'descripcion' => 'El reto especial mas grande, con la recompensa mas grande. Responde bien el quiz, disponible solo por tiempo limitado.',
            'puntos' => 1000,
            'tipo' => 'quiz',
            'especial' => true,
            'recurrente_semanal' => true,
            'preguntas' => [
                ['pregunta' => '¿En que año proclamo el Peru su independencia?', 'opciones' => ['1821', '1810', '1879'], 'correcta' => 0],
                ['pregunta' => '¿Quien fue el libertador que proclamo la independencia del Peru?', 'opciones' => ['Simon Bolivar', 'Jose de San Martin', 'Antonio Jose de Sucre'], 'correcta' => 1],
                ['pregunta' => '¿Como se llamaba el imperio que goberno gran parte de los Andes antes de la conquista espanola?', 'opciones' => ['Imperio Azteca', 'Imperio Maya', 'Imperio Inca'], 'correcta' => 2],
                ['pregunta' => '¿Cual es el plato considerado bandera gastronomica del Peru?', 'opciones' => ['Ceviche', 'Tacos', 'Empanadas'], 'correcta' => 0],
                ['pregunta' => '¿Cual es la cordillera que atraviesa el Peru de norte a sur?', 'opciones' => ['Cordillera de los Andes', 'Cordillera del Himalaya', 'Montes Urales'], 'correcta' => 0],
            ],
        ],
    ];

    // Cuantas respuestas correctas de 5 hacen falta para "pasar bien" el
    // quiz de un reto especial y que se active la recompensa.
    private const QUIZ_MINIMO_CORRECTAS = 4;

    // A que hora del miercoles se activan los retos especiales
    // recurrentes ("miercoles en la noche") y cuantas horas quedan
    // disponibles despues de eso ("un dia").
    private const DIA_ACTIVACION = Carbon::WEDNESDAY;
    private const HORA_ACTIVACION = 20; // 8pm
    private const DURACION_HORAS = 24;

    // Calcula la ventana [inicio, fin] del ciclo semanal mas reciente
    // (el miercoles 8pm mas cercano que ya paso, hasta 24 horas
    // despues) para un reto especial recurrente. Null si el reto no es
    // de este tipo.
    private static function ventanaSemanal(array $reto): ?array
    {
        if (empty($reto['especial']) || empty($reto['recurrente_semanal'])) {
            return null;
        }

        $ahora = now();
        $diasDesdeMiercoles = ($ahora->dayOfWeek - self::DIA_ACTIVACION + 7) % 7;
        $inicio = $ahora->copy()->subDays($diasDesdeMiercoles)->setTime(self::HORA_ACTIVACION, 0, 0);

        // Si "ahora" cae antes de esa hora (por ejemplo: es miercoles
        // pero todavia no son las 8pm), el ciclo vigente en realidad
        // empezo el miercoles de la semana pasada.
        if ($ahora->lessThan($inicio)) {
            $inicio->subWeek();
        }

        return [$inicio, $inicio->copy()->addHours(self::DURACION_HORAS)];
    }

    // ¿Esta activo ahorita mismo? Los retos que no son recurrentes
    // siempre estan disponibles.
    private static function estaActivo(array $reto): bool
    {
        $ventana = self::ventanaSemanal($reto);
        if ($ventana === null) {
            return true;
        }

        [$inicio, $fin] = $ventana;

        return now()->between($inicio, $fin);
    }

    // Cuando vuelve a activarse (el proximo miercoles 8pm), para
    // mostrarlo mientras esta "dormido". Null si esta activo ahorita o
    // si no es un reto recurrente.
    private static function proximaActivacion(array $reto): ?Carbon
    {
        $ventana = self::ventanaSemanal($reto);
        if ($ventana === null) {
            return null;
        }

        [$inicio, $fin] = $ventana;
        if (now()->between($inicio, $fin)) {
            return null;
        }

        return $inicio->copy()->addWeek();
    }

    // Lista todos los retos, marcando cuales ya completo el usuario y
    // cuales especiales estan activos ahorita.
    public function index(Request $request)
    {
        $completados = $request->user()->retos_completados ?? [];

        $retos = array_map(function ($reto) use ($completados) {
            $completado = in_array($reto['id'], $completados, true);
            $ventana = self::ventanaSemanal($reto);
            $activo = self::estaActivo($reto);

            $reto['completado'] = $completado;
            $reto['activo'] = $activo;
            $reto['disponible_hasta'] = ($ventana !== null && $activo) ? $ventana[1]->toIso8601String() : null;
            $reto['proxima_activacion'] = (! $completado) ? self::proximaActivacion($reto)?->toIso8601String() : null;

            // Las preguntas (con la respuesta correcta) solo se mandan
            // cuando se pide el quiz de ese reto en especifico, no en la
            // lista general.
            unset($reto['preguntas']);

            return $reto;
        }, self::RETOS);

        return response()->json(['retos' => $retos]);
    }

    // Marca un reto como completado (si de verdad se cumple) y le suma los
    // puntos del reto a la cuenta.
    public function completar(Request $request, string $id)
    {
        $reto = collect(self::RETOS)->firstWhere('id', $id);

        if (! $reto) {
            return response()->json(['message' => 'Ese reto no existe.'], 404);
        }

        $user = $request->user();
        $completados = $user->retos_completados ?? [];

        if (in_array($id, $completados, true)) {
            // Ya lo tenia completado: no le sumamos puntos de nuevo, solo
            // devolvemos su estado actual (no es un error).
            return response()->json(['user' => $user]);
        }

        if ($reto['tipo'] === 'quiz') {
            return response()->json([
                'message' => 'Este reto se completa jugando su quiz, no con este boton.',
            ], 422);
        }

        if (! empty($reto['especial']) && ! self::estaActivo($reto)) {
            return response()->json([
                'message' => 'Este reto especial no esta activo ahorita. Se activa cada miercoles en la noche.',
            ], 422);
        }

        if ($reto['tipo'] === 'personaje' && ! $user->personaje_completo) {
            return response()->json([
                'message' => 'Todavia no completaste tu personaje. Ve a "Editar personaje" primero.',
            ], 422);
        }

        if ($reto['tipo'] === 'amigos') {
            $cantidadAmigos = DB::table('amistades')->where('usuario_id', $user->id)->count();
            if ($cantidadAmigos < 3) {
                return response()->json([
                    'message' => 'Todavia no tienes 3 amigos. Agrega mas en "Comunidad".',
                ], 422);
            }
        }

        $completados[] = $id;
        $racha = Racha::calcular($user->ultima_actividad_racha, $user->racha_dias ?? 0);

        $user->update([
            'retos_completados' => $completados,
            'puntos' => ($user->puntos ?? 0) + $reto['puntos'],
            // Si esto se completa entre medianoche y las 4am, queda
            // marcado para siempre (aunque despues juegue a otra hora):
            // alimenta el logro "El Guardian Nocturno".
            'jugo_madrugada' => $user->jugo_madrugada || now()->hour < 4,
            'racha_dias' => $racha['racha_dias'],
            'ultima_actividad_racha' => $racha['ultima_actividad_racha'],
        ]);

        return response()->json(['user' => $user]);
    }

    // Trae las 5 preguntas del quiz de un reto especial, para jugarlo. No
    // se muestran las preguntas si el reto no esta activo ahorita
    // (esta "dormido" hasta el proximo miercoles) o si ya esta
    // completado (no hace falta volver a jugarlo).
    public function quiz(Request $request, string $id)
    {
        $reto = collect(self::RETOS)->firstWhere('id', $id);

        if (! $reto || $reto['tipo'] !== 'quiz') {
            return response()->json(['message' => 'Ese reto no tiene un quiz.'], 404);
        }

        $completados = $request->user()->retos_completados ?? [];
        if (in_array($id, $completados, true)) {
            return response()->json(['message' => 'Ya completaste este reto.'], 422);
        }

        if (! self::estaActivo($reto)) {
            return response()->json([
                'message' => 'Este reto especial no esta activo ahorita. Se activa cada miercoles en la noche.',
            ], 422);
        }

        $preguntas = array_map(fn ($pregunta, $indice) => [
            'indice' => $indice,
            'pregunta' => $pregunta['pregunta'],
            'opciones' => $pregunta['opciones'],
            'correcta' => $pregunta['correcta'],
        ], $reto['preguntas'], array_keys($reto['preguntas']));

        return response()->json([
            'id' => $id,
            'titulo' => $reto['titulo'],
            'puntos' => $reto['puntos'],
            'minimo_correctas' => self::QUIZ_MINIMO_CORRECTAS,
            'preguntas' => $preguntas,
        ]);
    }

    // Revisa las respuestas del quiz de un reto especial. Si acierta
    // suficientes (QUIZ_MINIMO_CORRECTAS de 5), recien ahi se marca el
    // reto como completado y se activa la recompensa (los puntos). Si no,
    // puede volver a intentarlo despues (mientras siga activo).
    public function completarQuiz(Request $request, string $id)
    {
        $reto = collect(self::RETOS)->firstWhere('id', $id);

        if (! $reto || $reto['tipo'] !== 'quiz') {
            return response()->json(['message' => 'Ese reto no tiene un quiz.'], 404);
        }

        $user = $request->user();
        $completados = $user->retos_completados ?? [];

        if (in_array($id, $completados, true)) {
            return response()->json(['user' => $user, 'aprobado' => true]);
        }

        if (! self::estaActivo($reto)) {
            return response()->json([
                'message' => 'Este reto especial no esta activo ahorita. Se activa cada miercoles en la noche.',
            ], 422);
        }

        $totalPreguntas = count($reto['preguntas']);

        $validator = Validator::make($request->all(), [
            'respuestas' => ['required', 'array', 'size:' . $totalPreguntas],
            'respuestas.*.indice' => ['required', 'integer', 'min:0', 'max:' . ($totalPreguntas - 1)],
            'respuestas.*.opcion' => ['required', 'integer', 'min:0', 'max:2'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Respuestas invalidas.', 'errors' => $validator->errors()], 422);
        }

        $correctas = 0;
        foreach ($request->respuestas as $item) {
            $preguntaReal = $reto['preguntas'][$item['indice']] ?? null;
            if ($preguntaReal && (int) $item['opcion'] === $preguntaReal['correcta']) {
                $correctas++;
            }
        }

        $aprobado = $correctas >= self::QUIZ_MINIMO_CORRECTAS;

        if (! $aprobado) {
            return response()->json([
                'aprobado' => false,
                'correctas' => $correctas,
                'total' => $totalPreguntas,
                'minimo_correctas' => self::QUIZ_MINIMO_CORRECTAS,
            ]);
        }

        $completados[] = $id;
        $racha = Racha::calcular($user->ultima_actividad_racha, $user->racha_dias ?? 0);

        $user->update([
            'retos_completados' => $completados,
            'puntos' => ($user->puntos ?? 0) + $reto['puntos'],
            // Solo sumamos las correctas cuando de verdad aprueba (y solo
            // una vez, porque una vez completado el reto no se puede volver
            // a jugar su quiz): asi nadie puede inflar el contador
            // reintentando el mismo quiz una y otra vez. Esto alimenta los
            // logros "Primer Saber" y "Curioso" en Recompensas.
            'preguntas_correctas' => ($user->preguntas_correctas ?? 0) + $correctas,
            'jugo_madrugada' => $user->jugo_madrugada || now()->hour < 4,
            'racha_dias' => $racha['racha_dias'],
            'ultima_actividad_racha' => $racha['ultima_actividad_racha'],
        ]);

        return response()->json([
            'aprobado' => true,
            'correctas' => $correctas,
            'total' => $totalPreguntas,
            'user' => $user,
        ]);
    }
}
