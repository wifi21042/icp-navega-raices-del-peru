<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Sin esto, cuando una peticion a /api/* llega sin token o con uno
        // vencido, Laravel intenta redirigir a una ruta "login" que no
        // existe en esta API (no hay paginas de login por aca, todo es
        // JSON), y eso revienta con un error 500 feo en vez de un 401
        // limpio. Con esto, cualquier ruta que empiece con "api/" siempre
        // recibe una respuesta JSON prolija.
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'No has iniciado sesion o tu sesion vencio.'], 401);
            }
        });
    })->create();
