<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cada amistad se guarda "de ida", es decir una fila por cada
        // direccion (si Ana agrega a Luis, se crean dos filas: Ana->Luis y
        // Luis->Ana). Asi cualquiera de los dos ve al otro en su lista de
        // amigos sin necesitar que el otro "acepte" la solicitud.
        Schema::create('amistades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('amigo_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['usuario_id', 'amigo_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('amistades');
    }
};
