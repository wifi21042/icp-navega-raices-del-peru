<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AmigoController extends Controller
{
    // Busca usuarios por nombre, correo o nombre de personaje. La
    // coincidencia es EXACTA (sin distinguir mayusculas/minusculas): asi
    // "alex" nunca va a mostrar por error a "alexw" ni a nadie mas cuyo
    // nombre solo se parezca, para que no haya confusion sobre a quien le
    // estas mandando la solicitud. No muestra a quienes ya son amigos ni a
    // quienes ya tienen una solicitud pendiente (en cualquiera de los dos
    // sentidos) con el usuario actual.
    public function buscar(Request $request)
    {
        $usuario = $request->user();
        $texto = trim((string) $request->query('q', ''));

        if (strlen($texto) < 2) {
            return response()->json(['resultados' => []]);
        }

        $textoExacto = mb_strtolower($texto);

        $idsAmigos = DB::table('amistades')
            ->where('usuario_id', $usuario->id)
            ->pluck('amigo_id');

        $idsConSolicitud = DB::table('solicitudes_amistad')
            ->where('de_usuario_id', $usuario->id)
            ->orWhere('para_usuario_id', $usuario->id)
            ->get(['de_usuario_id', 'para_usuario_id'])
            ->flatMap(fn ($fila) => [$fila->de_usuario_id, $fila->para_usuario_id]);

        $idsBloqueados = DB::table('bloqueados')
            ->where('usuario_id', $usuario->id)
            ->orWhere('bloqueado_id', $usuario->id)
            ->get(['usuario_id', 'bloqueado_id'])
            ->flatMap(fn ($fila) => [$fila->usuario_id, $fila->bloqueado_id]);

        $excluir = $idsAmigos->merge($idsConSolicitud)->merge($idsBloqueados)->push($usuario->id)->unique();

        $resultados = User::whereNotIn('id', $excluir)
            ->where(function ($query) use ($textoExacto) {
                $query->whereRaw('LOWER(name) = ?', [$textoExacto])
                    ->orWhereRaw('LOWER(email) = ?', [$textoExacto])
                    ->orWhereRaw('LOWER(nombre_personaje) = ?', [$textoExacto]);
            })
            ->select('id', 'name', 'email', 'avatar', 'nombre_personaje')
            ->limit(15)
            ->get();

        return response()->json(['resultados' => $resultados]);
    }

    // Envia una solicitud de amistad (queda pendiente hasta que la otra
    // persona la acepte o la rechace).
    public function enviarSolicitud(Request $request)
    {
        $usuario = $request->user();

        $request->validate([
            'amigo_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $paraId = (int) $request->amigo_id;

        if ($paraId === $usuario->id) {
            return response()->json(['message' => 'No puedes agregarte a ti mismo.'], 422);
        }

        $yaSonAmigos = DB::table('amistades')
            ->where('usuario_id', $usuario->id)
            ->where('amigo_id', $paraId)
            ->exists();

        if ($yaSonAmigos) {
            return response()->json(['message' => 'Ya son amigos.'], 422);
        }

        $hayBloqueo = DB::table('bloqueados')
            ->where(function ($query) use ($usuario, $paraId) {
                $query->where('usuario_id', $usuario->id)->where('bloqueado_id', $paraId);
            })
            ->orWhere(function ($query) use ($usuario, $paraId) {
                $query->where('usuario_id', $paraId)->where('bloqueado_id', $usuario->id);
            })
            ->exists();

        if ($hayBloqueo) {
            return response()->json(['message' => 'No puedes enviar una solicitud a esta persona.'], 422);
        }

        $solicitudExistente = DB::table('solicitudes_amistad')
            ->where(function ($query) use ($usuario, $paraId) {
                $query->where('de_usuario_id', $usuario->id)->where('para_usuario_id', $paraId);
            })
            ->orWhere(function ($query) use ($usuario, $paraId) {
                $query->where('de_usuario_id', $paraId)->where('para_usuario_id', $usuario->id);
            })
            ->exists();

        if ($solicitudExistente) {
            return response()->json(['message' => 'Ya existe una solicitud entre ustedes.'], 422);
        }

        DB::table('solicitudes_amistad')->insert([
            'de_usuario_id' => $usuario->id,
            'para_usuario_id' => $paraId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['mensaje' => 'Solicitud enviada.']);
    }

    // Solicitudes que otras personas te enviaron a ti y aun no respondes.
    public function solicitudesRecibidas(Request $request)
    {
        $usuario = $request->user();

        $solicitudes = DB::table('solicitudes_amistad')
            ->join('users', 'users.id', '=', 'solicitudes_amistad.de_usuario_id')
            ->where('solicitudes_amistad.para_usuario_id', $usuario->id)
            ->select(
                'solicitudes_amistad.id as solicitud_id',
                'users.id as usuario_id',
                'users.name',
                'users.nombre_personaje',
                'users.avatar'
            )
            ->orderByDesc('solicitudes_amistad.id')
            ->get();

        return response()->json(['solicitudes' => $solicitudes]);
    }

    // Solicitudes que tu enviaste y todavia estan pendientes de respuesta.
    public function solicitudesEnviadas(Request $request)
    {
        $usuario = $request->user();

        $solicitudes = DB::table('solicitudes_amistad')
            ->join('users', 'users.id', '=', 'solicitudes_amistad.para_usuario_id')
            ->where('solicitudes_amistad.de_usuario_id', $usuario->id)
            ->select(
                'solicitudes_amistad.id as solicitud_id',
                'users.id as usuario_id',
                'users.name',
                'users.nombre_personaje',
                'users.avatar'
            )
            ->orderByDesc('solicitudes_amistad.id')
            ->get();

        return response()->json(['solicitudes' => $solicitudes]);
    }

    // Acepta una solicitud recibida: crea la amistad (en ambos sentidos) y
    // borra la solicitud.
    public function aceptarSolicitud(Request $request, int $id)
    {
        $usuario = $request->user();

        $solicitud = DB::table('solicitudes_amistad')
            ->where('id', $id)
            ->where('para_usuario_id', $usuario->id)
            ->first();

        if (!$solicitud) {
            return response()->json(['message' => 'Esa solicitud ya no existe.'], 404);
        }

        DB::table('amistades')->insertOrIgnore([
            [
                'usuario_id' => $usuario->id,
                'amigo_id' => $solicitud->de_usuario_id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'usuario_id' => $solicitud->de_usuario_id,
                'amigo_id' => $usuario->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        DB::table('solicitudes_amistad')->where('id', $id)->delete();

        return response()->json(['mensaje' => 'Ahora son amigos.']);
    }

    // Rechaza (borra) una solicitud recibida.
    public function rechazarSolicitud(Request $request, int $id)
    {
        $usuario = $request->user();

        DB::table('solicitudes_amistad')
            ->where('id', $id)
            ->where('para_usuario_id', $usuario->id)
            ->delete();

        return response()->json(['mensaje' => 'Solicitud rechazada.']);
    }

    // Cancela una solicitud que tu mismo enviaste (antes de que la respondan).
    public function cancelarSolicitud(Request $request, int $id)
    {
        $usuario = $request->user();

        DB::table('solicitudes_amistad')
            ->where('id', $id)
            ->where('de_usuario_id', $usuario->id)
            ->delete();

        return response()->json(['mensaje' => 'Solicitud cancelada.']);
    }

    // Quita a alguien de la lista de amigos (en ambos sentidos).
    public function quitar(Request $request, int $amigoId)
    {
        $usuario = $request->user();

        DB::table('amistades')
            ->where(function ($query) use ($usuario, $amigoId) {
                $query->where('usuario_id', $usuario->id)->where('amigo_id', $amigoId);
            })
            ->orWhere(function ($query) use ($usuario, $amigoId) {
                $query->where('usuario_id', $amigoId)->where('amigo_id', $usuario->id);
            })
            ->delete();

        return response()->json(['mensaje' => 'Amigo eliminado.']);
    }

    // Bloquea a otra persona: deja de ser su amigo (si lo era), se borra
    // cualquier solicitud pendiente entre ambos, y esa persona ya no podra
    // aparecer en las busquedas ni volver a enviar una solicitud.
    public function bloquear(Request $request, int $id)
    {
        $usuario = $request->user();

        if ($id === $usuario->id) {
            return response()->json(['message' => 'No puedes bloquearte a ti mismo.'], 422);
        }

        $eranAmigos = DB::table('amistades')
            ->where('usuario_id', $usuario->id)
            ->where('amigo_id', $id)
            ->exists();

        DB::table('amistades')
            ->where(function ($query) use ($usuario, $id) {
                $query->where('usuario_id', $usuario->id)->where('amigo_id', $id);
            })
            ->orWhere(function ($query) use ($usuario, $id) {
                $query->where('usuario_id', $id)->where('amigo_id', $usuario->id);
            })
            ->delete();

        DB::table('solicitudes_amistad')
            ->where(function ($query) use ($usuario, $id) {
                $query->where('de_usuario_id', $usuario->id)->where('para_usuario_id', $id);
            })
            ->orWhere(function ($query) use ($usuario, $id) {
                $query->where('de_usuario_id', $id)->where('para_usuario_id', $usuario->id);
            })
            ->delete();

        DB::table('bloqueados')->insertOrIgnore([
            'usuario_id' => $usuario->id,
            'bloqueado_id' => $id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Aviso discreto para la persona bloqueada: no se dice quien la
        // bloqueo, solo que ya no son amigos (si es que lo eran).
        if ($eranAmigos) {
            DB::table('avisos')->insert([
                'usuario_id' => $id,
                'mensaje' => 'Ya no eres amigo de esa persona.',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['mensaje' => 'Usuario bloqueado.']);
    }

    // Lista a las personas que el usuario actual ha bloqueado.
    public function misBloqueados(Request $request)
    {
        $usuario = $request->user();

        $idsBloqueados = DB::table('bloqueados')
            ->where('usuario_id', $usuario->id)
            ->pluck('bloqueado_id');

        $bloqueados = User::whereIn('id', $idsBloqueados)
            ->select('id', 'name', 'email', 'avatar', 'nombre_personaje')
            ->get();

        return response()->json(['bloqueados' => $bloqueados]);
    }

    // Desbloquea a alguien que el usuario actual bloqueo antes. No restaura
    // la amistad automaticamente: si quieren volver a ser amigos, deben
    // enviarse una solicitud de nuevo.
    public function desbloquear(Request $request, int $id)
    {
        $usuario = $request->user();

        DB::table('bloqueados')
            ->where('usuario_id', $usuario->id)
            ->where('bloqueado_id', $id)
            ->delete();

        return response()->json(['mensaje' => 'Usuario desbloqueado.']);
    }

    // Lista a los amigos del usuario actual, ordenados por puntos (para el
    // ranking privado del Home).
    public function listar(Request $request)
    {
        $usuario = $request->user();

        $idsAmigos = DB::table('amistades')
            ->where('usuario_id', $usuario->id)
            ->pluck('amigo_id');

        $amigos = User::whereIn('id', $idsAmigos)
            ->orderByDesc('puntos')
            ->select('id', 'name', 'email', 'avatar', 'tono_piel', 'nombre_personaje', 'puntos')
            ->get();

        return response()->json(['amigos' => $amigos]);
    }
}
