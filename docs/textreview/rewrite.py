"""Přepis špatných šablon příběhů (themes/front-ww1/story.json) a záznam staré/nové verze do docs/textreview/changes.json.
Spuštění: python docs/textreview/rewrite.py   (idempotentní: pracuje s indexy; spouští se jednou na původním souboru)."""
import json, copy, sys
P = 'themes/front-ww1/story.json'
S = json.load(open(P, encoding='utf-8'))
OLD = copy.deepcopy(S)
CH = []  # {section, idx, step?, why, old, new}

def put_daily(i, new, why):
    x = S['daily'][i]
    CH.append({'section': 'daily', 'idx': i, 'why': why, 'old': x['text'], 'new': new})
    x['text'] = new

def put_list(sec, i, new, why):
    old = S[sec][i]
    if isinstance(old, dict):
        CH.append({'section': sec, 'idx': i, 'why': why, 'old': old['text'], 'new': new}); old['text'] = new
    else:
        CH.append({'section': sec, 'idx': i, 'why': why, 'old': old, 'new': new}); S[sec][i] = new

def put_step(arc_idx, step, new, why):
    a = S['arcs'][arc_idx]
    CH.append({'section': f'arcs/{a["id"]}', 'idx': step, 'why': why, 'old': a['steps'][step], 'new': new})
    a['steps'][step] = new

W, J, G, N, F = 'zmínka o počasí v textu, který není o počasí', 'žargon, kterému hráč nerozumí', 'krkolomná nebo nejasná věta', 'nedává smysl', 'zájmeno v textu pro dvojici'

