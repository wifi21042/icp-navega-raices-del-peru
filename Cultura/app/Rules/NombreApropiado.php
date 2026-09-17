<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

// Regla para el nombre de usuario y el nombre del personaje: solo letras
// (nada de numeros, puntos ni arrobas) y que no tenga palabras ofensivas.
class NombreApropiado implements ValidationRule
{
    // Lista basica de groserias/insultos comunes en español. No es
    // exhaustiva, pero cubre los casos mas comunes.
    private array $palabrasProhibidas = [
        'puta', 'puto', 'putona', 'putazo', 'putisima',
        'mierda', 'mierd',
        'pendejo', 'pendeja',
        'verga',
        'cabron', 'cabrona', 'cabrones',
        'imbecil',
        'idiota',
        'estupido', 'estupida',
        'gilipollas',
        'maricon', 'marica',
        'zorra',
        'perra',
        'culero', 'culera', 'culiao', 'culia',
        'hijueputa', 'hdp', 'hijodeputa',
        'malparido', 'malparida',
        'joder',
        'chinga', 'chingada', 'chingado', 'chingar', 'chingatumadre',
        'coño',
        'polla',
        'concha',
        'boludo', 'pelotudo',
        'nazi', 'hitler',
        'violador', 'violacion',
        'puñeta',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            $fail('El nombre no es valido.');

            return;
        }

        // Solo letras (con tildes y ñ) y espacios: nada de numeros, puntos,
        // arrobas ni otros simbolos.
        if (! preg_match('/^[\p{L}\s]+$/u', $value)) {
            $fail('El nombre solo puede tener letras: nada de numeros, puntos ni arrobas.');

            return;
        }

        $normalizado = $this->quitarTildes(mb_strtolower($value));

        foreach ($this->palabrasProhibidas as $palabra) {
            if (str_contains($normalizado, $palabra)) {
                $fail('Ese nombre no esta permitido. Elige uno mas respetuoso.');

                return;
            }
        }
    }

    private function quitarTildes(string $texto): string
    {
        $conTilde = ['á', 'é', 'í', 'ó', 'ú', 'à', 'è', 'ì', 'ò', 'ù', 'ä', 'ë', 'ï', 'ö', 'ü'];
        $sinTilde = ['a', 'e', 'i', 'o', 'u', 'a', 'e', 'i', 'o', 'u', 'a', 'e', 'i', 'o', 'u'];

        return str_replace($conTilde, $sinTilde, $texto);
    }
}
