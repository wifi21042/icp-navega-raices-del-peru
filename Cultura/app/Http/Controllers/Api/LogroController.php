<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LogroController extends Controller
{
    // Los mismos ids de accesorios que usa el frontend (accesorios.ts) y
    // PersonajeController (9 "de siempre" + 13 insignias nuevas = 22 en
    // total), con los puntos que hacen falta para tenerlos TODOS
    // desbloqueados (la insignia "Pequeñas acciones", que es la mas cara)
    // y para tener 21 de los 22 (la insignia "Fuerza en la diversidad",
    // la segunda mas cara). Si agregan o quitan accesorios hay que
    // actualizar estos dos numeros.
    private const PUNTOS_TODOS_LOS_ACCESORIOS = 2700;

    private const PUNTOS_CASI_TODOS_LOS_ACCESORIOS = 2500;

    // Los ids de los retos "normales" de RetoController::RETOS, SIN los dos
    // retos especiales por tiempo limitado (especial_explorador_veloz y
    // especial_leyenda_peru). Los excluimos aca a proposito: esos retos
    // especiales vencen a los 14 dias de publicados, asi que si los
    // contaramos para "completa TODOS los retos", cualquiera que se una
    // despues de esa fecha (o no haya alcanzado a jugarlos) jamas podria
    // conseguir el logro, sin importar cuanto juegue. Si agregan mas retos
    // normales a RetoController, hay que sumarlos aca tambien.
    private const RETOS_REGULARES = [
        'personaje_completo',
        'machu_picchu',
        'incas',
        'gastronomia',
        'musica_andina',
        'danza',
        'selva',
        'costa',
        'amigos',
        'maestro_cultura',
    ];

    // Los 4 minijuegos de MinijuegoController::MINIJUEGOS. Se usan para
    // "Golpe Maestro" (sacar 3 estrellas en UNO) y "Senor de las Raices"
    // (sacar 3 estrellas en los 4).
    private const MINIJUEGOS_IDS = [
        'aventura-andina',
        'ritmos-danzas',
        'sabores-peru',
        'tesoros-amazonicos',
    ];

    // El catalogo de logros. Cada uno tiene un "criterio": una funcion que
    // recibe un resumen de datos de UN usuario (ver resumenUsuario() mas
    // abajo) y devuelve true/false segun si ese usuario ya lo cumple. Como
    // el criterio se calcula con datos reales que ya guarda el juego
    // (puntos, retos completados, amigos, minijuegos, etc.), el porcentaje
    // de abajo ("cuantos jugadores lo tienen") tambien sale de datos
    // reales, no es un numero inventado. La "rareza" (ultra raro / raro /
    // medio / comun) tampoco esta escrita a mano en ningun logro: sale
    // sola segun ese porcentaje real (ver rareza() mas abajo), asi que se
    // va acomodando solo con el tiempo, como en Steam.
    //
    // Los logros de "responder en menos de 5 segundos" y "encontrar
    // easter eggs" no estan aca todavia: el juego no guarda cuanto tarda
    // alguien en responder, y todavia no existen easter eggs escondidos en
    // el juego para poder encontrarlos. Se pueden agregar mas adelante si
    // se arma ese seguimiento.
    //
    // Los de "jugar X dias seguidos" (racha_3dias, racha_7dias,
    // racha_30dias) SI son reales: User::racha_dias se actualiza en
    // RetoController y MinijuegoController cada vez que se completa algo
    // (ver App\Support\Racha), y se reinicia solo si paso un dia entero
    // sin jugar.
    private function catalogo(): array
    {
        return [
            ['id' => 'primeros_pasos', 'titulo' => 'Primeros Pasos', 'descripcion' => 'Inicia sesion y entra al menu principal.', 'icono' => '🎒',
                'criterio' => fn (array $r) => true],
            ['id' => 'identidad_propia', 'titulo' => 'Identidad Propia', 'descripcion' => 'Completa tu personaje: avatar, ropa y nombre.', 'icono' => '🎨',
                'criterio' => fn (array $r) => $r['personaje_completo']],
            ['id' => 'conectado', 'titulo' => 'Conectado', 'descripcion' => 'Vincula tu cuenta de Google al perfil.', 'icono' => '🔗',
                'criterio' => fn (array $r) => $r['google']],
            ['id' => 'primer_saber', 'titulo' => 'Primer Saber', 'descripcion' => 'Responde tu primera pregunta correcta en un quiz.', 'icono' => '📜',
                'criterio' => fn (array $r) => $r['preguntas_correctas'] >= 1],
            ['id' => 'explorador', 'titulo' => 'Explorador', 'descripcion' => 'Completa 1 reto.', 'icono' => '🏔️',
                'criterio' => fn (array $r) => count($r['retos_completados']) >= 1],
            ['id' => 'conocedor', 'titulo' => 'Conocedor', 'descripcion' => 'Completa 5 retos.', 'icono' => '📚',
                'criterio' => fn (array $r) => count($r['retos_completados']) >= 5],
            ['id' => 'curioso', 'titulo' => 'Curioso', 'descripcion' => 'Responde 10 preguntas correctas en los quices.', 'icono' => '🔍',
                'criterio' => fn (array $r) => $r['preguntas_correctas'] >= 10],
            ['id' => 'embajador', 'titulo' => 'Embajador', 'descripcion' => 'Invita a 3 amigos.', 'icono' => '🤝',
                'criterio' => fn (array $r) => $r['amigos'] >= 3],
            ['id' => 'voz_del_pueblo', 'titulo' => 'Voz del Pueblo', 'descripcion' => 'Ten 10 amigos en tu lista.', 'icono' => '💛',
                'criterio' => fn (array $r) => $r['amigos'] >= 10],
            ['id' => 'conquistador_andino', 'titulo' => 'Conquistador Andino', 'descripcion' => 'Completa los retos de Machu Picchu y de los Incas.', 'icono' => '⛰️',
                'criterio' => fn (array $r) => in_array('machu_picchu', $r['retos_completados'], true) && in_array('incas', $r['retos_completados'], true)],
            ['id' => 'explorador_selvatico', 'titulo' => 'Explorador Selvatico', 'descripcion' => 'Completa el reto de la selva amazonica.', 'icono' => '🌴',
                'criterio' => fn (array $r) => in_array('selva', $r['retos_completados'], true)],
            ['id' => 'marinero_costeno', 'titulo' => 'Marinero Costeno', 'descripcion' => 'Completa el reto de la costa del Peru.', 'icono' => '🌊',
                'criterio' => fn (array $r) => in_array('costa', $r['retos_completados'], true)],
            ['id' => 'golpe_maestro', 'titulo' => 'Golpe Maestro', 'descripcion' => 'Consigue 3 estrellas perfectas en un minijuego.', 'icono' => '🎯',
                'criterio' => fn (array $r) => ! empty($r['minijuegos_progreso']) && max($r['minijuegos_progreso']) >= 3],
            ['id' => 'racha_3dias', 'titulo' => 'En Racha', 'descripcion' => 'Juega 3 dias seguidos.', 'icono' => '🔥',
                'criterio' => fn (array $r) => $r['racha_dias'] >= 3],
            ['id' => 'racha_7dias', 'titulo' => 'Semana Completa', 'descripcion' => 'Juega 7 dias seguidos.', 'icono' => '🗓️',
                'criterio' => fn (array $r) => $r['racha_dias'] >= 7],
            ['id' => 'racha_30dias', 'titulo' => 'El Vuelo del Condor', 'descripcion' => 'Juega 30 dias seguidos.', 'icono' => '🦅',
                'criterio' => fn (array $r) => $r['racha_dias'] >= 30],
            ['id' => 'camaleon_maestro', 'titulo' => 'Camaleon Maestro', 'descripcion' => 'Desbloquea 21 de los 22 accesorios disponibles.', 'icono' => '🦎',
                'criterio' => fn (array $r) => $r['puntos'] >= self::PUNTOS_CASI_TODOS_LOS_ACCESORIOS],
            ['id' => 'guardian_nocturno', 'titulo' => 'El Guardian Nocturno', 'descripcion' => 'Completa un reto o mejora un minijuego entre medianoche y las 4 de la manana.', 'icono' => '🌙',
                'criterio' => fn (array $r) => $r['jugo_madrugada']],
            ['id' => 'maestro_cultura', 'titulo' => 'Maestro de la Cultura', 'descripcion' => 'Completa el reto final: Maestro de la cultura peruana.', 'icono' => '👑',
                'criterio' => fn (array $r) => in_array('maestro_cultura', $r['retos_completados'], true)],
            ['id' => 'arca_peruana', 'titulo' => 'Arca Peruana', 'descripcion' => 'Desbloquea todos los accesorios disponibles.', 'icono' => '🦙',
                'criterio' => fn (array $r) => $r['puntos'] >= self::PUNTOS_TODOS_LOS_ACCESORIOS],
            ['id' => 'leyenda_peru', 'titulo' => 'Leyenda del Peru', 'descripcion' => 'Completa todos los retos del juego.', 'icono' => '🌟',
                'criterio' => fn (array $r) => count(array_intersect(self::RETOS_REGULARES, $r['retos_completados'])) >= count(self::RETOS_REGULARES)],
            ['id' => 'senor_raices', 'titulo' => 'Senor de las Raices', 'descripcion' => 'Consigue 3 estrellas perfectas en los 4 minijuegos.', 'icono' => '🏵️',
                'criterio' => fn (array $r) => count(array_filter(self::MINIJUEGOS_IDS, fn ($id) => ($r['minijuegos_progreso'][$id] ?? 0) >= 3)) >= count(self::MINIJUEGOS_IDS)],
            ['id' => 'devocion_absoluta', 'titulo' => 'Devocion Absoluta', 'descripcion' => 'Alcanza el nivel maximo (100).', 'icono' => '🌞',
                'criterio' => fn (array $r) => $r['nivel'] >= 100],
        ];
    }

    // La misma formula de niveles que usa MinijuegoController (y el
    // frontend, en niveles.ts): el nivel 2 pide 300 puntos, el 3 pide
    // 800, y de ahi en adelante lo que hace falta para el siguiente nivel
    // sube de a 200 cada vez, hasta el nivel 100 (el maximo).
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

    // MinijuegoController guarda el progreso de cada minijuego como un
    // Record<ronda, estrellas> (ej. ['aventura-andina' => [1 => 3, 2 =>
    // 2]]), para poder tener 3 rondas por minijuego. Aca solo nos importa
    // la MEJOR ronda de cada uno, asi que lo aplanamos a Record<id,
    // mejores_estrellas> (los formatos viejos, de antes de que existieran
    // las rondas, ya vienen como un numero suelto, asi que tambien los
    // soportamos).
    private function mejoresEstrellasPorMinijuego(array $progreso): array
    {
        $resultado = [];
        foreach ($progreso as $id => $valor) {
            $resultado[$id] = is_array($valor) ? (empty($valor) ? 0 : max($valor)) : (int) $valor;
        }

        return $resultado;
    }

    private function resumenUsuario(User $usuario, array $amigosPorUsuario): array
    {
        return [
            'personaje_completo' => (bool) $usuario->personaje_completo,
            'google' => ! empty($usuario->google_id),
            'preguntas_correctas' => $usuario->preguntas_correctas ?? 0,
            'retos_completados' => $usuario->retos_completados ?? [],
            'puntos' => $usuario->puntos ?? 0,
            'amigos' => $amigosPorUsuario[$usuario->id] ?? 0,
            'minijuegos_progreso' => $this->mejoresEstrellasPorMinijuego($usuario->minijuegos_progreso ?? []),
            'jugo_madrugada' => (bool) $usuario->jugo_madrugada,
            'racha_dias' => $usuario->racha_dias ?? 0,
            'nivel' => self::nivelDesdePuntos($usuario->puntos ?? 0),
        ];
    }

    // Segun que tan poca gente lo tiene, para pintarlo distinto en la
    // pantalla (estilo "rareza" de Steam).
    private function rareza(float $porcentaje): string
    {
        if ($porcentaje < 1) {
            return 'ultra_raro';
        }
        if ($porcentaje < 10) {
            return 'raro';
        }
        if ($porcentaje < 40) {
            return 'medio';
        }

        return 'comun';
    }

    public function index(Request $request)
    {
        $usuarios = User::select(
            'id', 'personaje_completo', 'google_id', 'preguntas_correctas', 'retos_completados',
            'puntos', 'minijuegos_progreso', 'jugo_madrugada', 'racha_dias'
        )->get();

        $totalUsuarios = $usuarios->count();

        $amigosPorUsuario = DB::table('amistades')
            ->select('usuario_id', DB::raw('count(*) as total'))
            ->groupBy('usuario_id')
            ->pluck('total', 'usuario_id')
            ->all();

        $catalogo = $this->catalogo();

        // Primero calculamos, para cada usuario, cuales logros "normales"
        // cumple (todos menos "Deidad del Sol", que depende de los demas).
        $desbloqueosPorUsuario = [];
        foreach ($usuarios as $usuario) {
            $resumen = $this->resumenUsuario($usuario, $amigosPorUsuario);
            $desbloqueos = [];
            foreach ($catalogo as $logro) {
                $desbloqueos[$logro['id']] = (bool) $logro['criterio']($resumen);
            }
            $desbloqueosPorUsuario[$usuario->id] = $desbloqueos;
        }

        // "Deidad del Sol": desbloquea todos los demas logros del juego.
        $idsLogrosNormales = array_column($catalogo, 'id');
        $deidadPorUsuario = [];
        foreach ($desbloqueosPorUsuario as $usuarioId => $desbloqueos) {
            $deidadPorUsuario[$usuarioId] = count(array_filter($desbloqueos)) >= count($idsLogrosNormales);
        }

        $catalogo[] = [
            'id' => 'deidad_sol',
            'titulo' => 'Deidad del Sol',
            'descripcion' => 'Desbloquea todos los demas logros del juego.',
            'icono' => '🏆',
            'criterio' => null, // ya esta calculado en $deidadPorUsuario
        ];

        $usuarioActualId = $request->user()->id;

        // Fechas de desbloqueo YA guardadas para el usuario que esta
        // mirando la pantalla (las de los demas usuarios no hacen falta
        // aca, solo se usan para el porcentaje).
        $fechasGuardadas = DB::table('logros_desbloqueados')
            ->where('user_id', $usuarioActualId)
            ->pluck('desbloqueado_en', 'logro_id')
            ->all();

        $resultado = [];
        $nuevasFilas = [];
        $ahora = Carbon::now();

        foreach ($catalogo as $logro) {
            if ($logro['id'] === 'deidad_sol') {
                $cantidadConLogro = count(array_filter($deidadPorUsuario));
                $desbloqueado = $deidadPorUsuario[$usuarioActualId] ?? false;
            } else {
                $cantidadConLogro = 0;
                foreach ($desbloqueosPorUsuario as $desbloqueos) {
                    if ($desbloqueos[$logro['id']]) {
                        $cantidadConLogro++;
                    }
                }
                $desbloqueado = $desbloqueosPorUsuario[$usuarioActualId][$logro['id']] ?? false;
            }

            $porcentaje = $totalUsuarios > 0 ? round(($cantidadConLogro / $totalUsuarios) * 100, 1) : 0;

            // Si el usuario actual ya lo desbloqueo y todavia no tenemos
            // guardada la fecha, es "nuevo" (la primera vez que se
            // detecta): lo agregamos para guardarlo con la fecha de
            // ahorita.
            $desbloqueadoEn = $fechasGuardadas[$logro['id']] ?? null;
            if ($desbloqueado && ! $desbloqueadoEn) {
                $desbloqueadoEn = $ahora->toDateTimeString();
                $nuevasFilas[] = [
                    'user_id' => $usuarioActualId,
                    'logro_id' => $logro['id'],
                    'desbloqueado_en' => $ahora,
                ];
            }

            $resultado[] = [
                'id' => $logro['id'],
                'titulo' => $logro['titulo'],
                'descripcion' => $logro['descripcion'],
                'icono' => $logro['icono'],
                'desbloqueado' => $desbloqueado,
                'desbloqueado_en' => $desbloqueado ? $desbloqueadoEn : null,
                'porcentaje' => $porcentaje,
                'rareza' => $this->rareza($porcentaje),
            ];
        }

        if (! empty($nuevasFilas)) {
            // insertOrIgnore para que, si dos pestañas piden /logros al
            // mismo tiempo, no truene por la fecha unica user_id+logro_id.
            DB::table('logros_desbloqueados')->insertOrIgnore($nuevasFilas);
        }

        // Del mas raro (menos jugadores lo tienen) al mas comun, como en
        // Steam.
        usort($resultado, fn ($a, $b) => $a['porcentaje'] <=> $b['porcentaje']);

        return response()->json(['logros' => $resultado]);
    }
}