# ---- daily
put_daily(28, "Sun on {sector}. {name} took off {his} boots for the first time in nine days and the whole squad applauded.", J)
put_daily(31, "Thunder all night. {name} flinched at every crack. The old hands said that is how you spot the new ones. By morning, they were flinching too.", N)
put_daily(57, "{name} splinted a broken leg with a rifle and two belts. The patient asked if {he} was a real doctor. {He} said yes. {He} was lying.", J)
put_daily(68, "The cook's fire went out. {name} relit it under {his} own coat and served stew that tasted of wool.", W)
put_daily(80, "{name} dreamt {he} was back in {home}, working as a {trade}. {He} woke up and said nothing all morning.", W)
put_daily(84, "{name} thought about {waiting} on sentry tonight, and the night felt a little shorter.", W)
put_daily(94, "The shelling stopped while {name} was counting the seconds between hits. {He} kept counting anyway, and waited a long time before moving.", G)
put_daily(95, "A newspaper reached {name} with the corner torn off. According to the half a sentence that survived, the war was going well.", G)
put_daily(96, "{name} dreamt about missing a train. Waking up here felt like a harsh punishment for it.", G)
put_daily(97, "{name} traded for a better blanket and got a reputation as a sharp dealer. The man who lost it wants a rematch.", G)
put_daily(98, "{name} tried to write home with gloves on. The address is readable. Everything else will need some imagination.", G)
put_daily(99, "{name} found a clean spot on the table and set {his} bread on it. Within a minute, someone asked to borrow the spot.", G)
put_daily(100, "Somebody hung a doorbell on the next dugout. {name} went to look. It was a spoon tied to an empty tin.", G)
put_daily(101, "Asked what {he} wanted after the war, {name} said a chair. After some thought: a chair nobody else was sitting on.", G)
put_daily(102, "{name} heard wire rattling beyond the parapet. At the change of watch, {he} said exactly where and asked for it to be taken seriously.", G)
put_daily(103, "{name} drew the street leading to {home}. There was no room left for the last house, so {he} turned the page over.", G)
put_daily(104, "The men argued about whether fish sleep. {name} said yes, and was told to explain how anyone could know.", G)
put_daily(105, "A bullet hit the sandbag beside {name}. {He} ducked, and noticed {his} hands were shaking. {He} kept working anyway.", N)
put_daily(106, "{name} saved half a biscuit for later. Later came six minutes afterwards.", G)
put_daily(107, "The cook asked for an honest opinion of the stew. {name} asked if second helpings depended on the answer.", G)
put_daily(108, "{name} brushed dried mud off a letter and found one more word under it: 'soon'. {He} wished the rest of the sentence had survived.", G)
put_daily(109, "The patrol came back one man at a time. {name} held the gap open and counted until the corporal said that was everyone.", G)
put_daily(110, "{name} made a list of things to buy on leave. It started with socks and ended with a meal nobody could call a ration.", G)
put_daily(111, "New laces made {name}'s boots look almost respectable, until {he} stood up.", G)
put_daily(112, "{name} watched a pale shape beyond the wire while a flare burned out. It turned out to be a sack, right where the sack had always been.", G)
put_daily(113, "A parcel from home held a comb. {name} has hardly any hair left after the last haircut, but {he} appreciated the thought.", G)
put_daily(114, "An unexploded shell lay beside the approach trench. {name} helped steer the carrying party around it and was glad to leave the problem to somebody else.", G)
put_daily(115, "An empty jam tin became {name}'s cup. The first drink still tasted of strawberries. {He} took small sips.", G)
put_daily(116, "{name} remembered the tune but not the words. Six men offered six different songs, and none of them helped.", G)
put_daily(117, "The gas alarm sounded during supper. {name} put the bread down carefully and did not finish it until the all-clear.", G)
put_daily(118, "{name} washed {his} face and someone asked if headquarters was visiting. Apparently being clean needs an explanation.", G)
put_daily(119, "{name} borrowed a book with three readers already waiting in line. For once, everyone was impatient about something harmless.", G)
put_daily(120, "A lice inspection interrupted a heated argument about politics. {name} pointed out that at least one enemy had been positively identified.", G)
put_daily(121, "{name} heard a man laugh on the other side of the enemy parapet. It sounded so ordinary that it was more unsettling than a shot.", G)
put_daily(122, "{name} tried to remember the sound of the church bell in {home}. Every version sounded like the ration bell.", G)
put_daily(123, "Part of the parapet collapsed near {name}. Repairs started as soon as the dust settled, with one man on watch while the rest worked.", G)
put_daily(124, "{name} got a photo of the family house. {He} spent longer looking at the strange curtains than at the faces.", G)
put_daily(125, "{name} was halfway through a story when {his} listener fell asleep. {He} counted that as a success.", G)
put_daily(126, "Someone asked {name} to wake them in ten minutes. {He} had no watch, so {he} counted slowly and woke them at what felt like ten.", N)
put_daily(127, "{name} came off watch and could not say whether the last hour had felt long or short. {He} remembered every move in one patch of wire.", G)
put_daily(128, "The company barber offered a choice of haircuts. {name} asked to see the second one. The barber laughed.", G)
put_daily(130, "The trench wall shook against {name}'s shoulder during the bombardment. {He} pressed both feet into the boards and waited for the next hit.", G)
put_daily(131, "A story about a goat passed through three dugouts and reached {name} as a story about a general. The ending was the same.", G)
put_daily(132, "{name} checked the safety catch three times before handing over the post. The man taking over noticed, and checked it once more.", G)
put_daily(134, "Shellfire stopped the carrying party at a trench junction. {name} waited under a load that got heavier by the minute.", G)
put_daily(135, "{name} sharpened a pencil carefully and then could not think what to write. {He} put the date at the top anyway.", G)
put_daily(136, "{name} opened a parcel addressed in unfamiliar handwriting. A note inside said the usual writer had hurt a wrist. {He} read that note first.", G)
put_daily(137, "{name} traded a cigarette for a pinch of salt. Supper improved. The argument about the exchange rate did not.", G)
put_daily(138, "A pocket watch went along the bench so everyone could set the time. {name} has no watch, but checked it anyway, just to feel included.", N)
put_daily(139, "A stretcher party needed the passage. {name} backed into a recess with an ammunition box and stayed there until the last bearer passed.", G)
put_daily(140, "{name} tried to sketch a horse from memory. The dugout agreed it was a very good dog.", G)
put_daily(141, "{name} brought sandbags forward and found the damage worse than the message had said. The party went back for another load.", G)
put_daily(142, "{name} ended a letter with 'nothing to report', then added half a page about the missing soap.", G)
put_daily(143, "The telephone went dead during the shelling. {name} watched the runner leave with the written orders, then listened for the phone to ring again.", G)
put_daily(144, "{name} saved a seat for someone fetching supper. Holding it against three hungry men turned out to be hard work.", G)
put_daily(145, "{name} counted the stitches in a darned sock while waiting for orders. Whoever fixed it had used three colors of wool.", G)
put_daily(151, "Fog hid the far end of {sector}. {name} kept counting the turns so as not to walk past the dugout.", J)
put_daily(162, "Rain blew in under the dugout door. {name} moved {his} boots out of the wet, then realized they were already inside.", G)
put_daily(163, "{name} held a loose roof board in place while the storm passed. Every conversation had to wait until {he} could lower both arms.", G)
put_daily(164, "Thunder shook dust from the beams over {name}. For once, nobody blamed the enemy.", N)
put_daily(167, "{name} spent the afternoon chasing {his} cap across the trench. It stopped every time {he} did, and jumped away again when {he} reached for it.", N)
put_daily(172, "{name} checked every ammunition belt by lamplight. One bad cartridge was enough to make {him} start the whole inspection again.", G)
put_daily(173, "The gun team argued about who carried the heaviest load. {name} offered to swap loads. The argument ended at once.", G)
put_daily(174, "{name} measured a replacement beam three times in the narrow passage. Nobody wanted to be the one who got it wrong.", N)
put_daily(175, "A pump handle snapped off in {name}'s hands. {He} fixed it while the water rose around {his} ankles.", G)
put_daily(176, "A patient apologized for bleeding on {name}'s sleeve. {He} told the patient to concentrate on staying awake.", G)
put_daily(177, "{name} sorted the dressings by lamplight. When the next stretcher arrived, {he} could find everything without looking.", G)
put_daily(178, "{name} delivered an urgent message and waited while the officer searched every pocket for a pencil to sign for it.", G)
put_daily(179, "A new trench junction cost {name} ten minutes. On the way back, {he} marked the right turn with a broken spoon.", G)
put_daily(180, "{name} noticed a loophole that had been dark for days. {He} watched it until dusk and wrote down what changed.", G)
put_daily(182, "{name} tested the telephone and heard someone at headquarters chewing. The line was declared perfectly clear.", G)
put_daily(183, "{name} taught a recruit to recognize letters by sound. By supper, the whole table was tapping out Morse on the planks.", G)
put_daily(184, "{name} counted the ladles in the pot against the men in the queue. The last serving took some careful scraping.", G)
put_daily(187, "{name} held a service beside a ration store. The men sang quietly so the sleepers behind the wall could rest.", G)
put_daily(188, "{name} checked the duty roster and noticed the same names on the worst shifts. {He} fetched a fresh sheet of paper and started over.", G)
put_daily(189, "A report called the trench satisfactory. {name} invited the author to spend a night in it before signing.", G)
put_daily(193, "{name} checked the fire step after the shelling. The wall had moved, and the spot where {he} always put {his} foot was gone.", G)
put_daily(195, "Two carrying parties met in the narrow trench. {name} helped work out how an ammunition box and a very large kettle could pass each other.", G)
put_daily(198, "{name} found a chair in the barn and sat down carefully, as if it might be reserved for someone of higher rank.", J)
put_daily(201, "{name} woke up at the usual time for night watch, even in the rear. It took several minutes to convince {him} to go back to sleep.", J)
put_daily(209, "A child had slipped a riddle into a parcel for {name}. {He} kept the dugout guessing until supper, then turned the page over and read the answer.", N)
put_daily(212, "{name} mended a split glove with pale thread. One finger now looks like it has been promoted.", G)
put_daily(214, "{name} has learned to recognize the ration cart by its squeaky wheel. This afternoon, a different squeak caused real disappointment.", G)
put_daily(217, "A loose thread in {name}'s blanket turned out to be very long. By the time {he} stopped pulling, there was a hole to explain.", N)
put_daily(218, "{name} read a letter saying the neighbor had married again. The whole dugout wanted the first half of the story, which was missing.", G)
put_daily(219, "The new soap slipped into the wash bucket. {name} fished it out by feel and then had to wash again.", G)
put_daily(225, "A scrap of newspaper advertised a sale of garden furniture. {name} worked out how many months of pay a comfortable afternoon would cost.", G)
put_daily(226, "{name} caught a falling mug with {his} boot. Nobody could say if it was skill or luck, and {he} did not say either.", N)
put_daily(227, "{name} offered to read the newspaper aloud. The audience asked for the advertisements first, then the racing results, and the war last.", G)

