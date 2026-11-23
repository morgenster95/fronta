from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, Table, TableStyle, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image as PI
D='/home/user/fronta/docs/artist-brief/'; I=D+'img/'
pdfmetrics.registerFont(TTFont('DV','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DVB','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DVM','/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
from reportlab.lib.fonts import addMapping
addMapping('DV',0,0,'DV'); addMapping('DV',1,0,'DVB'); addMapping('DV',0,1,'DV'); addMapping('DV',1,1,'DVB')
RUST=colors.HexColor('#7e3b2a'); INK=colors.HexColor('#1c1a17'); MUD=colors.HexColor('#6b6152'); PALE=colors.HexColor('#efe9dc')
H1=ParagraphStyle('h1',fontName='DVB',fontSize=19,leading=24,textColor=RUST,spaceBefore=4,spaceAfter=8)
H2=ParagraphStyle('h2',fontName='DVB',fontSize=12.5,leading=16,textColor=INK,spaceBefore=8,spaceAfter=4)
B=ParagraphStyle('b',fontName='DV',fontSize=9.6,leading=13.4,textColor=INK,spaceAfter=4)
SM=ParagraphStyle('sm',parent=B,fontSize=8.3,leading=11,textColor=MUD)
BL=ParagraphStyle('bl',parent=B,leftIndent=12,bulletIndent=2,spaceAfter=2)
W=A4[0]-36*mm
def img(f,w=None,maxh=None):
    p=PI.open(I+f); r=p.height/p.width; w=w or W
    if maxh and w*r>maxh: w=maxh/r
    return Image(I+f,width=w,height=w*r)
def ul(items): return [Paragraph(t,BL,bulletText='•') for t in items]
HC=ParagraphStyle('hc',parent=B,fontName='DVB',fontSize=8.6,leading=11,spaceAfter=0,textColor=colors.white)
CC=ParagraphStyle('cc',parent=B,fontSize=8.6,leading=11,spaceAfter=0)
def tbl(rows,cw,head=True):
    rows=[[(Paragraph(c,HC if (head and i==0) else CC) if isinstance(c,str) else c) for c in r] for i,r in enumerate(rows)]
    t=Table(rows,colWidths=cw,repeatRows=1 if head else 0)
    st=[('FONTNAME',(0,0),(-1,-1),'DV'),('FONTSIZE',(0,0),(-1,-1),8.6),('LEADING',(0,0),(-1,-1),11),
        ('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),0.4,colors.HexColor('#b9b0a0')),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,PALE]),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3)]
    if head: st+= [('BACKGROUND',(0,0),(-1,0),INK),('TEXTCOLOR',(0,0),(-1,0),colors.white),('FONTNAME',(0,0),(-1,0),'DVB')]
    t.setStyle(TableStyle(st)); return t
P=lambda t,s=B: Paragraph(t,s)
def cell(t): return Paragraph(t,ParagraphStyle('c',parent=B,fontSize=8.6,leading=11,spaceAfter=0))

s=[]
# ---- cover
s+= [P('MUD &amp; IRON',ParagraphStyle('t',fontName='DVB',fontSize=30,leading=36,textColor=INK)),
     P('Sprite art brief for character and prop artists · v1 · 23 Nov 2026',ParagraphStyle('st',parent=B,fontSize=11,textColor=MUD)),Spacer(1,6)]
cover=Table([[img('ingame.png',w=62*mm),[P('<b>What the game is.</b> Mud &amp; Iron is a browser game set in a fictional World War One. Every Instagram follower becomes one soldier in a long trench line, on one of two sides: <b>The Hegemony</b> (grey-blue) or <b>The Concord</b> (olive-khaki). The whole front is one scrolling map seen from slightly above. Hundreds of soldiers are on screen, so every sprite must read clearly at 1× size.'),
     P('<b>What you will make.</b> New soldier sprites (roles, poses, 8 directions), animations, and props (vehicles, animals, objects) that sit next to our existing art without anyone noticing a different hand.'),
     P('<b>The one rule.</b> Same grid, same height, same palette, same light. Nothing is ever resized. If it does not fit the grid, it is redrawn.'),
     P('<b>Kit (in the folder next to this PDF):</b> palette files for Aseprite / GIMP / Photoshop, empty templates 32×32 and 64×64, guide overlays, and our real sprites as reference.',B),
     P('The picture on the left is a real screenshot of the game (phone, zoomed in).',SM)]]],colWidths=[66*mm,W-66*mm])
cover.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(1,0),(1,0),10)]))
s+=[cover,PageBreak()]

