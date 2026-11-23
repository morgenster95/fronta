# Návrh medailí (pixel art kreslený v kódu, paleta Trench 24). python3 docs/mockups/medals/medals.py
import math
from PIL import Image, ImageDraw, ImageFont
R='/home/user/fronta/'; OUT=R+'docs/mockups/medals/'
PAL=['#'+l.strip() for l in open(R+'art/palette/trench24.hex') if l.strip()]
C=lambda i: tuple(int(PAL[i][j:j+2],16) for j in (1,3,5))+(255,)
INK,DK=0,1
METAL={'gold':(22,23,20,18),'silver':(9,16,15,14),'bronze':(23,20,19,18),'iron':(16,2,1,0),'steel':(16,15,14,17)}  # light, base, shade, rim

def shape_img(test, metal, W=16, H=14, inner=None):
    hi,base,sh,rim=METAL[metal]
    m=[[test(x-(W-1)/2,y-(H-1)/2) for x in range(W)] for y in range(H)]
    im=Image.new('RGBA',(W,H))
    ins=lambda x,y: 0<=x<W and 0<=y<H and m[y][x]
    for y in range(H):
        for x in range(W):
            if not m[y][x]: continue
            edge=not all(ins(x+dx,y+dy) for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)))
            if edge: col=rim if (not ins(x+1,y) or not ins(x,y+1)) else (sh if metal!='iron' else 16)
            elif not ins(x-1,y-1) or not ins(x-2,y-2) and not ins(x-1,y-2): col=hi
            elif not ins(x+1,y+1): col=sh
            else: col=base
            im.putpixel((x,y),C(col))
    if inner: inner(im)
    return im

