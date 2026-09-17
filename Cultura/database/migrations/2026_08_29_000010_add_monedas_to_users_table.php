<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Moneda nueva y separada de "puntos": los puntos sirven para el nivel
    // y para desbloquear accesorios (vienen de los Retos); las monedas se
    // ganan jugando los minijuegos y van a servir para comprar cosas en la
    // tienda (eso se hace mas adelante). "minijuegos_progreso" guarda,
    // para cada minijuego, las mejores estrellas que ya consiguio el
    // usuario, para no darle premio de nuevo si repite el juego con un
    // resultado igual o peor.
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('monedas')->default(0)->after('puntos');
            $table->text('minijuegos_progreso')->nullable()->after('retos_completados');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['monedas', 'minijuegos_progreso']);
        });
    }
};