# ---- golden rules
s+=[P('1. Golden rules (checklist)',H1)]
s+=ul(['<b>Soldier canvas 32 × 32 px. The figure is 30 px tall.</b> Top of the helmet on row 0–2, boots end on <b>row 30</b> (rows counted from 0 at the top). Row 31 stays empty.',
 '<b>Horizontal centre:</b> the body is centred on column 16 (between columns 15 and 16). The game pins every sprite at the point (16, 30): middle of the feet.',
 '<b>Animation canvas 64 × 64 px</b> = the 32 px figure placed in the middle (offset 16, 16). Boots end on <b>row 46</b>, centre column 32. The extra space is only for things that stick out (rifle, arm, thrown grenade, body lying down).',
 '<b>Head (helmet + face) = 9–10 px, about one third of the height.</b> Figures are about 3 heads tall: chunky, readable, not realistic 7-head proportions and not cute chibi either.',
 '<b>Only the 24 colours of the “Trench 24” palette.</b> No other colour, no gradients, no anti-aliasing. Alpha is only fully on or fully off (0 or 255), never half-transparent.',
 '<b>Light comes from the upper left</b>, soft and overcast. No glow, no cast light, no drop shadows on the ground (the game adds shadows, fire and flashes as effects).',
 '<b>Selective dark outline</b> (#0e0d0c / #1c1a17) where the shape meets the background; inner lines in a darker shade of the local colour. No uniform black line around everything.',
 '<b>Never resize pixel art</b> (no scaling up, down or by 1.5×). One art pixel = one game pixel. Scale: <b>1 metre = 16 px</b>.',
 '<b>Silhouette first:</b> each side is recognised by helmet shape and colour temperature, not by small details (page 4).',
 '<b>No floating pixels</b>, no gaps inside a weapon. The rifle must read as one piece: muzzle → stock → hand.',
 '<b>Camera:</b> “low top-down”, about 3/4 from above, the same for everything. Vehicles and animals that move sideways are drawn as a clean side profile (page 8).'])
s+=[Spacer(1,6),P('<b>Setting up Aseprite (recommended):</b> File → New: width 32, height 32, colour mode RGBA, transparent background. Palette → Load palette → <font face="DVM">kit/trench24.gpl</font>. View → Grid settings: 1 × 1 px (pixel grid) and a second grid of 8 × 8 px. Add <font face="DVM">kit/guide_32x32_overlay.png</font> as a locked reference layer on top (red line = boots row, green = centre, orange box = head zone), hide it before export. For animations use the 64 × 64 template and guide. In Photoshop: Image → Mode → Indexed, custom palette from <font face="DVM">trench24.hex</font>, Dither: none, and resample “Nearest Neighbor (hard edges)” if you ever preview larger.',B),PageBreak()]

# ---- grid
s+=[P('2. The grid and the anchor point',H1),
    P('Left: a static sprite on its 32 × 32 canvas. Right: an animation frame on 64 × 64. <font color="#c82828"><b>Red line</b></font> = the bottom edge of the boots (row 30 or row 46). <font color="#1e8c46"><b>Green line</b></font> = horizontal centre. Grey lines on the 64 canvas show where the 32 × 32 box sits inside it.')]
