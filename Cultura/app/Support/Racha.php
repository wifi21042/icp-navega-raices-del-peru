<?php

namespace App\Support;

use Carbon\Carbon;

class Racha
{
    // Calcula la nueva racha de dias seguidos jugando, a partir de la
    // ultima fecha guardada y la racha que tenia hasta ahora. Se llama
    // cada vez que el usuario hace algo que "cuenta" como jugar (completar
    // un reto, aprobar el quiz de un reto especial, o mejorar su resultado
    // en un minijuego):
    //  - Si nunca habia jugado (fecha null): empieza la racha en 1.
    //  - Si ya jugo HOY: no cambia nada (no se puede inflar la racha
    //    jugando varias veces el mismo dia).
    //  - Si jugo AYER: suma 1 a la racha (sigue seguida).
    //  - Si paso mas de un dia sin jugar: la racha se reinicia a 1.
    public static function calcular(?string $ultimaFecha, int $rachaActual): array
    {
        $hoy = Carbon::today();

        if ($ultimaFecha === null) {
            return ['racha_dias' => 1, 'ultima_actividad_racha' => $hoy->toDateString()];
        }

        $ultima = Carbon::parse($ultimaFecha)->startOfDay();

        if ($ultima->isSameDay($hoy)) {
            return ['racha_dias' => max(1, $rachaActual), 'ultima_actividad_racha' => $ultima->toDateString()];
        }

        if ($ultima->isSameDay($hoy->copy()->subDay())) {
            return ['racha_dias' => $rachaActual + 1, 'ultima_actividad_racha' => $hoy->toDateString()];
        }

        return ['racha_dias' => 1, 'ultima_actividad_racha' => $hoy->toDateString()];
    }
}
