<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use App\Notifications\RestablecerPasswordNotificacion;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'peinado',
        'tono_piel',
        'ropa',
        'nombre_personaje',
        'personaje_completo',
        'puntos',
        'accesorios',
        'retos_completados',
        'preguntas_correctas',
        'jugo_madrugada',
        'racha_dias',
        'ultima_actividad_racha',
        'minijuegos_progreso',
        'google_id',
        'google_email',
        'password_usable',
        'email_verification_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'personaje_completo' => 'boolean',
            'password_usable' => 'boolean',
            'jugo_madrugada' => 'boolean',
            'accesorios' => 'array',
            'retos_completados' => 'array',
            'minijuegos_progreso' => 'array',
        ];
    }

    // Reemplaza el correo de "olvide mi contrasena" que Laravel manda por
    // defecto (Illuminate\Auth\Notifications\ResetPassword) por el nuestro,
    // que sabe elegir entre mail normal (SMTP) o la API de Brevo segun
    // donde este corriendo. Esto es lo que usa Password::sendResetLink().
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new RestablecerPasswordNotificacion($token));
    }
}
