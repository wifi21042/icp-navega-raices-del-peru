<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // El correo de "olvide mi contrasena" ya no se arma aqui: ahora
        // vive en App\Notifications\RestablecerPasswordNotificacion (que
        // User::sendPasswordResetNotification() usa en vez del correo por
        // defecto de Laravel), asi que puede elegir entre mail normal o la
        // API de Brevo igual que el correo de confirmar cuenta.
    }
}
