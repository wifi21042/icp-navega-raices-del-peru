<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

// Render (donde vive el backend en produccion) bloquea las conexiones
// salientes por los puertos de SMTP (25, 465, 587) en el plan gratis, asi
// que mandar correos por Gmail/SMTP desde ahi nunca va a funcionar, sin
// importar que tan bien esten puestas las credenciales. La solucion es
// mandar los correos por una API HTTP normal (puerto 443, que si esta
// permitido) en vez de SMTP. Usamos Brevo (brevo.com) porque su plan
// gratis deja mandar a cualquier destinatario apenas verificas un solo
// correo remitente (no hace falta tener un dominio propio).
class BrevoMailer
{
    public static function enviar(string $paraEmail, string $paraNombre, string $asunto, string $html): bool
    {
        $apiKey = config('services.brevo.key');

        if (! $apiKey) {
            Log::warning('BrevoMailer: no hay BREVO_API_KEY configurada, no se mando el correo.', [
                'para' => $paraEmail,
            ]);

            return false;
        }

        $respuesta = Http::withHeaders([
            'api-key' => $apiKey,
            'content-type' => 'application/json',
            'accept' => 'application/json',
        ])->post('https://api.brevo.com/v3/smtp/email', [
            'sender' => [
                'email' => config('mail.from.address'),
                'name' => config('mail.from.name'),
            ],
            'to' => [
                ['email' => $paraEmail, 'name' => $paraNombre ?: $paraEmail],
            ],
            'subject' => $asunto,
            'htmlContent' => $html,
        ]);

        if ($respuesta->failed()) {
            Log::error('BrevoMailer: Brevo respondio con error al mandar un correo.', [
                'para' => $paraEmail,
                'status' => $respuesta->status(),
                'cuerpo' => $respuesta->body(),
            ]);

            return false;
        }

        return true;
    }
}