g=Table([[img('canvas32.png',w=W*0.44),img('canvas64.png',w=W*0.54)]],colWidths=[W*0.45,W*0.55]); s+=[g,Spacer(1,6)]
s+=[tbl([['Asset','Canvas','Boots row','Centre column','Figure height'],
 ['Soldier, static pose (8 directions)','32 × 32','30','16','30 px (±1 for caps / spikes)'],
 ['Soldier, animation frame','64 × 64','46','32','30 px standing (see pose heights)'],
 ['Older animations (do not use for new work)','44 × 44 / 48 × 48','36 / 38','22 / 24','30 px'],
 ['Dog, sitting / lying','32 × 32','31 (paws)','16','16–23 px'],
],[W*0.33,W*0.14,W*0.12,W*0.15,W*0.26]),Spacer(1,6),
 P('<b>Pose heights we use</b> (the boots / knees / body always touch the same ground row):'),
 tbl([['Pose','Visible height','Note'],['Standing, walking, saluting, smoking','28–31 px','head never above row 0 (32) or row 16 (64)'],['Kneeling, working with a hammer','24–30 px','knee on the ground row'],['Crouching / ducking under fire','19–29 px','hands on helmet'],['Running','27–33 px','body leans forward; lowest foot touches the ground row'],['Prone, crawling, firing lying down','12–19 px','body along the ground row, length up to ~34 px'],['Dying / falling','12–37 px','ends lying on the ground row']],[W*0.38,W*0.17,W*0.45]),PageBreak()]

# ---- proportions
s+=[P('3. Body proportions (measured from our sprites)',H1),
    P('These two are the master sprites. Every new soldier must line up with them row by row. Row numbers are from the top of the 32 × 32 canvas.')]
s+=[img('prop_heg.png',w=W*0.82),P('Hegemony rifleman, facing south (toward the camera).',SM),PageBreak(),img('prop_con.png',w=W*0.82),P('Concord rifleman, facing south.',SM)]
s+=[tbl([['Part','Size in pixels','Notes'],
 ['Whole figure','30 tall, 14–18 wide (with arms)','wider only with a big weapon or backpack'],
 ['Head incl. helmet','9–10 tall','= one third of the body. Helmet 5–6 rows, face 3 rows'],
 ['Face','4–5 wide × 3 tall','no drawn eyes or mouth: one dark row under the brim reads as the eyes; 2–3 skin tones'],
 ['Neck / collar','1 row','collar colour, not skin'],
 ['Shoulders','row 10–11 (H) / 11–12 (C)','arms hang straight, 2–3 px wide'],
 ['Hands','2 × 2 px skin','at row 19–21 when arms hang'],
 ['Torso','~8 rows','belt with pouches around row 18–19'],
 ['Legs','H: 4 rows under a long coat; C: 6–7 rows with puttees','two separate legs with a 2–4 px gap'],
 ['Boots','1–2 rows, dark','end exactly on row 30'],
 ['Rifle','26–30 px long, 1–2 px wide','held upright at the side, butt near the ground; must stay one connected line'],
],[W*0.2,W*0.3,W*0.5]),PageBreak()]

# ---- faction readability
s+=[P('4. The two sides: read them at a glance',H1),
    P('On a phone, 30 px soldiers are tiny. The side must be clear from the <b>helmet silhouette</b> and the <b>colour temperature</b> alone.')]
hd=Table([[img('head_heg.png',w=W*0.48),img('head_con.png',w=W*0.48)],[P('Hegemony: deep “coal scuttle” helmet, tall dome, short flare at the back and sides. Cool grey-blue.',SM),P('Concord: flat, wide “soup bowl” helmet with a broad brim. Warm olive-khaki.',SM)],
          [img('head_heg_e.png',w=W*0.48),img('head_con_e.png',w=W*0.48)],[P('Hegemony head, side view (east).',SM),P('Concord head, side view (east).',SM)]],colWidths=[W*0.5,W*0.5])
