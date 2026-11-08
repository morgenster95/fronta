// Převzetí vojáka: přihlášení Googlem → kód ENLIST-XXXX → hráč ho napíše jako komentář na IG → ingest spáruje.
// Firebase se načte až při kliknutí (nezatěžuje první načtení mapy). Konfigurace v web/src/firebase-config.js.
import { firebaseConfig } from './firebase-config.js';

const IN_APP = /Instagram|FBAN|FBAV|FB_IAB|Line\/|Twitter/i;

export async function startClaim(soldier, theme, toast) {
  if (!firebaseConfig.apiKey) {
    toast('Claiming opens soon. Your soldier is safe in the trench.');
    return;
  }
  // Google přihlášení v prohlížeči uvnitř Instagramu nefunguje (disallowed_useragent)
  if (IN_APP.test(navigator.userAgent)) {
    const url = `${location.origin}/?s=${encodeURIComponent(soldier.handle)}&claim=1`;
    navigator.clipboard?.writeText(url).catch(() => {});
    toast('Open this page in Safari or Chrome to sign in (tap ••• → Open in browser). Link copied.');
    return;
  }
  const { initializeApp } = await import('firebase/app');
  const { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } = await import('firebase/auth');
  const { getFirestore, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  let user = auth.currentUser;
  if (!user) {
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    try {
      // v PWA na ploše iPhonu popup nejde → redirect (authDomain musí být doména, na které web běží!)
      if (standalone) {
        await signInWithRedirect(auth, provider);
        return;
      }
      user = (await signInWithPopup(auth, provider)).user;
    } catch (e) {
      const r = await getRedirectResult(auth).catch(() => null);
      user = r?.user;
      if (!user) {
        toast('Sign-in failed. Try again.');
        return;
      }
    }
  }
  const code = `ENLIST-${randomCode()}`;
  await setDoc(doc(getFirestore(app), 'claims', user.uid), {
    handle: soldier.handle,
    code,
    uid: user.uid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  showCode(code, theme, toast);
}

function randomCode() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const a = crypto.getRandomValues(new Uint8Array(4));
  return [...a].map((n) => abc[n % abc.length]).join('');
}

function showCode(code, theme, toast) {
  navigator.clipboard?.writeText(code).catch(() => {});
  const box = document.getElementById('card-family');
  box.innerHTML = `<b>Your claim code: ${code}</b><br>Comment it under any ${theme.instagram} post. Within minutes the soldier is yours.`;
  toast('Code copied. Paste it as a comment on Instagram.');
}
