<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Guarda que retos ya completo el usuario, como un JSON con los ids
    // (ejemplo: ["machu_picchu","incas"]). Cada reto completado suma
    // puntos a la cuenta (columna "puntos", que ya existia), y esos puntos
    // son los que van desbloqueando los accesorios.
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('retos_completados')->nullable()->after('accesorios');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('retos_completados');
        });
    }
};
