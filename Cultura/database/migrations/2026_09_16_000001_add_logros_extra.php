<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Se pone en true la primera vez que el usuario completa un
            // reto, un quiz de reto especial o mejora su puntaje en un
            // minijuego entre las 00:00 y las 04:00 (hora del servidor).
            // Alimenta el logro "El Guardian Nocturno".
            $table->boolean('jugo_madrugada')->default(false)->after('preguntas_correctas');
        });

        // Guarda, para cada usuario, la fecha real en la que desbloqueo
        // cada logro (la primera vez que se detecto que ya lo cumplia).
        // Asi la pantalla de "Mis logros" puede mostrar "Desbloqueado el
        // <fecha>" con un dato real, no inventado. Los logros que un
        // usuario ya cumplia ANTES de que existiera esta tabla van a
        // quedar con la fecha en la que se detectaron por primera vez
        // (la primera vez que entro a Recompensas despues de esta
        // actualizacion), no con la fecha en que de verdad los gano.
        Schema::create('logros_desbloqueados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('logro_id');
            $table->timestamp('desbloqueado_en');
            $table->unique(['user_id', 'logro_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('logros_desbloqueados');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('jugo_madrugada');
        });
    }
};
