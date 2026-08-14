/**
 * Registrerar service workern som gör spelet spelbart offline när det väl
 * laddats en gång. Körs bara i produktion, och bara över https eller
 * localhost, eftersom service workers kräver säkert sammanhang.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    // Relativ sökväg, så att registreringen fungerar även i en undermapp.
    const url = new URL('sw.js', document.baseURI);
    navigator.serviceWorker.register(url.href).catch(() => {
      // Offline-stöd är en bonus. Misslyckas det spelar spelet ändå.
    });
  });
}
