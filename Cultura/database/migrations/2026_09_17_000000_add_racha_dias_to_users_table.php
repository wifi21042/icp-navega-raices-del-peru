<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Cuantos dias SEGUIDOS jugo (completo un reto, un quiz o
            // mejoro un minijuego). Si un dia no hace nada de eso, la
            // racha se reinicia a 1 la proxima vez que juegue. Alimenta
            // los logros "En Racha", "Semana Completa" y "El Vuelo del
            // Condor".
            $table->unsignedInteger('racha_dias')->default(0)->after('jugo_madrugada');

            // El ultimo dia (solo la fecha, sin hora) en el que hizo algo
            // que cuenta para la racha. Se usa para saber si "hoy" es
            // continuacion de "ayer" (suma racha), el mismo dia de nuevo
            // (no cambia nada) o si paso mas de un dia (se reinicia).
            $table->date('ultima_actividad_racha')->nullable()->after('racha_dias');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['racha_dias', 'ultima_actividad_racha']);
        });
    }
};
