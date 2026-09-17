<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar')->nullable()->after('password');
            $table->string('peinado')->nullable()->after('avatar');
            $table->string('tono_piel')->nullable()->after('peinado');
            $table->string('ropa')->nullable()->after('tono_piel');
            $table->string('nombre_personaje')->nullable()->after('ropa');
            $table->boolean('personaje_completo')->default(false)->after('nombre_personaje');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'avatar',
                'peinado',
                'tono_piel',
                'ropa',
                'nombre_personaje',
                'personaje_completo',
            ]);
        });
    }
};
