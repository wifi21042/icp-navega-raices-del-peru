<?php

namespace App\Notifications;

use App\Notifications\Channels\BrevoChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

// Correo de "olvide mi contrasena". Reemplaza al ResetPassword que trae
// Laravel por defecto (ver App\Models\User::sendPasswordResetNotification)
// para poder elegir el canal (mail o Brevo) igual que ConfirmarCuenta, y
// para que el enlace lleve a la pagina de Angular en vez de a una vista de
// Laravel que no existe en esta app (que es solo API).
class RestablecerPasswordNotificacion extends Notification
{
    use Queueable;

    public function __construct(private string $token)
    {
    }

    public function via(object $notifiable): array
    {
        return config('services.brevo.key') ? [BrevoChannel::class] : ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $urlFrontend = rtrim(env('FRONTEND_URL', 'http://localhost:4200'), '/');
        $url = $urlFrontend.'/restablecer-password?token='.$this->token.'&email='.urlencode($notifiable->email);

        $nombre = $notifiable->nombre_personaje ?? $notifiable->name ?? '';

        return (new MailMessage())
            ->subject('Restablece tu contrasena - ICP')
            ->greeting('¡Hola'.($nombre ? ', '.$nombre : '').'!')
            ->line('Recibimos una solicitud para restablecer la contrasena de tu cuenta en ICP - Navega por las Raices del Peru.')
            ->action('Restablecer contrasena', $url)
            ->line('Este enlace vence en 60 minutos.')
            ->line('Si tu no pediste este cambio, no tienes que hacer nada: tu contrasena sigue igual.')
            ->salutation('Nos vemos en la aventura,'."\n".'El equipo de ICP')
            ->level('success');
    }
}
