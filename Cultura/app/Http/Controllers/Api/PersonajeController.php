<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Rules\NombreApropiado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PersonajeController extends Controller
{
    // Los mismos ids que usa el frontend en accesorios.ts, con los puntos
    // que hacen falta para desbloquear cada uno. Por ahora no tenemos un
    // sistema que registre "retos" completados uno por uno, asi que usamos
    // los puntos de la cuenta como referencia (igual que en Recompensas):
    // cuantos mas retos completes, mas puntos ganas, y con esos puntos se
    // van desbloqueando los accesorios.
    private const ACCESORIOS_UMBRALES = [
        'quena' => 0,
        'zampona' => 50,
        'maraca' => 150,
        'loro' => 250,
        'llama' => 350,
        'alpaca' => 450,
        'ceramica' => 600,
        'corona_flores' => 800,
        'collar' => 1000,
    ];

    // Guardar/actualizar la personalizacion del personaje del usuario logueado
    public function guardar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'avatar' => ['required', 'string', 'max:50'],
            'peinado' => ['required', 'string', 'max:50'],
            'tono_piel' => ['required', 'string', 'max:20'],
            'ropa' => ['required', 'string', 'max:50'],
            'nombre_personaje' => ['required', 'string', 'max:30', new NombreApropiado()],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        $user->update([
            'avatar' => $request->avatar,
            'peinado' => $request->peinado,
            'tono_piel' => $request->tono_piel,
            'ropa' => $request->ropa,
            'nombre_personaje' => $request->nombre_personaje,
            'personaje_completo' => true,
        ]);

        return response()->json(['user' => $user]);
    }

    // Guarda que accesorios tiene puestos el personaje ahora mismo. Solo
    // deja poner los que ya esten desbloqueados segun los puntos del
    // usuario (aunque el frontend ya no deja hacer clic en los bloqueados,
    // lo revisamos aca tambien para que nadie lo pueda saltar llamando a la
    // API directamente).
    public function guardarAccesorios(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'accesorios' => ['nullable', 'array'],
            'accesorios.*' => ['string', Rule::in(array_keys(self::ACCESORIOS_UMBRALES))],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $puntos = $user->puntos ?? 0;
        $accesorios = $request->accesorios ?? [];

        foreach ($accesorios as $id) {
            if ($puntos < self::ACCESORIOS_UMBRALES[$id]) {
                return response()->json([
                    'message' => 'Todavia no desbloqueaste ese accesorio. Sigue completando retos para ganar puntos.',
                ], 422);
            }
        }

        $user->update(['accesorios' => $accesorios]);

        return response()->json(['user' => $user]);
    }
}
