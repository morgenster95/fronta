// Převzetí vojáka: přihlášení Googlem → kód ENLIST-XXXX → hráč ho napíše jako komentář na IG → ingest spáruje.
// Firebase se načte až při kliknutí (nezatěžuje první načtení mapy). Konfigurace v web/src/firebase-config.js.
import { firebaseConfig, claimEnabled } from './firebase-config.js';

const IN_APP = /Instagram|FBAN|FBAV|FB_IAB|Line\/|Twitter/i;

// Přihlášení Googlem (sdílené pro převzetí i převelení). Vrací { app, user } nebo null.
async function signIn(soldier, toast, param = 'claim') {
  const back = soldier ? `${location.origin}/?s=${encodeURIComponent(soldier.handle)}&${param}=1` : `${location.origin}/?${param}=1`;
  if (!claimEnabled || !firebaseConfig.apiKey) {
    toast('Claiming opens soon. Your soldier is safe in the trench.');
    return null;
  }
  // Google přihlášení v prohlížeči uvnitř Instagramu nefunguje (disallowed_useragent)
  if (IN_APP.test(navigator.userAgent)) {
    navigator.clipboard?.writeText(back).catch(() => {});
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
  try { localStorage.setItem('mi.auth', '1'); } catch {} // příště se při otevření karty zjistí, čí voják je můj
  mine = { known: false };
  return { app, user };
}

// Přihlášený účet na tomhle zařízení: { email, handle, pending } nebo undefined (nepřihlášen / nevíme).
// handle = převzatý voják (null = žádný), pending = voják čekající na kód z Instagramu.
// Firebase se načte jen tomu, kdo se na tomhle zařízení někdy přihlásil.
let mine = { known: false };
export async function myAccount() {
  if (mine.known) return mine.account;
  let flag = null;
  try { flag = localStorage.getItem('mi.auth'); } catch {}
  if (!flag || !claimEnabled || !firebaseConfig.apiKey) return undefined;
  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getAuth } = await import('firebase/auth');
    const app = getApps()[0] || initializeApp(firebaseConfig);
    const auth = getAuth(app);
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) {
      try { localStorage.removeItem('mi.auth'); } catch {}
      mine = { known: true, account: undefined };
      return undefined;
    }
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');
    const c = await getDoc(doc(getFirestore(app), 'claims', user.uid));
    const d = c.exists() ? c.data() : null;
    const account = { email: user.email || 'Google account', handle: d?.status === 'done' ? d.handle : null, pending: d?.status === 'pending' ? d.handle : null };
    mine = { known: true, account };
    return account;
  } catch (e) {
    console.warn('account check failed', e);
    return undefined;
  }
}
export const myHandle = async () => (await myAccount())?.handle;

// Jen přihlášení (bez převzetí): true = přihlášen; v PWA na iPhonu odejde na redirect a vrátí se na kartu
export async function signInHere(soldier, toast) {
  return !!(await signIn(soldier, toast, 'account'));
}

export async function signOutHere() {
  const { getApps } = await import('firebase/app');
  const { getAuth, signOut } = await import('firebase/auth');
  const app = getApps()[0];
  if (app) await signOut(getAuth(app));
  try { localStorage.removeItem('mi.auth'); } catch {}
  mine = { known: true, account: undefined };
}

export async function startClaim(soldier, theme, toast) {
  const s = await signIn(soldier, toast, 'claim');
  if (!s) return;
  const { getFirestore, doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
  const ref = doc(getFirestore(s.app), 'claims', s.user.uid);
  // jeden účet = jeden voják; opakované kliknutí ukáže stejný kód (nový by ten opsaný zneplatnil)
  const prev = await getDoc(ref).then((d) => (d.exists() ? d.data() : null)).catch(() => null);
  if (prev?.status === 'done') {
    toast(prev.handle === soldier.handle ? 'This soldier is already yours.' : `You already own @${prev.handle}. One soldier per account.`);
    return;
  }
  if (prev?.status === 'pending' && prev.handle === soldier.handle && /^ENLIST-[A-Z0-9]{4}$/.test(prev.code || '')) {
    showCode(prev.code, theme, toast);
    return;
  }
  const code = `ENLIST-${randomCode()}`;
  await setDoc(ref, {
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

// Dopis domů (retence): zapíše den války do profilu majitele; smyčka ho přijme jen pro právě běžící den a voják má další noc o 15 % menší riziko zranění.
// Jeden zápis na hráče a den (~100–1000 zápisů denně, limit Firestore Spark je 20 000).
export async function sendLetter(owner, day) {
  const { getFirestore, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  await setDoc(doc(getFirestore(owner.app), 'profiles', owner.user.uid), { letterDay: day, updatedAt: serverTimestamp() }, { merge: true });
  return true;
}

// Převzatý voják přihlášeného hráče (pro výpravy z mapy údolí): { app, user, handle } nebo null
export async function signInClaimed(toast) {
  const s = await signIn(null, toast, 'valley');
  if (!s) return null;
  const { getFirestore, doc, getDoc } = await import('firebase/firestore');
  const c = await getDoc(doc(getFirestore(s.app), 'claims', s.user.uid)).catch(() => null);
  const d = c?.exists() ? c.data() : null;
  if (!d || d.status !== 'done') {
    toast('Only claimed soldiers can volunteer here. Claim yours on your soldier card, or comment the keyword on Instagram.');
    return null;
  }
  return { ...s, handle: d.handle };
}

// Přihláška na výpravu: zapíše id výpravy do profilu; smyčka ji do pár minut zařadí (pokud je místo).
export async function sendVolunteer(owner, expeditionId) {
  const { getFirestore, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  await setDoc(doc(getFirestore(owner.app), 'profiles', owner.user.uid), { volunteer: expeditionId, updatedAt: serverTimestamp() }, { merge: true });
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
