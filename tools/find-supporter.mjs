// Najde vojáka podporovatele podle SHA-256 hashe e-mailu z Google přihlášení (Firebase Auth) a stavu hry (ownerUid).
// E-mail ani UID se NEVYPISUJE a do workflow se neposílá otevřeně (logy i vstupy veřejného repa jsou veřejné): vstupem je jen hash.
//   příprava hashe: printf '%s' 'adresa@example.com' | sha256sum        (ve workflow: node tools/find-supporter.mjs <sha256>)
import fs from 'node:fs';
import crypto from 'node:crypto';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const want = String(process.argv[2] || '').trim().toLowerCase();
const state = JSON.parse(fs.readFileSync('data/state.json', 'utf8'));
let uid = null, page;
do {
  const r = await getAuth().listUsers(1000, page);
  for (const u of r.users) if (u.email && crypto.createHash('sha256').update(u.email.trim().toLowerCase()).digest('hex') === want) uid = u.uid;
  page = r.pageToken;
} while (page && !uid);
if (!uid) { console.log('žádný uživatel s tímto hashem v Firebase Auth'); process.exit(0); }
const hits = state.soldiers.filter((s) => s.ownerUid === uid);
if (!hits.length) console.log('uživatel existuje, ale nemá převzatého vojáka');
for (const s of hits) console.log(`voják: handle=${s.handle} jméno=${s.name} strana=${s.faction} role=${s.archetype} stav=${s.status}`);
