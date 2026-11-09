// Převzetí vojáka: přihlášení Googlem → kód ENLIST-XXXX → hráč ho napíše jako komentář na IG → ingest spáruje.
// Firebase se načte až při kliknutí (nezatěžuje první načtení mapy). Konfigurace v web/src/firebase-config.js.
import { firebaseConfig, claimEnabled } from './firebase-config.js';

const IN_APP = /Instagram|FBAN|FBAV|FB_IAB|Line\/|Twitter/i;

// Přihlášení Googlem (sdílené pro převzetí i převelení). Vrací { app, user } nebo null.
async function signIn(soldier, toast, param = 'claim') {
  if (!claimEnabled || !firebaseConfig.apiKey) {
    toast('Claiming opens soon. Your soldier is safe in the trench.');
    return null;
  }
  // Google přihlášení v prohlížeči uvnitř Instagramu nefunguje (disallowed_useragent)
  if (IN_APP.test(navigator.userAgent)) {
    const url = `${location.origin}/?s=${encodeURIComponent(soldier.handle)}&${param}=1`;
    navigator.clipboard?.writeText(url).catch(() => {});
    toast('Open this page in Safari or Chrome to sign in (tap ••• → Open in browser). Link copied.');
    return null;
  }
  const { initializeApp, getApps } = await import('firebase/app');
  const { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } = await import('firebase/auth');
  const app = getApps()[0] || initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  let user = auth.currentUser;
  if (!user) {
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    try {
      // v PWA na ploše iPhonu popup nejde → redirect (authDomain musí být doména, na které web běží!)
      if (standalone) {
        await signInWithRedirect(auth, provider);
        return null;
      }
      user = (await signInWithPopup(auth, provider)).user;
    } catch (e) {
      const r = await getRedirectResult(auth).catch(() => null);
      user = r?.user;
      if (!user) {
        toast('Sign-in failed. Try again.');
        return null;
      }
    }
  }
  return { app, user };
}

export async function startClaim(soldier, theme, toast) {
  const s = await signIn(soldier, toast, 'claim');
  if (!s) return;
  const { getFirestore, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  const code = `ENLIST-${randomCode()}`;
  await setDoc(doc(getFirestore(s.app), 'claims', s.user.uid), {
    handle: soldier.handle,
    code,
    uid: s.user.uid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  showCode(code, theme, toast);
}

// Patří voják přihlášenému hráči? Hráč smí číst jen svůj dokument claims/{uid} (pravidla Firestore).
// Vrací { app, user } majitele, nebo null (a hráči vysvětlí proč).
export async function signInAsOwner(soldier, toast) {
  const s = await signIn(soldier, toast, 'transfer');
  if (!s) return null;
  const { getFirestore, doc, getDoc } = await import('firebase/firestore');
  const c = await getDoc(doc(getFirestore(s.app), 'claims', s.user.uid)).catch(() => null);
  const d = c?.exists() ? c.data() : null;
  if (!d || d.handle !== soldier.handle || d.status !== 'done') {
    toast(`Only the soldier's owner can request a transfer. ${d?.status === 'done' ? `Your soldier is @${d.handle}.` : ''}`.trim());
    return null;
  }
  return s;
}

// Převelení: zapíše přání do profilu majitele; smyčka ho provede u jeho vojáka.
export async function sendTransfer(owner, role) {
  const { getFirestore, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  await setDoc(doc(getFirestore(owner.app), 'profiles', owner.user.uid), { role, updatedAt: serverTimestamp() }, { merge: true });
  return true;
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
