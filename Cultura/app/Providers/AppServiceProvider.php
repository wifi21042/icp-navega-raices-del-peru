<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
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
        // El correo de "olvide mi contrasena" tiene que llevar a una pagina
        // de Angular (no a una vista de Laravel), asi que armamos el enlace
        // a mano apuntando al frontend, y de paso le damos el diseño y el
        // texto en español acorde al proyecto (en vez del correo generico
        // en ingles que trae Laravel por defecto).
        ResetPassword::toMailUsing(function ($user, string $token) {
            $urlFrontend = rtrim(env('FRONTEND_URL', 'http://localhost:4200'), '/');
            $url = $urlFrontend.'/restablecer-password?token='.$token.'&email='.urlencode($user->email);

            $nombre = $user->nombre_personaje ?? $user->name ?? '';

            return (new MailMessage())
                ->subject('Restablece tu contrasena - ICP')
                ->greeting('¡Hola'.($nombre ? ', '.$nombre : '').'!')
                ->line('Recibimos una solicitud para restablecer la contrasena de tu cuenta en ICP - Navega por las Raices del Peru.')
                ->action('Restablecer contrasena', $url)
                ->line('Este enlace vence en 60 minutos.')
                ->line('Si tu no pediste este cambio, no tienes que hacer nada: tu contrasena sigue igual.')
                ->salutation('Nos vemos en la aventura,'."\n".'El equipo de ICP')
                ->level('success');
        });
    }
}
