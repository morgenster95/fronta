// Režim natáčení promo videí: /?reel=<scénář>&vacant=700 (jen vývojový server).
// Čas běží po snímcích (window.__reel.frame), takže nahrávání (tools/record-reel.mjs) je plynulé a přesné.
// Scénář = dráha kamery, titulky a události (výstřely, granáty, dávky) v sekundách.

const SCRIPTS = {
  // 1) upoutávka: atmosféra a výzva k naverbování
  teaser: ({ hx, hy, cx, cy, mid }) => ({
    seconds: 22,
    camera: [
      [0, hx - 200, mid, 1.5],
      [6, hx - 60, hy - 10, 3.0],
      [11, hx + 80, hy - 10, 3.4],
      [15, cx + 40, cy - 14, 3.4],
      [22, cx + 200, mid, 1.5],
    ],
    captions: [
      [0.5, 3.6, 'THE GREAT WAR ENDED.', 'big'],
      [3.8, 7, 'HERE, IT NEVER DID.', 'big'],
      [7.5, 11, 'EVERY FOLLOWER\nIS A SOLDIER.', 'big'],
      [11.3, 14.8, 'EVERY DAY\nTHE FRONT DECIDES.', 'big'],
      [15.2, 18.5, 'PICK A SIDE.', 'big'],
      [18.6, 22, 'COMMENT\nCONCORD  or  HEGEMONY\n@mudandiron', 'cta'],
    ],
    events: [
      [2.2, 'shell', 0], [5.5, 'shell', 1], [8.2, 'shoot', 0], [9.4, 'shoot', 0], [10.1, 'shell', 0, true],
      [12.0, 'shoot', 0], [12.6, 'shoot', 0], [13.3, 'shoot', 0], [16.0, 'shoot', 1], [16.8, 'shoot', 1],
      [17.4, 'shell', 1, true], [19.5, 'shell', 0], [20.6, 'shell', 1],
    ],
  }),
  // 2) vyber si stranu: Hegemonie zepředu, přes zemi nikoho, Concord zezadu
  sides: ({ hx, hy, cx, cy, mid }) => ({
    seconds: 18,
    camera: [
      [0, hx, hy - 10, 3.6],
      [6, hx + 60, hy - 6, 3.6],
      [9, (hx + cx) / 2, mid, 2.0],
      [12, cx - 40, cy - 14, 3.6],
      [18, cx + 40, cy - 14, 3.6],
    ],
    captions: [
      [0.4, 5.6, 'THE HEGEMONY\nIRON ENDURES.', 'heg'],
      [6.2, 8.8, 'BETWEEN THEM:\nSIX WINTERS OF MUD.', 'big'],
      [9.2, 14.2, 'THE CONCORD\nTOGETHER, OR NOT AT ALL.', 'con'],
      [14.6, 18, 'WHICH SIDE\nARE YOU ON?\nCOMMENT BELOW', 'cta'],
    ],
    events: [
      [1.2, 'shoot', 0], [2.4, 'shoot', 0], [3.1, 'shoot', 0], [4.5, 'shoot', 0], [7.2, 'shell', 0], [8.4, 'shell', 1],
      [10.5, 'shoot', 1], [11.6, 'shoot', 1], [12.8, 'shoot', 1], [13.7, 'shell', 1, true], [16.0, 'shoot', 1],
    ],
  }),
  // 4) nábor: prázdná stanoviště čekají na jména
  enlist: ({ hx, hy, cx, cy, mid }) => ({
    seconds: 18,
    camera: [
      [0, cx - 60, cy - 14, 4.6],
      [5, cx + 20, cy - 14, 4.6],
      [9, cx + 60, mid, 1.6],
      [13, hx + 40, hy - 10, 3.8],
      [18, hx - 40, hy - 10, 3.8],
    ],
    captions: [
      [0.4, 4.4, 'THIS RIFLE\nHAS NO NAME YET.', 'big'],
      [4.6, 8.6, 'THE FRONT NEEDS\nEVERY HAND.', 'big'],
      [9.0, 12.6, 'YOUR FRONT\nNEEDS YOU.', 'big'],
      [13.0, 18, 'ENLIST NOW\nCOMMENT\nCONCORD or HEGEMONY\n@mudandiron', 'cta'],
    ],
    events: [[2.0, 'shoot', 1], [3.2, 'shoot', 1], [6.4, 'shell', 1], [10.4, 'shell', 0, true], [14.0, 'shoot', 0], [15.2, 'shoot', 0], [16.6, 'shoot', 0]],
  }),
  // 3) jak se přidat: vyber stranu, napiš komentář, najdi se na frontě
  howto: ({ hx, hy, cx, cy, mid }) => ({
    seconds: 16,
    camera: [
      [0, cx - 120, mid + 60, 2.2],
      [5, cx - 30, cy - 14, 3.2],
      [10, cx, cy - 14, 4.4],
      [16, cx + 30, cy - 14, 4.4],
    ],
    captions: [
      [0.3, 3.8, '1. FOLLOW\n@mudandiron', 'big'],
      [4.0, 8.2, '2. COMMENT YOUR SIDE\nUNDER THE PINNED REEL\nCONCORD / HEGEMONY', 'big'],
      [8.4, 12.6, '3. YOUR SOLDIER\nTAKES A POST\nON THE FRONT', 'big'],
      [12.8, 16, 'FIND YOURSELF\nLINK IN BIO', 'cta'],
    ],
    events: [[2.0, 'shell', 1], [6.0, 'shoot', 1], [7.0, 'shoot', 1], [11.0, 'shoot', 1], [13.5, 'shell', 1]],
    select: 9.0, // otevře kartu volného stanoviště uprostřed záběru
  }),
};

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function startReel({ name, app, cam, life, map, theme, soldiers, ui, tick, tex, anims, select, hospitals }) {
  if (name === 'cine') {
    // samostatné filmové záběry (cinema-race.js): náhled a natáčení tools/render-cine.mjs
    return import('./reel-cine.js').then(({ startCineReel }) => startCineReel({ tex, anims }));
  }
  if (name === 'news') {
    // novinky na frontě: palba, role, XP, obvaziště, hlasování, rod, žebříčky (reel-news.js)
    return import('./reel-news.js').then(async ({ startNewsReel }) => {
      await startNewsReel({ cam, life, map, theme, soldiers, tex, anims, hospitals });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'barrage') {
    // noční bombardování + závod o kótu: kdo ji dobude, dostane dělostřelectvo (reel-barrage.js)
    return import('./reel-barrage.js').then(async ({ startBarrageReel }) => {
      await startBarrageReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'front6') {
    // Day reel Day 6 (15. 11.): příběhy fronty s bublinami rozhovorů, ztráty s příčinami, kanál, hlasování (reel-front6.js)
    return import('./reel-front6.js').then(async ({ startFrontReel }) => {
      await startFrontReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'hook') {
    // krátký náborový reel pro nové publikum (~14 s, smyčka): komentář se stane vojákem, fronta, boj, výběr strany (reel-hook.js)
    return import('./reel-hook.js').then(async ({ startHookReel }) => {
      await startHookReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'trialC') {
    // trial reel „I let 2,000 strangers…“ s aktuálními čísly, dělem a psy (reel-trialc.js)
    return import('./reel-trialc.js').then(async ({ startTrialCReel }) => {
      await startTrialCReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'trialA' || name === 'trialB') {
    // testovací reely pro neodběratele (A/B háček, ~16 s, smyčka): reel-trial.js
    return import('./reel-trial.js').then(async ({ startTrialReel }) => {
      await startTrialReel({ cam, life, map, theme, soldiers, tex, anims }, name.slice(-1));
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'sebs') {
    // krátký reel o propagandistovi Konradu Sebsovi (@_sebs.c_): jeho plakáty, voják, slova, bunkry, titul, výzva kreslit (reel-sebs.js)
    return import('./reel-sebs.js').then(async ({ startSebsReel }) => {
      await startSebsReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'thousand') {
    // náborový reel 1,000+ (19. 11.): počítadlo, bubliny komentářů, přehlídka otáčejících se rolí, výzva (reel-thousand.js)
    return import('./reel-thousand.js').then(async ({ startThousandReel }) => {
      await startThousandReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'news5') {
    // Front News, epizoda Day 5 (13.–14. 11.): rozkaz WIRE, první drátařské čety, poslední noc děl, ranění v zákopu, Owenhart, Hill 304 97 : 79 (reel-news5.js)
    return import('./reel-news5.js').then(async ({ startNews5Reel }) => {
      await startNews5Reel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'news4') {
    // Front News, epizoda Day 4 (12.–13. 11.): kráter a známka, druhá noc pod děly, drát a drátaři, nemocnice, padlí, War Bonds, Hill 304 (reel-news4.js, cine-trench.js)
    return import('./reel-news4.js').then(async ({ startNews4Reel }) => {
      await startNews4Reel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'news3') {
    // Front News, epizoda Day 3 (11. 11.): spojka s číslem 100, pád Verdel Ridge, děla, lazaret, první padlí, déšť, Hill 304 (reel-news3.js, cine-trench.js)
    return import('./reel-news3.js').then(async ({ startNews3Reel }) => {
      await startNews3Reel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'news2') {
    // Front News, epizoda Day 2 (19. 11.): studený začátek detailem v kresleném zákopu (reel-news2.js, cine-trench.js)
    return import('./reel-news2.js').then(async ({ startNews2Reel }) => {
      await startNews2Reel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'news1') {
    // Front News, epizoda Day 1 (19. 11.): široké zpravodajské video na YouTube (reel-news1.js)
    return import('./reel-news1.js').then(async ({ startNews1Reel }) => {
      await startNews1Reel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'bonds') {
    // reel o podpoře (18. 11.): podporovatelé ve hře, proč, tři úrovně bez cen, jemná výzva (reel-bonds.js)
    return import('./reel-bonds.js').then(async ({ startBondsReel }) => {
      await startBondsReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'growth') {
    // akviziční trial reel: timelapse fronty Day 1 → Day 11 (reel-growth.js)
    return import('./reel-growth.js').then(async ({ startGrowthReel }) => {
      await startGrowthReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'lone') {
    // akviziční trial reel: jeden muž, 152 komentářů = granátů, Hegemonie přesto vyhrála (reel-lone.js)
    return import('./reel-lone.js').then(async ({ startLoneReel }) => {
      await startLoneReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'roll') {
    // akviziční trial reel: všechna jména podle pořadí narukování, „pause to find yourself“ (reel-roll.js)
    return import('./reel-roll.js').then(async ({ startRollReel }) => {
      await startRollReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'zaza') {
    // akviziční trial reel: rod Zaza, 4 smrti na jednom stanovišti (reel-zaza.js)
    return import('./reel-zaza.js').then(async ({ startZazaReel }) => {
      await startZazaReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'wire2') {
    // výzva WIRE před zimou (22. 11.): drát obou stran, riziko, COMMENT WIRE (reel-wire2.js)
    return import('./reel-wire2.js').then(async ({ startWire2Reel }) => {
      await startWire2Reel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'cards') {
    // virální reel o sběratelských kartičkách (25. 11.): hák WINGS, raid / drát / dopis s novými scénami, sada podle vzácnosti, dědictví, výzva (reel-cards.js)
    return import('./reel-cards.js').then(async ({ startCardsReel }) => {
      await startCardsReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'front15') {
    // Day reel Day 15 (24. 11.): bouře, ztráty, Karel Pavla, Matthias Coop, závod, počty a výzva k nočnímu raidu se zakrytými kartičkami (reel-front15.js)
    return import('./reel-front15.js').then(async ({ startDay15Reel }) => {
      await startDay15Reel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'front14') {
    // Day reel Day 14 (23. 11.): noc drátařů, ztráty, nejlepší střelec a medik, patroni, Bone Quarry, počty (reel-front14.js)
    return import('./reel-front14.js').then(async ({ startDay14Reel }) => {
      await startDay14Reel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'front13') {
    // Day reel Day 13 (22. 11.): první sníh, ztráty, příběh, patroni, Bone Quarry, potrhaný drát a výzva WIRE (reel-front13.js)
    return import('./reel-front13.js').then(async ({ startDay13Reel }) => {
      await startDay13Reel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'front12') {
    // Day reel Day 12 (21. 11.): psi na frontě, dělo z Grey Mill, ztráty, propagandista, patron, Bone Quarry, počty (reel-front12.js)
    return import('./reel-front12.js').then(async ({ startDay12Reel }) => {
      await startDay12Reel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'dogs') {
    // novinka Trench Dogs (21. 11.): příchod psa, plemena, psi patronů ve hře, deník, rod, Patreon od Field Post (reel-dogs.js, cine-dogs.js)
    return import('./reel-dogs.js').then(async ({ startDogsReel }) => {
      await startDogsReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'front11') {
    // Day reel Day 11 (20. 11.): přeplněné nemocnice, nemoci, výzva MEDIC, Ali a Kitty, Grey Mill a dělo, propagandisté, War Bonds, Concord 1 000, Patreon a nová adresa (reel-front11.js)
    return import('./reel-front11.js').then(async ({ startDay11Reel }) => {
      await startDay11Reel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'front10') {
    // Day reel Day 10 (19. 11.): raid ve hře, kanál pro Hegemonii, ztráty, hrdinská oslava 1 435 vojáků, War Bonds, Grey Mill (reel-front10.js)
    return import('./reel-front10.js').then(async ({ startDay10Reel }) => {
      await startDay10Reel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'front9') {
    // Day reel Day 9 (18. 11.): háček s bojem v zákopu, palba 2× denně, ztráty, příběh, noví piloti, počty, závod, výzva RAID (reel-front9.js)
    return import('./reel-front9.js').then(async ({ startDay9Reel }) => {
      await startDay9Reel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'front8') {
    // Day reel Day 8 (17. 11.): výsledek souboje o bunkry (ruiny), příběhy (kbelík, čaj), ztráty a proč, závod, noví patroni s hvězdou, přírůstky, nábor pilotů (reel-front8.js)
    return import('./reel-front8.js').then(async ({ startDay8Reel }) => {
      await startDay8Reel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'pillbox') {
    // souboj o pevnůstky (16. 11.): bunkry obou stran, velitelství, děla, výbuch a ruina, výzva „1 comment = 1 shell“ (reel-pillbox.js)
    return import('./reel-pillbox.js').then(async ({ startPillboxReel }) => {
      await startPillboxReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'front7') {
    // Day reel Day 7 (16. 11.): příběhy skutečných vojáků, nové filmové scény (píseň přes drát, šachy poštou, iniciály ve zdi), ztráty, pevnůstky, závod, počty (reel-front7.js)
    return import('./reel-front7.js').then(async ({ startStoriesReel }) => {
      await startStoriesReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'night6') {
    // Den 6: noc wiring party (skuteční dobrovolníci, světlice, jména zasažených), poslední granáty, krátké shrnutí (reel-night6.js)
    return import('./reel-night6.js').then(async ({ startNightReel }) => {
      await startNightReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'hill304') {
    // vítězství Hegemonie na Hill 304: kopec, stužka, pozorovací strom, záběr ve hře, nový závod (cíl 200), výzva (reel-hill304.js)
    return import('./reel-hill304.js').then(async ({ startHillReel }) => {
      await startHillReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'pilot') {
    // nábor pilotů (17. 11.): samostatné video o pilotech a letadlech, výzva PILOT (reel-pilot.js)
    return import('./reel-pilot.js').then(async ({ startPilotReel }) => {
      await startPilotReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'wire') {
    // wiring party: historie, nové animace (plazení, světlice, kůl), potrhaný drát ve hře, dobrovolníci u drátu, výzva WIRE (reel-wire.js)
    return import('./reel-wire.js').then(async ({ startWireReel }) => {
      await startWireReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'claim') {
    // návod: jak claimnout vojáka + co umí claimnutý voják (reel-claim.js)
    return import('./reel-claim.js').then(({ startClaimReel }) => startClaimReel({ theme, tex, anims }));
  }
  if (name === 'rip') {
    // první padlí bombardování: hroby, vojáci před nimi, v dálce výbuchy (reel-rip.js)
    return import('./reel-rip.js').then(({ startRipReel }) => startRipReel({ theme, tex, anims }));
  }
  if (name === 'ridge') {
    // závod o kótu rozhodnut: nábor, hrdina s medailí, dialog vojáků, bombardování, hlas hráče (reel-ridge.js)
    return import('./reel-ridge.js').then(({ startRidgeReel }) => {
      startRidgeReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (/^day\d+$/.test(name) && name !== 'day1') {
    // denní reel „co se stalo“ z podkladů tools/day-reel.mjs (reel-daily.js)
    return import('./reel-daily.js').then(({ startDailyReel }) => {
      startDailyReel({ name, cam, life, map, theme, soldiers, tex, anims, hospitals });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'day1') {
    // den 1: filmové záběry, závod o kótu, noviny (reel-day1.js)
    return import('./reel-day1.js').then(({ startDay1Reel }) => {
      startDay1Reel({ cam, life, map, theme, soldiers, tex, anims, select });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'story') {
    // příběhové video má vlastní scénář s překryvy (reel-story.js)
    return import('./reel-story.js').then(({ startStoryReel }) => {
      startStoryReel({ cam, life, map, theme, soldiers, tex, anims, select });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  const T = map.tile;
  const pick = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const hs = pick(0), cs = pick(1);
  const anchor = {
    hx: hs[Math.floor(hs.length / 2)]?.x ?? map.slots[0][0].x,
    hy: hs[Math.floor(hs.length / 2)]?.y ?? map.slots[0][0].y,
    cx: cs[Math.floor(cs.length / 2)]?.x ?? map.slots[1][0].x,
    cy: cs[Math.floor(cs.length / 2)]?.y ?? map.slots[1][0].y,
    mid: ((map.front[0] + map.front[1]) / 2) * T + 16,
  };
  const sc = SCRIPTS[name]?.(anchor);
  if (!sc) throw new Error(`reel: neznámý scénář ${name}`);

  // skrýt herní UI, přidat titulky
  document.body.classList.add('reel');
  const cap = document.createElement('div');
  cap.id = 'reel-caption';
  document.body.appendChild(cap);
  const fired = new Set();
  let selected = false;

  function camAt(t) {
    const k = sc.camera;
    let i = 0;
    while (i < k.length - 2 && t > k[i + 1][0]) i++;
    const [t0, x0, y0, z0] = k[i], [t1, x1, y1, z1] = k[i + 1];
    const u = ease(Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
    return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, z0 + (z1 - z0) * u];
  }

  function frame(t) {
    const [x, y, z] = camAt(t);
    cam.set(x, y, z);
    for (const [i, ev] of sc.events.entries()) {
      if (fired.has(i) || t < ev[0]) continue;
      fired.add(i);
      const [, kind, f, big] = ev;
      if (kind === 'shell') life.shell(x + (Math.random() - 0.5) * 260 / z, (f === 0 ? anchor.hy + 60 : anchor.cy - 70) + (Math.random() - 0.5) * 40, !!big);
      if (kind === 'shoot') {
        const vis = soldiers.filter((s) => s.faction === f && s.aim && Math.abs(s.x - x) < 200 / z * 2.5 && Math.abs(s.y - y) < 300 / z * 2.5);
        if (vis.length) life.debug.shoot([vis[Math.floor(Math.random() * vis.length)]]);
      }
    }
    if (sc.select && !selected && t >= sc.select) {
      selected = true;
      const near = soldiers.filter((s) => s.vacant && s.faction === 1).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
      if (near) ui.openSoldier(near, false);
    }
    const c = sc.captions.find(([a, b]) => t >= a && t < b);
    if (c) {
      const [a, b, text, style] = c;
      const fade = Math.min(1, (t - a) / 0.25, (b - t) / 0.25);
      cap.className = style;
      cap.style.opacity = fade;
      if (cap.dataset.text !== text) {
        cap.dataset.text = text;
        cap.innerHTML = text.split('\n').map((l) => `<span>${l.replace('&', '<i>&amp;</i>')}</span>`).join('');
      }
    } else cap.style.opacity = 0;
  }

  window.__reel = { seconds: sc.seconds, frame: (t) => { frame(t); tick(t * 1000); }, ready: true };
}

// pro tools/reel-audio (načasování zvuku podle scénáře)
export { SCRIPTS };
