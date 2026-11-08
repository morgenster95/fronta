# PixelLab log

## test01 (8. 11. 2026) — ověření stylu a měřítka
| Soubor | Nástroj | Parametry | ID | Cena |
|---|---|---|---|---|
| test01/mood_front_256x144.png | create_image_pro_flash | 256×144, palette Trench 24 | job 196acf97-c41e-4875-9dee-1708b528f38c | 9 |
| test01/tank_mk4_128x64.png | create_object_pro_flash | 1 směr, low top-down → vyšel ZEPŘEDU (nepoužít) | obj 185dd52b-fb03-4630-b8be-8c658c89ec48 | 6 |
| test01/tank_mk4_side_128x64.png | create_image_pro_flash | 128×64, side, palette | job 872ab3e8-164c-47f8-8e87-c870b45e804c | 6 |
| test01/tiles_trench_16.png (+.json) | create_topdown_tileset | standard, 16 px, transition 0.75 | 2a97b310-5f9e-4947-a574-b6784225d50e | 1 |
| test01/concord_rifleman_*.png | create_character | v3, 48 px → postava 46 px (moc velká) | dc00974b-4e0d-4687-ac77-1dc2603b6c5e | 2 |
| test01/hegemony_rifleman_*.png | create_character | v3, 48 px → moc olivová | 7598bede-908f-4947-b657-795461c13dd7 | 2 |
| test01/concord_rifleman32_*.png | create_character | v3, 32 px → postava 30 px ✔ měřítko | 9b6313c1-ce86-4b7f-9cc2-103b0270f907 | 2 |
| test01/hegemony_rifleman32_*.png | create_character | v3, 32 px, šedomodrá, bez zelené ✔ | 5fdac8d0-652c-42ce-bb73-0f69f9284751 | 2 |
| fixed/concord_rifleman32_north.png, _east.png | ruční oprava | díra v pažbě (21,24); předpažbí pušky x=12 y11–20 | — | 0 |

## test02 (8. 11. 2026) — Hegemony podle stylu Concordu
| Soubor | Nástroj | Parametry | ID | Cena |
|---|---|---|---|---|
| test02/heg_front_41a74172….png | create_image_pro_flash | 32×32, style_image = concord south, seed 11 → šedý ✔, ale výška 28 px | job 41a74172-351c-4ce9-93a1-bf600eb46e48 | 5 |
| test02/heg_front_4c660e65….png | create_image_pro_flash | seed 23 → přilba jako klobouk ✗ | job 4c660e65-5be6-4c6b-a338-59f81e2b6f1b | 5 |
| test02/heg_ref_*.png | create_character | v3 + reference_image (rotace kandidáta 1) → jednotné úhly ✔, výška 28 px | d88102ec-91fe-4aab-85db-4efd2f93b24d | 1 |

## test03–04 (8. 11. 2026) — finální střelec Hegemony, archetypy, rekvizity
Postup: `create_image_pro_flash` 32×32 se `style_image` = jih střelce frakce (5 gen) → QA → `create_character` v3 + reference (1 gen, 8 směrů).
| Soubor | Výsledek | ID (job / postava) | Cena |
|---|---|---|---|
| test03/heg_front_af2c1efe.png → hegemony (hra) | ✔ 30 px, šedomodrá | job af2c1efe… / char 2ee9db43-cb50-4e01-b3d3-1d34ea29cdf4 | 5+1 |
| test03/heg_front_44408cff.png | rezerva | job 44408cff… | 5 |
| test04/concord_medic | ✔ | char 1c2e3717-6107-4501-90a0-f12a33ff6432 | 5+1 |
| test04/concord_officer | ✔ (čepice 31 px) | char dc3ddbe4-b5a4-4de5-b05d-fd89d36197cb | 5+1 |
| test04/concord_machinegunner | ✗ 32 px → v2 ✔ (kulomet v rukou) | char f7a54b6c-d1b8-4ed1-b634-2074bcb72938 | 10+1 |
| test04/hegemony_medic | ✔ | char d2f80eb4-eedd-4552-8bdd-1934d6548f2a | 5+1 |
| test04/hegemony_machinegunner | ✔ | char 3a323a11-d6a9-42dc-a66f-7e8d9ce0102b | 5+1 |
| test04/hegemony_officer | ✗ divná čepice → v2 ✔ (ručně smazán 1 px) | char 950bb8f7-6aa9-4f47-9fe7-58bae4f1f330 | 10+1 |
| test04/prop_grave, prop_tree | ✔ | jobs d2b6f771…, 3a74feef… | 10 |
| test04/prop_crates | ✗ vypadá jako kameny | job 9ff21a60… | 5 |
| test04/prop_wire | ~ moc tmavé | job c5e9d5d5… | 5 |

## test05–06 (8. 11. 2026) — zbylé archetypy + nový střelec Concordu
Postup stejný (pro_flash čelní snímek se style_image → sprite_fix --baseline → v3 rotace). Všech 20 spritů (10 typů × 2 frakce) v `art/sprites.json`.
| Typ | Poznámka | Cena |
|---|---|---|
| concord/hegemony: sapper, runner, signaller, cook | ✔ (pata srovnána posunem ±1 px) | 12×5 + rotace |
| hegemony: chaplain, sniper | ✔ | |
| concord chaplain, sniper | 1. pokus 28 px → v2 ✔ (sniper převzal červenou pásku ze stylové předlohy) | +10 |
| hegemony cook | naběračka 1 px od ruky (QA hlásí ostrov, ponecháno) | |
| concord (střelec) v2 | khaki Brodie místo šedomodré přilby, char 950a1f6d-d64b-488b-a833-e5571cc9bb26 | 10+1 |

## test07 + tank (8. 11. 2026)
| Soubor | Výsledek | ID | Cena |
|---|---|---|---|
| test07/idle_{s,n}_0..3.png | template `breathing-idle` na střelci Concordu: 32 px, pata sedí, ale šablona trochu mění pušku; přínos malý (kód už „dýchá“ o 1 px) → hromadně nepouštěno | anim group 87bfd432-8c1e-43ab-9423-4c84331798f7 | 2 |
| tank/tank_*.png | `create_object_pro_flash` 8 směrů 128×128: ✗ není kosočtverečný Mk IV a je moc vysoký (bok 69 px ≈ 4 m, má být ~40 px). Jen koncept. Lepší měřítko má test01/tank_mk4_side_128x64.png | obj 64fbab78-875b-43dd-b256-1920479aeba2 | 8 |

## Život na frontě (8. 11. 2026)
| Co | Nástroj | ID | Cena |
|---|---|---|---|
| craters/crater_{s,m,water,huge}.png → web/public/assets/props | create_image_pro_flash, paleta | viz jobs | 4×5 |
| animace střelce: idle (jih/sever), walk (4 směry), fire (v3, 9 snímků, plátno 44 px!), fall (jih) — obě frakce | animate_character | skupiny v get_character | ~18 |
| animace zdravotníka: walk 4 směry, obě frakce | animate_character template walking-6-frames | | 8 |
| VFX: shell-blast, shell-small (ground_blast přebarvený na Trench 24), smoke-small | vfx_workbench (zdarma) | efekty b15c6b50…, 6d830951…, 93a69adb… | 0 |
Pozor: v3 animace zvětšují plátno (32 → 44 px, symetricky) → engine kotví patu výpočtem (life.js setTex).
