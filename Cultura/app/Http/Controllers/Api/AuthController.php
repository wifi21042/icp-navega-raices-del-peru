<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\ConfirmarCuenta;
use App\Rules\NombreApropiado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    // Registrar un usuario nuevo. Todavia no puede iniciar sesion: primero
    // tiene que confirmar su correo (le llega un enlace), y ahi recien crea
    // su contrasena, igual que las cuentas que entran por primera vez con
    // Google.
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255', new NombreApropiado()],
            'email' => ['required', 'string', 'email', 'unique:users,email'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $token = Str::random(64);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            // Nunca va a usar esta contrasena para entrar (todavia no ha
            // creado la suya), asi que ponemos una al azar.
            'password' => Hash::make(Str::random(40)),
            'email_verified_at' => null,
            'email_verification_token' => $token,
            'password_usable' => false,
        ]);

        $user->notify(new ConfirmarCuenta($token));

        return response()->json([
            'mensaje' => 'Te enviamos un correo para confirmar tu cuenta.',
        ], 201);
    }

    // Iniciar sesion con correo y contrasena.
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Correo o contrasena incorrectos'], 401);
        }

        $token = $user->createToken('token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    // Iniciar sesion (o crear la cuenta, si es la primera vez) con Google.
    // El frontend manda el "credential" (un token) que le da el boton de
    // Google, y aca lo verificamos contra los servidores de Google antes de
    // confiar en el correo que dice traer.
    public function loginConGoogle(Request $request)
    {
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
            return response()->json(['message' => 'Tu cuenta de Google no tiene el correo verificado.'], 401);
        }

        $googleId = $datos['sub'];
        $email = $datos['email'];
        $nombre = $datos['name'] ?? explode('@', $email)[0];

        // Primero buscamos por google_id (es lo mas confiable: no cambia
        // aunque la persona despues cambie el correo de su cuenta de
        // Google). Si no encontramos nada, probamos por correo: esto es
        // para las cuentas que ya existian antes de tener este campo, o
        // para alguien que se registro a mano con este mismo correo (Google
        // ya nos confirma que el correo es suyo de verdad).
        $user = User::where('google_id', $googleId)->first();

        if (! $user) {
            $user = User::where('email', $email)->first();
        }

        if (! $user) {
            $user = User::create([
                'name' => $nombre,
                'email' => $email,
                // Nunca va a usar esta contrasena para entrar (siempre entra
                // con Google, a menos que despues cree una desde Mi Cuenta),
                // asi que ponemos una al azar.
                'password' => Hash::make(Str::random(40)),
                'email_verified_at' => now(),
                'google_id' => $googleId,
                'google_email' => $email,
                'password_usable' => false,
            ]);
        } else {
            $user->google_id = $googleId;
            $user->google_email = $email;
            if (! $user->email_verified_at) {
                $user->email_verified_at = now();
            }
            $user->save();
        }

        $token = $user->createToken('token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token]);
    }

    // Cerrar sesion
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesion cerrada']);
    }

    // Ver quien soy (usuario logueado)
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // Confirma el correo usando el token que viene en el enlace del email.
    public function verificarCorreo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email_verification_token', $request->token)->first();

        if (! $user) {
            return response()->json([
                'message' => 'El enlace de confirmacion no es valido o ya fue usado.',
            ], 404);
        }

        $user->email_verified_at = now();
        $user->email_verification_token = null;
        $user->save();

        // La dejamos con la sesion abierta de una vez (no tiene sentido
        // pedirle que ademas inicie sesion a mano justo despues de
        // confirmar), asi puede seguir directo a crear su contrasena.
        $token = $user->createToken('token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token]);
    }

    // Pide el enlace para restablecer la contrasena (llega por correo).
    public function olvidePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // No decimos si el correo existe o no (por seguridad, para que no se
        // pueda usar esto para averiguar que correos estan registrados).
        Password::sendResetLink($request->only('email'));

        return response()->json([
            'mensaje' => 'Si el correo esta registrado, te enviamos un enlace para restablecer tu contrasena.',
        ]);
    }

    // Cambia la contrasena usando el token que llego por correo.
    public function restablecerPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', 'min:6'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'El enlace no es valido o ya expiro. Pide uno nuevo.',
            ], 422);
        }

        return response()->json(['mensaje' => 'Tu contrasena fue actualizada. Ya puedes iniciar sesion.']);
    }
}
