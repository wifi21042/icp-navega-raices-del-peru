<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AvisoController extends Controller
{
    // Devuelve los avisos pendientes del usuario (por ejemplo, "ya no eres
    // amigo de esa persona" cuando alguien te bloquea) y los borra, para que
    // se muestren una sola vez.
    public function index(Request $request)
    {
        $usuario = $request->user();

        $avisos = DB::table('avisos')
            ->where('usuario_id', $usuario->id)
            ->orderBy('id')
            ->get(['id', 'mensaje']);

        if ($avisos->isNotEmpty()) {
            DB::table('avisos')
                ->where('usuario_id', $usuario->id)
                ->whereIn('id', $avisos->pluck('id'))
                ->delete();
        }

        return response()->json(['avisos' => $avisos]);
    }
}
