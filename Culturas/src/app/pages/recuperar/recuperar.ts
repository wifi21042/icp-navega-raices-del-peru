import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';

@Component({
  imports: [RouterLink],
  selector: 'app-recuperar',
  styleUrl: './recuperar.scss',
  templateUrl: './recuperar.html',
})
export class Recuperar {
  email = signal('');
  enviando = signal(false);
  enviado = signal(false);
  error = signal('');

  constructor(public auth: Auth) {}

  onEmailChange(valor: string) {
    this.email.set(valor);
  }

  enviar() {
    this.error.set('');

    if (!this.email().trim()) {
      this.error.set('Escribe tu correo.');
      return;
    }

    this.enviando.set(true);
    this.auth.olvidePassword(this.email().trim()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.enviado.set(true);
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo conectar con el servidor.');
      },
    });
  }
}
