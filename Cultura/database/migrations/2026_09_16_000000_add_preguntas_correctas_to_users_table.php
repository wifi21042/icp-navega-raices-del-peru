<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Cuenta cuantas preguntas ha respondido bien en los quices de los
    // retos especiales, sumando entre todos los quices que juegue (no se
    // resetea). Sirve para los logros "Primer Saber" y "Curioso", que antes
    // no se podian medir de verdad.
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('preguntas_correctas')->default(0)->after('retos_completados');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('preguntas_correctas');
        });
    }
};
