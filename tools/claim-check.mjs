// Diagnostika převzetí: vypíše žádosti o převzetí pro daný kód nebo @handle (bez UID, logy veřejného repa jsou veřejné).
// Použití: FIREBASE_SERVICE_ACCOUNT=... node tools/claim-check.mjs ENLIST-54FQ jackmdunn06
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = getFirestore();
const keys = process.argv.slice(2).map((k) => k.trim());
const docs = new Map();
for (const k of keys) {
  const field = /^ENLIST-/i.test(k) ? 'code' : 'handle';
  const q = await db.collection('claims').where(field, '==', field === 'code' ? k.toUpperCase() : k.toLowerCase()).get();
  q.docs.forEach((d) => docs.set(d.id, d.data()));
}
if (!docs.size) console.log('žádná žádost o převzetí pro', keys.join(', '));
for (const d of docs.values()) console.log(`handle=${d.handle} code=${d.code} status=${d.status} created=${d.createdAt?.toDate?.().toISOString()}`);
