<?php

namespace App\Notifications;

use App\Notifications\Channels\BrevoChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

// Correo que llega justo despues de registrarse con nombre y correo (sin
// Google). Todavia no tiene una contrasena de verdad, asi que el enlace
// lleva a la pagina de "verificar correo", que confirma la cuenta y de ahi
// manda a crear la contrasena (la misma pantalla que ya usan las cuentas
// que entran por primera vez con Google).
class ConfirmarCuenta extends Notification
{
    use Queueable;

    public function __construct(private string $token)
    {
    }

    public function via(object $notifiable): array
    {
        // En Render (produccion) el puerto de SMTP esta bloqueado, asi que
        // ahi se manda por la API de Brevo. En local, si no hay
        // BREVO_API_KEY configurada, se sigue usando el mail normal (SMTP)
        // como antes.
        return config('services.brevo.key') ? [BrevoChannel::class] : ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $urlFrontend = rtrim(env('FRONTEND_URL', 'http://localhost:4200'), '/');
        $url = $urlFrontend.'/verificar-correo?token='.$this->token;

        return (new MailMessage())
            ->subject('Confirma tu cuenta - ICP')
            ->greeting('¡Hola'.($notifiable->name ? ', '.$notifiable->name : '').'!')
            ->line('Gracias por registrarte en ICP - Navega por las Raices del Peru.')
            ->line('Confirma tu cuenta para crear tu contrasena y empezar tu aventura.')
            ->action('Confirmar cuenta', $url)
            ->line('Si tu no creaste esta cuenta, puedes ignorar este correo.')
            ->salutation('Nos vemos en la aventura,'."\n".'El equipo de ICP')
            ->level('success');
    }
}
