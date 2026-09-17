// Ayuda para mostrar el boton "Iniciar sesion con Google" (libreria de
// Google cargada en index.html) en Login y Registro. La libreria se carga
// con "defer", asi que a veces tarda un poquito en estar lista: por eso
// esperamos (reintentando) a que exista "window.google" antes de usarla.

declare const google: any;

const INTENTOS_MAXIMOS = 30;
const ESPERA_ENTRE_INTENTOS_MS = 100;

export function mostrarBotonGoogle(
  idElemento: string,
  clientId: string,
  alRecibirCredencial: (credential: string) => void,
  intento = 0
): void {
  const elemento = document.getElementById(idElemento);

  if (typeof google === 'undefined' || !elemento) {
    if (intento < INTENTOS_MAXIMOS) {
      setTimeout(
        () => mostrarBotonGoogle(idElemento, clientId, alRecibirCredencial, intento + 1),
        ESPERA_ENTRE_INTENTOS_MS
      );
    }
    return;
  }

  google.accounts.id.initialize({
    client_id: clientId,
    callback: (respuesta: { credential: string }) => alRecibirCredencial(respuesta.credential),
  });

  google.accounts.id.renderButton(elemento, {
    theme: 'outline',
    size: 'large',
    width: 320,
    text: 'continue_with',
    locale: 'es',
  });
}
