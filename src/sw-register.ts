/**
 * Registrerar service workern som gör spelet spelbart offline när det väl
 * laddats en gång. Körs bara i produktion, och bara över https eller
 * localhost, eftersom service workers kräver säkert sammanhang.
 *
 * När en ny utgåva tagit över säger sidan till med händelsen
 * `upptackaren:nyversion`, så att spelet kan erbjuda en omladdning. Den som
 * har spelet på hemskärmen laddar sällan om av sig själv, och fick annars
 * rättningar och nya frågor först vid nästa kallstart, kanske dagar senare.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    // Fanns det en service worker redan är ett byte en ny utgåva. Fanns det
    // ingen är bytet den första installationen, och då finns inget att säga.
    const hadeRedan = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadeRedan) window.dispatchEvent(new Event('upptackaren:nyversion'));
    });
    // Relativ sökväg, så att registreringen fungerar även i en undermapp.
    const url = new URL('sw.js', document.baseURI);
    navigator.serviceWorker.register(url.href).catch(() => {
      // Offline-stöd är en bonus. Misslyckas det spelar spelet ändå.
    });
  });
}