s+=[hd,Spacer(1,4),tbl([['','The Hegemony','The Concord'],
 ['Colour temperature','grey to slightly blue, <b>never green</b>','olive green / khaki, warm'],
 ['Helmet','deep, tall dome with a flared rim (Stahlhelm type)','flat shallow dish with a wide brim (Brodie type)'],
 ['Clothing','long greatcoat down to the shins, tall boots','shorter tunic, puttees on the lower legs, ankle boots'],
 ['Gear','leather belt and pouches, gas-mask tin','canvas webbing, cross straps on the back'],
 ['Main palette colours','#4a4f52 #666d70 #8a9295 #2a3138','#857a68 #6b6152 #a39782 #8c8a5c #545639 #6f7148'],
 ['Faces the camera?','yes: in the game they look <b>south</b> (front view)','no: in the game they look <b>north</b> (back view)'],
],[W*0.22,W*0.39,W*0.39]),PageBreak()]

# ---- palette
s+=[P('5. Palette “Trench 24”',H1),P('Use only these 24 colours (files in <font face="DVM">kit/</font>: <font face="DVM">trench24.gpl</font>, <font face="DVM">trench24.hex</font>, <font face="DVM">trench24_palette_24x1.png</font>). Skin uses the ochre and rust browns already in the palette, plus #c4b8a0 / #e3d9c3 for highlights.'),
    img('palette.png',w=W),Spacer(1,6)]
s+=ul(['Dark outline: #0e0d0c and #1c1a17. Do not use pure black (#000000).',
 'Shade with the next darker colour from the same family (steel, mud, olive), not with black.',
 'Red (#5c2a22 / #7e3b2a) is for blood, rust and the Hegemony armband; the medic cross is white #e3d9c3 on red.',
 'Bright colours (#9fa640 acid, #c9c26a yellow, #d98f3f ochre) only for small details: badges, brass, flame, the Concord armband.',
 'Dithering (checkerboard of two palette colours) is allowed on large flat areas such as a coat or a truck tarp, sparingly.'])
s+=[PageBreak()]

# ---- directions & roles
s+=[P('6. Directions and roles',H1),
    P('Every static soldier is delivered in <b>8 directions</b>, in this order and with these file names. The red line is the boots row: it must be the same in all 8.'),
    img('dirs.png',w=W),Spacer(1,6),
    P('<b>Roles that already exist</b> (south view). A new role or variant must match these in height, head size and level of detail. Officers wear a peaked cap instead of a helmet, medics a white armband with a red cross, cooks an apron, the chaplain a long dark coat.'),
    img('roles.png',w=W),PageBreak()]

# ---- animation
s+=[P('7. Animations',H1),
    P('Real frames from the game on 64 × 64 canvases (shown at 3×). The soldier animates <b>in place</b>: the game moves the sprite across the map, so walking and crawling must not drift sideways inside the canvas. Boots (or the body when lying) stay on the ground row in every frame.'),
    img('anims.png',w=W),Spacer(1,4)]
s+=[tbl([['Rule','Value'],
 ['Frames per animation','8 (6–9 allowed); loops must loop seamlessly (last frame flows into the first)'],
 ['Playback speed','8 frames per second'],
 ['Directions','south, north, east, west (west may be a mirror of east only when the figure is symmetrical; the rifle hand usually is not, so ask first)'],
 ['First frame','starts from the approved static pose (same helmet, face, colours, gear)'],
 ['Weapon','stays attached to the hands in every frame; if the pose has no rifle, it hangs on the back'],
 ['Existing animations','walk, run, idle, fire, fire-side, fire-prone, crawl, prone, crouch, duck, kneel, work (hammer), grenade, salute, wave, die, fall, limp, sit-wounded, lying-wounded, bandage, smoke, eat, warm hands, stamp feet'],
],[W*0.25,W*0.75]),PageBreak()]

# ---- scale & props
s+=[P('8. Scale and props',H1),
    P('Everything is drawn at the same scale, <b>1 metre = 16 px</b>, and sits on the same ground line. Here are real game props at 4× next to two soldiers:'),
    img('scale.png',w=W),Spacer(1,6)]
