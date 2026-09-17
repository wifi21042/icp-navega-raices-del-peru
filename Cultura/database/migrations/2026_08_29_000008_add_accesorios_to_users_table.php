<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Guarda la lista de accesorios que el usuario eligio para su personaje
    // (instrumentos, animales, objetos especiales), como un JSON con los
    // ids de cada uno. Ejemplo: ["quena","loro","collar"].
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('accesorios')->nullable()->after('nombre_personaje');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('accesorios');
        });
    }
};
