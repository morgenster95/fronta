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
