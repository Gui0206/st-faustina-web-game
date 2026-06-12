/* Boot. */

Save.read();
I18N.detect();
UI.init();
R.initGrain();
Engine.init();

/* menu button appears with pointer activity */
let _menuBtnT = null;
window.addEventListener('pointermove', () => {
  UI.showMenuBtn(true);
  clearTimeout(_menuBtnT);
  _menuBtnT = setTimeout(() => { if (!Menu.open) UI.showMenuBtn(false); }, 3200);
});

/* keep audio honest across tab switches */
document.addEventListener('visibilitychange', () => {
  if (!AC) return;
  if (document.hidden) AC.suspend();
  else AC.resume();
});

Engine.go('title', { instant: true, noCard: true });