# ---- enlist, enlistLate, firstWave, recovered, returned, transfer
put_list('enlist', 0, "{name} came up the line with {item} and nothing else. The sergeant wrote {him} down as {rank} and pointed at the mud.", W)
put_list('enlist', 4, "{name} arrived with the evening ration party, carrying {item} and a borrowed coat two sizes too big.", J)
put_list('enlist', 10, "{name} was a {trade} in {home} until the posters went up. {He} came to {sector} with {item}, and within a day the whole squad knew that {he} {quirk}.", J)
put_list('enlist', 14, "{name} told the sergeant {he} was a {trade}. The sergeant said the war needed one of those like it needed a hole in the roof, and put {him} on sentry.", W)
put_list('enlist', 16, "{name} arrived at {sector} with a carefully folded uniform. The first low beam ruined the cap; the first puddle ruined the rest.", G)
put_list('enlist', 20, "{name} unpacked {item} at {sector}. The man in the next bunk shifted his bag to make room without asking what it was.", G)
put_list('firstWave', 3, "The colonel shook hands with the first hundred, one by one. {name} was number {n}. {He} still remembers how stiff the colonel's glove felt.", W)
put_list('firstWave', 4, "First Wave. {name} signed when the ink on the posters was still fresh. {He} keeps the ribbon wrapped in oilcloth with {item}.", W)
put_list('firstWave', 9, "One of the first hundred, {name} was given the First Wave ribbon. {He} wrapped the paper that came with it in oilcloth to keep it safe.", W)
put_list('recovered', 1, "{name} came back to {sector} with a new scar and an old joke. The squad was glad of both.", J)
put_list('recovered', 11, "{name} rejoined {sector} carrying a borrowed book from the ward. It is now overdue, which {he} says is a good reason to stay alive.", N)
put_list('returned', 1, "The sentry nearly shot {name} coming in through the wire. {He} had been lost near {place} for two days, living on puddle water and stubbornness.", W)
put_list('transfer', 4, "The {role}s took {name} in on a busy morning in {sector}. By noon {he} had learned the first rule of the job, and by evening the second.", W)

