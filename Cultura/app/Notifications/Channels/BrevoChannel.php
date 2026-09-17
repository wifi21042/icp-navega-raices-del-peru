<?php

namespace App\Notifications\Channels;

use App\Services\BrevoMailer;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

// Canal de notificacion "a medida" que reusa el mismo MailMessage que ya
// arma cada notificacion (asunto, saludo, lineas, boton, despedida) pero en
// vez de mandarlo por SMTP (bloqueado en Render), lo convierte a HTML
// simple y lo manda por la API de Brevo (ver App\Services\BrevoMailer).
class BrevoChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toMail')) {
            return;
        }

        $mensaje = $notification->toMail($notifiable);

        if (! $mensaje instanceof MailMessage) {
            return;
        }

        // routeNotificationFor('mail', ...) es el metodo "seguro" que ya
        // trae el trait Notifiable: si el modelo no define uno a medida,
        // el propio trait cae de vuelta a $notifiable->email solo.
        $paraEmail = method_exists($notifiable, 'routeNotificationFor')
            ? $notifiable->routeNotificationFor('mail', $notification)
            : ($notifiable->email ?? null);

        if (! $paraEmail) {
            return;
        }

        $paraNombre = $notifiable->nombre_personaje ?? $notifiable->name ?? '';

        BrevoMailer::enviar($paraEmail, $paraNombre, $mensaje->subject, $this->aHtml($mensaje));
    }

    private function aHtml(MailMessage $mensaje): string
    {
        $partes = [];

        if ($mensaje->greeting) {
            $partes[] = '<p style="font-size:18px;font-weight:bold;margin:0 0 16px;">'.e($mensaje->greeting).'</p>';
        }

        foreach ($mensaje->introLines as $linea) {
            $partes[] = '<p style="margin:0 0 14px;line-height:1.5;">'.nl2br(e($linea)).'</p>';
        }

        if ($mensaje->actionText && $mensaje->actionUrl) {
            $partes[] = '<p style="text-align:center;margin:26px 0;">'
                .'<a href="'.e($mensaje->actionUrl).'" '
                .'style="background:#2f6b3a;color:#ffffff;padding:12px 28px;border-radius:999px;'
                .'text-decoration:none;font-weight:bold;display:inline-block;">'
                .e($mensaje->actionText).'</a></p>';
        }

        foreach ($mensaje->outroLines as $linea) {
            $partes[] = '<p style="margin:0 0 14px;line-height:1.5;">'.nl2br(e($linea)).'</p>';
        }

        if ($mensaje->salutation) {
            $partes[] = '<p style="margin:20px 0 0;">'.nl2br(e($mensaje->salutation)).'</p>';
        }

        return '<div style="font-family: Arial, Helvetica, sans-serif; max-width:480px; margin:0 auto; color:#1a4d2e;">'
            .implode("\n", $partes)
            .'</div>';
    }
}
