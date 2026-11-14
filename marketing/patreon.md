# Patreon: MUD & IRON (texty a grafika ke vložení)

Stránka: https://www.patreon.com/mudandiron (adresa je i v `theme.support.url`; když bude jiná, změň ji tam).
Grafika (`python marketing/make_support.py`): `marketing/promo/patreon_cover.jpg` (obálka 1600×400),
`patreon_avatar.jpg` (profilový obrázek 512×512), `patreon_tier.jpg` (obrázek úrovně), `support_square.jpg` (čtverec do příspěvků).

Nastavení při zakládání: kategorie **Games** (Video games), obsah **není pro dospělé** (válka bez krve ve stylu pixel artu), měna USD.

## Name
Mud & Iron

## What are you creating? (krátké heslo)
a free WW1 trench game you play from Instagram comments

## About (O stránce)
Mud & Iron is a free pixel-art WW1 trench war played on Instagram.
Comment HEGEMONY or CONCORD under a post and you get your own soldier on a living front at mudandiron.web.app. Every morning at 13:00 UTC the Trench Gazette prints what happened: who was hit, who held the line, which side took the next hill. Every soldier keeps a diary that grows day by day.

It is made by one person, every day. No ads, no pay-to-win, nothing to buy in the game.

Patreon keeps the front running: the servers, the art and the time it takes to write a new edition every morning.

What you get:
🎗️ The War Bonds ribbon for your soldier: next to the name on the front, on the soldier card and on the "I ENLISTED" share image.
📰 A thank-you in the next Trench Gazette.
📓 One line in your soldier's diary that stays there for good.

It is honour only. A ribbon never makes a soldier shoot straighter or live longer.

## Úroveň (tier) 1: War Bonds, 3 USD měsíčně
Obrázek: `patreon_tier.jpg`

**Name:** War Bonds
**Price:** $3 / month
**Description:**
Buy the front a ration every month.
🎗️ The War Bonds ribbon for your soldier (on the front, on the card and on the share image)
📰 Your name in the next Trench Gazette
📓 A line in your soldier's diary: the quartermaster pins the ribbon on personally
The ribbon stays, even if you stop later. Honour only, never an advantage.

**Welcome note (zpráva po přihlášení):**
Thank you, soldier. The front remembers who kept it fed.
To get your ribbon, reply to this message with your Instagram handle (the one you used to enlist). Your soldier gets the War Bonds ribbon within a day, and the Trench Gazette thanks you in the next morning edition.
Not on the front yet? Comment HEGEMONY or CONCORD under any post on @mudandiron first.

## Volitelně: jednorázový dar
Patreon umí i jednorázový nákup v sekci **Shop** (když ji účet nabízí): položka „A Ration for the Front“ za 3 USD, popis stejný jako u úrovně, se stejnou stužkou.
Na předplatné tlačit nemusíš: kdo chce dát jednou, přihlásí se a po měsíci zruší, stužka zůstane.

## Jak se udělí stužka (beze změny proti Ko-fi)
Patron napíše na Patreonu své IG jméno → uživatel ho pošle Claudovi → příkaz do `data/commands.json`:
`{ "id": "support-<handle>-<datum>", "cmd": "support", "handle": "<ig>" }` (smyčka do ~5 min; stužka, zápis v deníku, poděkování v novinách).

## Až bude stránka hotová
1. Ověřit adresu stránky a případně ji opravit v `theme.support.url`.
2. Zapnout tlačítka na webu: `theme.support.buttons: true` (tlačítko „☕ Support“ u lupy a „Support the front on Patreon“ v panelu náboru).
3. Odkaz v biu IG (Linktree nebo druhý odkaz v biu).
4. Post `support-patreon` (`marketing/drafts/support-patreon.draft.json`) jen se souhlasem a časem.
