# Mud & Iron — texty pro Instagram (@mudandiron)

Všechny soubory: `marketing/posts/` (obrázky 1080×1350, profilovka 1080×1080), `marketing/reels/` (videa 1080×1920, 30 fps).
**Nahrávej verze se zvukem `reels/*_sound.mp4`** (vlastní syntetizovaná hudba: temný podklad, bubny, déšť, dunění děl a výstřely v synchronu, bez autorských práv). Verze bez `_sound` jsou němé, kdybys chtěl dát hudbu z knihovny Instagramu.

---

## Profil
- **Profilovka:** `posts/00_profile_1080.png`
- **Jméno:** `Mud & Iron | Instagram War`
- **Bio:**
  ```
  ⚔️ Every follower is a soldier.
  🪖 Comment CONCORD or HEGEMONY to enlist
  🗳️ The front decides every day
  👇 Find yourself on the front
  ```
- **Odkaz:** `https://mudandiron.web.app`
- **Zvýrazněné stories:** ENLIST · SIDES · WAR ROOM · FALLEN

## Pořadí na začátek (aby mřížka profilu dávala smysl)
1. Reel **teaser** (připnout)
2. Reel **enlist** (připnout) ← pod tenhle se píše strana
3. Post **choose your side** (připnout)
4. Carousel **the war never ended + how to enlist**
5. Plakáty Hegemony / Concord (střídat v dalších dnech)
6. Reel **sides**, Reel **howto**

---

## Reel 0 — `reels/story_sound.mp4` (97 s, voiceover) — příběhové promo, ideálně připnout jako první
Vypravěč provede celou hrou: dvě strany → komentář → voják s tvým jménem → karta a služební záznam → půlnoční tah
(zranění, povýšení, smrt) → dědic z rodu → hlasování → dělostřelectvo od 500 → medaile First Wave → najdi se (link in bio).
Výroba: `python marketing/story_vo.py` (hlas) → `node tools/record-reel.mjs story` (obraz, běží `npm run dev`) → `python marketing/reel_audio.py story`.
```
Six winters. One valley of mud. The war that never ended. 🪖

Mud & Iron is a war fought by Instagram followers.
Comment your side and a soldier with YOUR name takes a post on the front, for good.

⚔️ Every soldier gets a role, a rank and a service record written day by day
🌑 Every midnight the front turns: wounds, promotions, the fallen
🩸 Fall, and the next of your family picks up the rifle
🗳️ Vote in the comments and decide what happens next
💥 500 claimed soldiers unlock the artillery
🎖️ The first 100 recruits wear the First Wave medal forever

Comment CONCORD or HEGEMONY below 👇
Find yourself on the front: link in bio.

#pixelart #ww1 #indiegame #trenchwarfare #gamedev #pixelartgame #grimdark #interactivegame #instagramgame #mudandiron
```

## Reel 1 — `reels/teaser_sound.mp4` (22 s)
```
The Great War ended. Here, it never did. ⚔️

Mud & Iron is a war fought by Instagram. Every follower becomes a soldier on a giant pixel trench map, with a name, a story and a fate that changes every day.

Pick a side 👇
🩶 HEGEMONY — iron endures
🫒 CONCORD — together, or not at all

Comment your side and take your post on the front.
Find yourself: link in bio.

#pixelart #ww1 #indiegame #trenchwarfare #gamedev #pixelartgame #grimdark #interactivegame #instagramgame #mudandiron
```

## Reel 2 — `reels/enlist_sound.mp4` (18 s) — PŘIPNOUT, sem se píše strana
```
This rifle has no name yet. 🪖

Comment CONCORD or HEGEMONY below and it's yours.
Within a few hours your soldier takes a free post on the front, with your @name on it.

One comment, one soldier. Choose carefully, there's no switching sides.

#pixelart #ww1 #indiegame #enlist #gamedev #pixelartgame #mudandiron
```

## Reel 3 — `reels/sides_sound.mp4` (18 s)
```
Two sides. One valley of mud. Six winters. 🩶 vs 🫒

THE HEGEMONY — an iron empire in field grey. Order. Discipline. Iron endures.
THE CONCORD — free provinces in khaki. They fight to go home. Together, or not at all.

Which side are you on? Comment it 👇 (it enlists you)

#pixelart #ww1 #chooseyourside #indiegame #gamedev #mudandiron
```

## Reel 4 — `reels/howto_sound.mp4` (16 s)
```
How to enlist in 10 seconds 🪖
1️⃣ Follow @mudandiron
2️⃣ Comment CONCORD or HEGEMONY under the pinned reel
3️⃣ Find your soldier on the front: link in bio

Every day the front changes. Every day you vote on what happens next.

#pixelart #ww1 #howto #indiegame #mudandiron
```

---

## Post — `posts/02_choose_your_side.png`
```
Choose your side. ⚔️

🩶 THE HEGEMONY
An iron empire that does not know the word retreat. Order, discipline, the long patience of steel.
→ comment HEGEMONY

🫒 THE CONCORD
A ragged alliance of free provinces in khaki and flat steel helmets. They fight for the right to go home.
→ comment CONCORD

Your comment = your soldier. No switching sides.

#pixelart #ww1 #chooseyourside #mudandiron
```

## Carousel — `posts/01_the_war_never_ended.png` + `posts/03_how_to_enlist.png`
```
For six winters the Concord and the Hegemony have bled into the same valley of mud.
Neither will yield. Both need men.
They need you. 🪖

Swipe → how to enlist.
Every follower becomes a soldier with a name, a unit and a story that is written day by day.

#pixelart #ww1 #grimdark #indiegame #mudandiron
```

## Plakát — `posts/04_enlist_poster.png`
```
YOUR FRONT NEEDS YOU. 🫵

Comment CONCORD or HEGEMONY and join the war.
Link in bio to find yourself on the front.

#pixelart #ww1 #propaganda #recruitment #mudandiron
```

## Plakát Hegemonie — `posts/05_enlist_hegemony.png`
```
IRON ENDURES. 🩶
The Empire needs disciplined men. Comment HEGEMONY and take your post.

#pixelart #ww1 #hegemony #mudandiron
```

## Plakát Concordu — `posts/06_enlist_concord.png`
```
STAND TOGETHER. 🫒
The Alliance needs every hand. Comment CONCORD and take your post.

#pixelart #ww1 #concord #mudandiron
```

---

## Odpovědi pod komentáře (šablony)
- `Welcome to the front, Private @{jméno}. Your post is ready, find yourself via the link in bio 🪖`
- `@{jméno} The Hegemony grows stronger. Iron endures 🩶`
- `@{jméno} Another hand for the Concord. Together, or not at all 🫒`
- (zkusil jinou stranu) `One soldier per account. Your oath is already sworn ⚔️`

## Stories (nápady)
- Anketa: **Which side would you join?** (HEGEMONY / CONCORD) → odkaz na enlist reel
- „Daily dispatch“: screenshot ze hry + text z War Roomu
- Odpočet milníků: „0 / 500 claimed soldiers until ARTILLERY unlocks“
- Repost rekrutů, kteří sdílejí kartu svého vojáka

## Pravidla tónu
- Fiktivní svět: žádné skutečné státy, symboly ani vlajky. Ponuré, ale ne krvavé.
- Vždy jedna jasná výzva: **comment CONCORD or HEGEMONY**.
- Anglicky (větší dosah). Hashtagy max ~10, střídat.