s+=ul(['<b>Vehicles and animals that move left and right</b> (trucks, carts, horses, dogs walking) are drawn as a <b>clean side profile</b>: wheels in one row, no front view, no 3/4 angle. The game mirrors them for the other direction.',
 '<b>Moving things are animated</b> (8 frames): wheels turn, hooves and legs step. Deliver as a horizontal strip <font face="DVM">name_anim.png</font> (frames side by side, same size) plus the still <font face="DVM">name.png</font>.',
 '<b>Leave an empty margin</b> of at least 10 px left and right and 7 px on top of a vehicle or animal frame, so no frame is cut off (a horse head and the end of a cart were cut before). Check that no frame touches the canvas edge.',
 'Static objects on the map (pillboxes, crates, graves, guns) use the same low top-down view as the soldiers, light from the upper left, no cast shadow.',
 'Typical sizes: crate 12–16 px, grave 24 × 32, pillbox 48 × 32, truck ~58 × 36, cart with horse ~69 × 29, field gun 64 × 48, crater 32–96 px wide.'])
s+=[PageBreak()]

# ---- delivery
s+=[P('9. Delivery and naming',H1)]
s+=[tbl([['What','File name','Example'],
 ['Static pose','&lt;side&gt;_&lt;role&gt;_&lt;direction&gt;.png','hegemony_sapper_south-east.png'],
 ['Rifleman (no role)','&lt;side&gt;_&lt;direction&gt;.png','concord_north.png'],
 ['Animation frame','&lt;side&gt;[_&lt;role&gt;]@&lt;animation&gt;_&lt;direction&gt;_&lt;n&gt;.png','concord_medic@walk_east_3.png'],
 ['Prop / vehicle','&lt;name&gt;.png and &lt;name&gt;_anim.png','truck_heg.png, truck_heg_anim.png'],
 ['Source file','.aseprite (or .psd) with layers','hegemony_sapper.aseprite'],
],[W*0.2,W*0.45,W*0.35]),Spacer(1,6),
 P('Sides: <font face="DVM">hegemony</font>, <font face="DVM">concord</font>. Directions: <font face="DVM">south, south-east, east, north-east, north, north-west, west, south-west</font>. Frame numbers start at 0. PNG, RGBA, 1× size (never upscaled), transparent background.')]
s+=[P('Before you send (self-check)',H2)]
s+=ul(['Canvas is exactly 32 × 32 (static) or 64 × 64 (animation).',
 'Boots end on row 30 (or 46) in every direction and frame; the body is centred.',
 'Height 30 px ±1, head 9–10 px; it lines up with the master sprite when the two are laid on top of each other.',
 'Only Trench 24 colours; no half-transparent pixels; no anti-aliasing.',
 'No stray pixels, no holes inside the weapon, the rifle is one connected piece.',
 'Hegemony is grey-blue with the deep helmet; Concord is olive with the flat helmet.',
 'Light from the upper left, selective dark outline, no drop shadow.',
 'Animations loop cleanly and stay in place; nothing touches the canvas edge.',
 'Look at it at 1× on a phone screen: you can still tell the side and the role.'])
s+=[Spacer(1,8),P('<b>Kit contents.</b> <font face="DVM">trench24.gpl / .hex / _palette_24x1.png</font> (palette); <font face="DVM">template_32x32_empty.png</font>, <font face="DVM">template_64x64_empty.png</font>; <font face="DVM">guide_32x32_overlay.png</font>, <font face="DVM">guide_64x64_overlay.png</font> (put on a locked top layer, hide on export); <font face="DVM">reference/</font>: both riflemen in 8 directions, all roles facing south, and four animations frame by frame.',B)]

def deco(c,d):
    c.saveState(); c.setFont('DV',7.5); c.setFillColor(MUD)
    c.drawString(18*mm,10*mm,'Mud & Iron · sprite art brief v1'); c.drawRightString(A4[0]-18*mm,10*mm,str(d.page)); c.restoreState()
doc=SimpleDocTemplate(D+'MudAndIron_sprite_brief.pdf',pagesize=A4,leftMargin=18*mm,rightMargin=18*mm,topMargin=15*mm,bottomMargin=16*mm,title='Mud & Iron – sprite art brief',author='Mud & Iron')
doc.build(s,onFirstPage=deco,onLaterPages=deco); print('pdf ok')