def ribbon(stripes, W=10, H=6):
    im=Image.new('RGBA',(W,H)); 
    for y in range(H):
        for x in range(W):
            col=stripes[x*len(stripes)//W]
            if y==H-1 or x==0 or x==W-1: col=DK if (x==W-1 or y==H-1) else col
            im.putpixel((x,y),C(col))
    # záhyby stuhy
    for x in range(1,W-1):
        if (x+0)%3==0: im.putpixel((x,1),C(stripes[x*len(stripes)//W]))
    return im

def medal(stripes, body, W=16):
    rb=ribbon(stripes); out=Image.new('RGBA',(W,22))
    out.alpha_composite(rb,((W-rb.width)//2,0))
    # kroužek
    cx=W//2; out.putpixel((cx-1,6),C(METAL['silver'][2])); out.putpixel((cx,6),C(METAL['silver'][1]))
    out.putpixel((cx-1,7),C(METAL['silver'][3])); out.putpixel((cx,7),C(METAL['silver'][2]))
    out.alpha_composite(body,((W-body.width)//2,22-body.height))
    return out

# tvary
def cross(dx,dy):
    ax,ay=abs(dx),abs(dy)
    if ay>=ax: return ay<=6.6 and ax<=1.2+ay*0.42
    return ax<=6.6 and ay<=1.2+ax*0.42
def disc(dx,dy): return dx*dx+dy*dy<=5.9**2
def star5(dx,dy,r=6.6,ri=2.9):
    a=math.atan2(dx,-dy); d=math.hypot(dx,dy)
    k=(a%(2*math.pi/5))/(2*math.pi/5); t=abs(k-0.5)*2   # 1 u cípu, 0 mezi
    return d<=ri+(r-ri)*t**1.6
def star8(dx,dy):
    a=math.atan2(dx,-dy); d=math.hypot(dx,dy); n=8
    k=(a%(2*math.pi/n))/(2*math.pi/n); t=abs(k-0.5)*2
    return d<=3.2+(7.3-3.2)*t**2.2 or d<=3.4
def oval(dx,dy): return (dx/5.6)**2+(dy/6.6)**2<=1

def centre_dot(col):
    def f(im):
        w,h=im.size; x,y=w//2,h//2
        for p in ((x-1,y-1),(x,y-1),(x-1,y),(x,y)): im.putpixel(p,C(col))
    return f
def helmet_on(im, rows=('.###.','#####','#...#')):  # přilba na odznaku za zranění
    w,h=im.size; ox,oy=w//2-len(rows[0])//2,h//2-1
    for j,r in enumerate(rows):
        for i,c in enumerate(r):
            if c=='#': im.putpixel((ox+i,oy+j),C(1))
def helmet_brodie(im): helmet_on(im,('..###..','.#####.','#######'))
def wreath(im):
    w,h=im.size
    for (x,y) in [(2,6),(2,8),(3,10),(4,11),(13,6),(13,8),(12,10),(11,11)]:
        if 0<=x<w and 0<=y<h: im.putpixel((x,y),C(11))
def letter_c(im):
    w,h=im.size; x0,y0=w//2-2,h//2-2
    for (x,y) in [(1,0),(2,0),(3,0),(0,1),(0,2),(0,3),(1,4),(2,4),(3,4)]: im.putpixel((x0+x,y0+y),C(18))

MEDALS=[
 ('HEGEMONY',[
  ('Iron Wreath','bravery under fire', medal([1,16,1,19,1,16,1],shape_img(cross,'iron',15,15,centre_dot(19)))),
  ('Star of Merit','best shot of the day', medal([17,16,17,9,17,16,17],shape_img(star8,'silver',15,15,centre_dot(19)))),
  ('Wound Clasp','survived a heavy wound', medal([1,19,1],shape_img(oval,'steel',13,15,helmet_on))),
  ('Field Cross','best medic of the day', medal([14,9,19,9,14],shape_img(cross,'silver',15,15,centre_dot(18)))),
 ]),
 ('CONCORD',[
  ('Concord Cross','bravery under fire', medal([12,23,12,23,12],shape_img(cross,'bronze',15,15,letter_c))),
  ('Gallantry Star','best shot of the day', medal([11,22,18,22,11],shape_img(star5,'gold',15,15))),
  ('Wound Stripe','survived a heavy wound', medal([13,18,13],shape_img(disc,'bronze',13,13,helmet_brodie))),
  ('Field Medal','best medic of the day', medal([18,9,18,9,18],shape_img(disc,'silver',13,13,centre_dot(18)))),
 ]),
]

F=lambda s,b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf'%('-Bold' if b else ''),s)
BG=(244,240,231)
K=9; cellw=16*K+60
sheet=Image.new('RGB',(150+4*cellw,2*(22*K+90)+60),BG); d=ImageDraw.Draw(sheet)
d.text((20,14),'Medals: hand-drawn in code, Trench 24 palette, 16 x 22 px (shown 9x and 1x)',fill=(30,28,25),font=F(18,True))
for r,(side,ms) in enumerate(MEDALS):
    y=60+r*(22*K+90)
    d.text((20,y+22*K//2-10),side,fill=(30,28,25),font=F(16,True))
    for i,(n,why,im) in enumerate(ms):
        x=150+i*cellw
        big=im.resize((16*K,22*K),Image.NEAREST); 
        # mřížka
        for gy in range(22):
            for gx in range(16):
                d.rectangle([x+gx*K,y+gy*K,x+gx*K+K-1,y+gy*K+K-1],fill=(226,222,212) if (gx+gy)%2 else (236,232,222))
        sheet.paste(big,(x,y),big)
        sheet.paste(im,(x+16*K+8,y+22*K-22),im)          # 1:1
        sheet.paste(im.resize((32,44),Image.NEAREST),(x+16*K+8,y+22*K-70),im.resize((32,44),Image.NEAREST))  # 2:1
        d.text((x,y+22*K+6),n,fill=(30,28,25),font=F(15,True)); d.text((x,y+22*K+26),why,fill=(107,97,82),font=F(13))
sheet.save(OUT+'medals_sheet.png')
for side,ms in MEDALS:
    for n,_,im in ms: im.save(OUT+'medal_'+n.lower().replace(' ','_')+'.png')

# ukázka na kartě vojáka (styl hry: tmavý panel, krémový text)
S=R+'web/public/assets/soldiers/'
card=Image.new('RGB',(150,92),C(1)[:3]); cd=ImageDraw.Draw(card)
cd.rectangle([0,0,149,91],outline=C(5)[:3])
sold=Image.open(S+'concord_south.png').convert('RGBA'); card.paste(sold,(6,8),sold)
try: pf=ImageFont.truetype(R+'web/public/fonts/Silkscreen-Regular.ttf',8)
except Exception: pf=F(8)
cd.text((44,8),'EDMUND MCNAMARA',fill=C(9)[:3],font=pf); cd.text((44,19),'Rifleman · 3rd Platoon',fill=C(7)[:3],font=pf)
cd.text((6,46),'MEDALS',fill=C(23)[:3],font=pf)
ms=MEDALS[1][1]
for i,(n,_,im) in enumerate(ms[:3]): card.paste(im,(6+i*20,58),im)
card=card.resize((150*5,92*5),Image.NEAREST)
cd=ImageDraw.Draw(card)
gaz=Image.new('RGB',(750,170),(228,219,196)); gd=ImageDraw.Draw(gaz)
gd.text((20,14),'THE TRENCH GAZETTE · DAY 15',fill=(30,28,25),font=F(16,True))
gd.text((20,44),'DECORATED TODAY',fill=(126,59,42),font=F(20,True))
gm=MEDALS[1][1][1][2].resize((48,66),Image.NEAREST); gaz.paste(gm,(20,80),gm)
gd.text((84,86),'Gallantry Star to Edmund Mcnamara (Concord),',fill=(30,28,25),font=F(16))
gd.text((84,110),'4 enemy hits in one night from sector S-F11.',fill=(30,28,25),font=F(16))
both=Image.new('RGB',(750,92*5+170+20),BG); both.paste(card,(0,0)); both.paste(gaz,(0,92*5+20))
both.save(OUT+'medals_in_use.png'); print('ok')
