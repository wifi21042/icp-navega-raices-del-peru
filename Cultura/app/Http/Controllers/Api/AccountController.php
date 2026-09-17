<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\NombreApropiado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AccountController extends Controller
{
    // Actualiza el nombre y el correo de la cuenta.
    public function actualizar(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:100', new NombreApropiado()],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        return response()->json(['user' => $user]);
    }

    // Cambia la contrasena, verificando primero la actual. Si la cuenta
    // nunca tuvo una contrasena de verdad (por ejemplo, se creo solo con
    // Google), esto sirve para crear la primera: no le pedimos la "actual"
    // porque no existe ninguna que la persona conozca.
    public function actualizarPassword(Request $request)
    {
        $user = $request->user();
        $tieneQueConfirmarActual = (bool) $user->password_usable;

        $reglas = [
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ];

        if ($tieneQueConfirmarActual) {
            $reglas['password_actual'] = ['required', 'string'];
        }

        $validator = Validator::make($request->all(), $reglas);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($tieneQueConfirmarActual && !Hash::check($request->password_actual, $user->password)) {
            return response()->json([
                'errors' => ['password_actual' => ['La contrasena actual no es correcta.']],
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'password_usable' => true,
        ]);

        return response()->json([
            'mensaje' => $tieneQueConfirmarActual
                ? 'Contrasena actualizada correctamente.'
                : 'Listo, ya tienes una contrasena para tu cuenta.',
            'user' => $user,
        ]);
    }

    // Vincula (o cambia) la cuenta de Google asociada a la cuenta actual.
    // El frontend manda el "credential" del boton de Google, y lo
    // verificamos contra los servidores de Google antes de confiar en el
    // correo que dice traer.
    public function vincularGoogle(Request $request)
    {
        $usuario = $request->user();

        $validator = Validator::make($request->all(), [
            'credential' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $respuesta = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $request->credential,
        ]);

        if (! $respuesta->ok()) {
            return response()->json(['message' => 'No se pudo verificar tu cuenta de Google.'], 401);
        }

        $datos = $respuesta->json();
        $clienteEsperado = env('GOOGLE_CLIENT_ID');

        if ($clienteEsperado && ($datos['aud'] ?? null) !== $clienteEsperado) {
            return response()->json(['message' => 'Este inicio de sesion con Google no es valido.'], 401);
        }

        $correoVerificado = ($datos['email_verified'] ?? false) === true || ($datos['email_verified'] ?? '') === 'true';

        if (empty($datos['sub']) || empty($datos['email']) || ! $correoVerificado) {
            return response()->json(['message' => 'Esa cuenta de Google no tiene el correo verificado.'], 401);
        }

        $googleId = $datos['sub'];

        $otroUsuario = User::where('google_id', $googleId)->where('id', '!=', $usuario->id)->first();

        if ($otroUsuario) {
            return response()->json([
                'message' => 'Esa cuenta de Google ya esta vinculada a otro usuario de ICP.',
            ], 422);
        }

        $usuario->google_id = $googleId;
        $usuario->google_email = $datos['email'];
        $usuario->save();

        return response()->json(['user' => $usuario]);
    }

    // Quita la cuenta de Google vinculada. No se permite si la cuenta no
    // tiene una contrasena de verdad (se quedaria sin forma de entrar).
    public function desvincularGoogle(Request $request)
    {
        $usuario = $request->user();

        if (! $usuario->password_usable) {
            return response()->json([
                'message' => 'Primero crea una contrasena para tu cuenta (en la tarjeta de aqui abajo) antes de desvincular Google, o te quedarias sin forma de entrar.',
            ], 422);
        }

        $usuario->google_id = null;
        $usuario->google_email = null;
        $usuario->save();

        return response()->json(['user' => $usuario]);
    }

    // Elimina la cuenta para siempre, pidiendo la contrasena como
    // confirmacion. Borramos a mano todo lo relacionado (amistades,
    // solicitudes, bloqueos, avisos, tokens) en vez de confiar solo en el
    // borrado en cascada de la base de datos. Una vez borrada la cuenta, el
    // correo y el nombre quedan libres para volver a registrarse.
    public function eliminar(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'errors' => ['password' => ['La contrasena no es correcta.']],
            ], 422);
        }

        $userId = $user->id;

        DB::table('amistades')
            ->where('usuario_id', $userId)
            ->orWhere('amigo_id', $userId)
            ->delete();

        DB::table('solicitudes_amistad')
            ->where('de_usuario_id', $userId)
            ->orWhere('para_usuario_id', $userId)
            ->delete();

        DB::table('bloqueados')
            ->where('usuario_id', $userId)
            ->orWhere('bloqueado_id', $userId)
            ->delete();

        DB::table('avisos')->where('usuario_id', $userId)->delete();

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['mensaje' => 'Cuenta eliminada correctamente.']);
    }
}
