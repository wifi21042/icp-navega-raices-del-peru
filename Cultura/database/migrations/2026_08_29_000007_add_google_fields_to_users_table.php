<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Agrega los campos para poder vincular una cuenta de Google a una
    // cuenta que ya existe (sin importar si se registro con Google o con
    // correo y contrasena), y para saber si el usuario tiene una contrasena
    // de verdad (que el mismo eligio) o no (por ejemplo, si se creo la
    // cuenta solo con Google y nunca puso una).
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_id')->nullable()->unique()->after('email_verification_token');
            $table->string('google_email')->nullable()->after('google_id');
            $table->boolean('password_usable')->default(true)->after('google_email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google_id', 'google_email', 'password_usable']);
        });
    }
};