# ---- pair (comrade, enemy): bez zájmen
put_list('comrade', 0, "{a} and {b} split the last tin of beef, counting the bites out loud to keep it fair.", J)
put_list('comrade', 2, "{a} taught {b} to play the harmonica. The whole squad has asked them both, politely, to stop.", J)
put_list('comrade', 3, "{a} pulled {b} out of a flooded shell hole at {place}. Neither has mentioned it since. Both remember.", G)
put_list('comrade', 4, "{a} and {b} argued all night about whose hometown has the better beer. They agreed to finish the argument after the war.", G)
put_list('comrade', 8, "{a} and {b} made a pact on sentry tonight: whoever gets home first visits the other's family. They shook on it.", W)
put_list('comrade', 9, "{a} saw {b} freeze up on the fire step at {place}. {as} said nothing, just stood closer. It was enough.", W)
put_list('comrade', 10, "{a} and {b} divided a parcel using a tin lid as scales. The last crumb needed a second opinion.", G)
put_list('comrade', 13, "{a} lent {b} a pencil. It came back wrapped in a scrap of paper that said 'One good turn'.", G)
put_list('comrade', 14, "{a} and {b} carried a kettle through three narrow turns without spilling a drop. The applause at the end caused the accident.", G)
put_list('comrade', 15, "{a} fixed the strap on {b}'s pack. The price was a biscuit and a promise to stop mentioning the haircut.", G)
put_list('comrade', 16, "{a} and {b} tried to invent a new card game. The rules only made sense once they stopped betting tobacco.", G)
put_list('comrade', 17, "{a} and {b} sat through a quiet hour without finding anything to say. At the change of watch, the next pair was told it had been a good hour.", G)
put_list('enemy', 1, "{a} ({af}) and {b} ({bf}) ended up in the same shell hole at {place}. They stared at each other. Then each crawled home, and neither has told anyone.", G)
put_list('enemy', 3, "{a} had {b} of the {bf} in the sights at {place} for a long second. {b} was lighting a pipe. {a} let the match burn all the way down.", F)
put_list('enemy', 6, "At {place}, {a} of the {af} and {b} of the {bf} spent the morning shooting at the same loose sheet of metal. The sheet kept winning.", W)
put_list('enemy', 8, "During a lull at {place}, {a} called across from the {af} line. {b} answered from the {bf} side with a perfect imitation of an officer. Both trenches went quiet.", G)
put_list('enemy', 9, "{a} of the {af} and {b} of the {bf} watched a broken branch near {place} all morning. Neither could risk assuming it was only a branch.", G)
put_list('enemy', 10, "{a} ({af}) shouted a challenge across to {b} ({bf}) at {place}. The answer was lost under the guns. Nobody repeated the challenge.", G)
put_list('enemy', 12, "{a} of the {af} spotted {b} of the {bf} repairing a parapet at {place}. A warning shot stopped the repair on the spot.", G)
put_list('enemy', 13, "A bucket appeared above the {bf} parapet at {place}. {a} fired. {b} pulled the bucket down. Later a sign went up: 'Water costs enough already.'", G)

