<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Una solicitud pendiente de "de_usuario_id" hacia "para_usuario_id".
        // Cuando se acepta, se borra de aqui y se crea la amistad de verdad
        // (en la tabla amistades); si se rechaza, simplemente se borra.
        Schema::create('solicitudes_amistad', function (Blueprint $table) {
            $table->id();
            $table->foreignId('de_usuario_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('para_usuario_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['de_usuario_id', 'para_usuario_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitudes_amistad');
    }
};
