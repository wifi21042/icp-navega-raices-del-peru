<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AmigoController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AvisoController;
use App\Http\Controllers\Api\LogroController;
use App\Http\Controllers\Api\MinijuegoController;
use App\Http\Controllers\Api\PersonajeController;
use App\Http\Controllers\Api\RetoController;
use Illuminate\Support\Facades\Route;

// Rutas publicas (cualquiera las puede llamar)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/auth/google', [AuthController::class, 'loginConGoogle']);
Route::post('/email/verificar', [AuthController::class, 'verificarCorreo']);
Route::post('/forgot-password', [AuthController::class, 'olvidePassword']);
Route::post('/reset-password', [AuthController::class, 'restablecerPassword']);

// Rutas protegidas (solo si mandas el token de un usuario ya logueado)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/personaje', [PersonajeController::class, 'guardar']);
    Route::put('/personaje/accesorios', [PersonajeController::class, 'guardarAccesorios']);
    Route::put('/cuenta', [AccountController::class, 'actualizar']);
    Route::put('/cuenta/password', [AccountController::class, 'actualizarPassword']);
    Route::post('/cuenta/google', [AccountController::class, 'vincularGoogle']);
    Route::delete('/cuenta/google', [AccountController::class, 'desvincularGoogle']);
    Route::delete('/cuenta', [AccountController::class, 'eliminar']);

    Route::get('/amigos', [AmigoController::class, 'listar']);
    Route::get('/amigos/buscar', [AmigoController::class, 'buscar']);
    Route::get('/amigos/bloqueados', [AmigoController::class, 'misBloqueados']);
    Route::delete('/amigos/{amigoId}', [AmigoController::class, 'quitar']);
    Route::post('/amigos/{id}/bloquear', [AmigoController::class, 'bloquear']);
    Route::post('/amigos/{id}/desbloquear', [AmigoController::class, 'desbloquear']);

    Route::post('/amigos/solicitudes', [AmigoController::class, 'enviarSolicitud']);
    Route::get('/amigos/solicitudes/recibidas', [AmigoController::class, 'solicitudesRecibidas']);
    Route::get('/amigos/solicitudes/enviadas', [AmigoController::class, 'solicitudesEnviadas']);
    Route::post('/amigos/solicitudes/{id}/aceptar', [AmigoController::class, 'aceptarSolicitud']);
    Route::post('/amigos/solicitudes/{id}/rechazar', [AmigoController::class, 'rechazarSolicitud']);
    Route::delete('/amigos/solicitudes/{id}', [AmigoController::class, 'cancelarSolicitud']);

    Route::get('/avisos', [AvisoController::class, 'index']);

    Route::get('/logros', [LogroController::class, 'index']);

    Route::get('/retos', [RetoController::class, 'index']);
    Route::post('/retos/{id}/completar', [RetoController::class, 'completar']);
    Route::get('/retos/{id}/quiz', [RetoController::class, 'quiz']);
    Route::post('/retos/{id}/quiz/completar', [RetoController::class, 'completarQuiz']);

    Route::get('/minijuegos', [MinijuegoController::class, 'index']);
    Route::get('/minijuegos/{id}/rondas', [MinijuegoController::class, 'rondas']);
    Route::get('/minijuegos/{id}/rondas/{ronda}', [MinijuegoController::class, 'mostrar']);
    Route::post('/minijuegos/{id}/rondas/{ronda}/completar', [MinijuegoController::class, 'completar']);
});