# ---- boj (žargon bay, revetment, greatcoat, stand-to)
put_list('hitLight', 0, "A splinter opened {name}'s cheek at {sector}. A medic stitched it on the spot and {he} was back on the fire step before the tea went cold.", J)
put_list('hitLight', 5, "Blast from a trench mortar threw {name} against the trench wall at {sector}. Ringing ears, a split lip, and no intention of leaving.", J)
put_list('hitHeavy', 4, "A trench mortar bomb landed in the next section of trench. The blast caught {name} at {sector} and the bearers came at a run.", J)
put_list('shellHeavy', 0, "A shell burst in the trench at {sector}. {name} was thrown against the wall and did not get up. The bearers came at a run.", J)
put_list('shellCrit', 1, "A direct hit on the trench at {sector}. {name} was the only one they could still help, and only just.", J)
put_list('shotHit', 3, "Dawn watch. {name} put a round across no man's land and the enemy line went quiet: {target}, {how}.", J)
put_list('shotHit', 4, "{name} fired twice at the enemy sap. The second shot found {target}, {how}. Nobody nearby said anything.", J)
put_list('stretcher', 0, "There was no bed for {name}. {He} lay on a stretcher outside, wrapped in a coat, listening to the guns.", J)
put_list('stabilized', 1, "{name} opened {his} eyes today and asked for water. At {sector} they cheered when the news came up the line.", J)
put_list('diedNoBed', 1, "There was no room for {name}. {He} died in the night under a borrowed coat, a few yards from a bed that never came free.", J)

# ---- arcs
put_step(10, 1, "{name} volunteered for a supply run to headquarters. {He} came back with exactly what was ordered and a suspiciously large coat.", J)
put_step(12, 1, "{name}'s diary, day nine: \"Still here. Soup again. A rat called the Major. Nothing else worth writing, which is the point.\"", W)
put_step(15, 1, "The reply to {name}'s chess move arrived with a long complaint about the weather at home and a note that {his} opponent had taken a pawn.", G)
put_step(18, 0, "A parcel came for {name} that was really meant for another soldier with the same surname. Inside: {gift}. {He} put everything back and kept only the wrapping.", N)
put_step(18, 2, "{name} caught a supply driver heading for one of the units and handed the parcel over with a note asking for word when it arrived.", G)
put_step(18, 3, "A card reached {name}: the parcel had found its owner. The message said thank you, and that {gift} had come just in time.", N)
put_step(25, 0, "{name} heard a faint second conversation on the telephone line. Headquarters said only one line was connected.", G)
put_step(25, 1, "The extra voice came back during {name}'s test. It was talking about potatoes, which made enemy spies an unlikely explanation.", G)
put_step(25, 2, "{name} traced the fault to two badly insulated wires touching near a junction. One of them belonged to the supply office.", G)
put_step(25, 3, "With the wires separated, {name}'s telephone carried only orders again. The section misses hearing what was for supper before it was served.", N)

# ---- pozadí: „nobody“ a pes nedávají ve větách smysl ("thought about nobody")
w = S['background']['waiting']
for i, t in enumerate(w):
    if t.startswith('nobody'):
        CH.append({'section': 'background/waiting', 'idx': i, 'why': N, 'old': t, 'new': "a mother who sets a place for {him} at every meal"}); w[i] = "a mother who sets a place for {him} at every meal"
    if t.startswith('a dog called Bastion'):
        CH.append({'section': 'background/waiting', 'idx': i, 'why': N, 'old': t, 'new': "an old neighbor who promised to keep {his} garden alive"}); w[i] = "an old neighbor who promised to keep {his} garden alive"

json.dump(S, open(P, 'w', encoding='utf-8'), indent=2, ensure_ascii=False); open(P, 'a').write("\n")
json.dump(CH, open('docs/textreview/changes.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(len(CH), 'změn')
