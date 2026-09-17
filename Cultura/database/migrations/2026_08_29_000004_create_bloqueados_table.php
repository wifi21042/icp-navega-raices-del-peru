<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Si "usuario_id" bloquea a "bloqueado_id", este ultimo ya no puede
        // aparecer en sus busquedas ni enviarle solicitudes de amistad.
        Schema::create('bloqueados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('bloqueado_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['usuario_id', 'bloqueado_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bloqueados');
    }
};
