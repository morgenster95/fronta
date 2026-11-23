# Výroba zadání pro grafika: python3 docs/artist-brief/imgs.py && python3 docs/artist-brief/pdf.py
from PIL import Image, ImageDraw, ImageFont
import json, os
R='/home/user/fronta/'; S=R+'web/public/assets/soldiers/'; P=R+'web/public/assets/props/'
OUT=R+'docs/artist-brief/img/'; KIT=R+'docs/artist-brief/kit/'
F=lambda s,b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf'%('-Bold' if b else ''),s)
BG=(244,240,231); INK=(30,28,25); MID=(120,116,108)
PAL=[l.strip() for l in open(R+'art/palette/trench24.hex') if l.strip()]
NAMES=['ink','dark','mud0','mud1','mud2','mud3','sand','bone','pale','white','olive0','olive1','olive2','olive3','steel0','steel1','steel2','steel3','blood0','rust','rust2','acid','yellow','ochre']
def L(f): return Image.open(f).convert('RGBA')

def gridimg(im,K,pad=34,lines=(),cols=(),labels=True,step=None,major=8):
    w,h=im.size; G=Image.new('RGB',(w*K+pad*2,h*K+pad*2),BG); d=ImageDraw.Draw(G)
    for y in range(h):
        for x in range(w):
            d.rectangle([pad+x*K,pad+y*K,pad+x*K+K-1,pad+y*K+K-1],fill=(226,222,212) if (x+y)%2 else (238,234,225))
    G.paste(im.resize((w*K,h*K),Image.NEAREST),(pad,pad),im.resize((w*K,h*K),Image.NEAREST))
    d=ImageDraw.Draw(G)
    for i in range(w+1): d.line([pad+i*K,pad,pad+i*K,pad+h*K],fill=(60,58,54) if i%major==0 else (170,166,158),width=1)
    for i in range(h+1): d.line([pad,pad+i*K,pad+w*K,pad+i*K],fill=(60,58,54) if i%major==0 else (170,166,158),width=1)
    if labels:
        st=step or (2 if w<=32 else 4); f=F(max(9,min(13,K-2)))
        for i in range(0,w,st): d.text((pad+i*K+2,pad-16),str(i),fill=INK,font=f)
        for i in range(0,h,st): d.text((3,pad+i*K+2),str(i),fill=INK,font=f)
    for (y,col,txt) in lines:
        d.line([pad-8,pad+y*K,pad+w*K+8,pad+y*K],fill=col,width=3)
    for (x,col) in cols:
        d.line([pad+x*K,pad-8,pad+x*K,pad+h*K+8],fill=col,width=2)
    return G

RED=(200,40,40); BLUE=(40,90,200); GRN=(30,140,70); ORG=(220,120,20)
# 1) proportions: annotated heg south & con south, K=18
def prop(name,marks,out):
    im=L(S+name); K=18
    g=gridimg(im,K,lines=[(y,c,t) for y,c,t in marks],cols=[(16,GRN)])
    pad=34; W=g.width+250; C=Image.new('RGB',(W,g.height),BG); C.paste(g,(0,0)); d=ImageDraw.Draw(C)
    f=F(15)
    used=[]
    for y,c,t in marks:
        ty=pad+y*K-9
        while any(abs(ty-u)<18 for u in used): ty+=18
        used.append(ty)
        d.line([g.width-26,pad+y*K,g.width-4,ty+9],fill=c,width=2)
        d.text((g.width,ty),t,fill=c,font=f)
    C.save(OUT+out)
prop('hegemony_south.png',[(1,RED,'row 1  top of helmet'),(7,ORG,'row 7  helmet brim / eye shadow'),(10,ORG,'row 10  chin  (head = 10 px)'),(19,BLUE,'row 19  belt / hands'),(26,BLUE,'row 26  coat hem'),(31,RED,'row 30  BOOTS (last filled row)')],'prop_heg.png')
prop('concord_south.png',[(2,RED,'row 2  top of helmet'),(8,ORG,'row 8  brim / eye shadow'),(11,ORG,'row 11  chin  (head = 9 px)'),(20,BLUE,'row 20  hands'),(24,BLUE,'row 24  tunic ends, legs'),(31,RED,'row 30  BOOTS (last filled row)')],'prop_con.png')

# 2) heads close-up K=28 crop rows 0-12
for n,o in [('hegemony_south.png','head_heg.png'),('concord_south.png','head_con.png'),('hegemony_east.png','head_heg_e.png'),('concord_east.png','head_con_e.png')]:
    im=L(S+n).crop((6,0,26,13)); gridimg(im,26,labels=False).save(OUT+o)

# 3) 8 directions strip
DIRS=['south','south-east','east','north-east','north','north-west','west','south-west']
def strip(keys,out,K=6,lab=None,canvas=32):
    cw=canvas*K+16; rows=len(keys)
    C=Image.new('RGB',(cw*len(keys[0][1])+150,rows*(canvas*K+34)+10),BG); d=ImageDraw.Draw(C)
    for r,(title,files) in enumerate(keys):
        y=r*(canvas*K+34)+26
        d.text((6,y+canvas*K//2-10),title,fill=INK,font=F(15,True))
        for i,(f,l) in enumerate(files):
            x=150+i*cw
            d.rectangle([x,y,x+canvas*K-1,y+canvas*K-1],fill=(226,222,212))
            if f and os.path.exists(f):
                im=L(f); 
                if im.size[0]!=canvas:
                    o=Image.new('RGBA',(canvas,canvas)); o.alpha_composite(im,((canvas-im.size[0])//2,(canvas-im.size[1])//2)); im=o
                im=im.resize((canvas*K,canvas*K),Image.NEAREST); C.paste(im,(x,y),im)
            fy=y+ (30+ (canvas-32)//2 +1)*K
            d.line([x,fy,x+canvas*K-1,fy],fill=RED,width=1)
            if l: d.text((x,y-18),l,fill=MID,font=F(12))
    C.save(OUT+out)
strip([(f.capitalize(),[(S+f'{f}_{dd}.png',dd) for dd in DIRS]) for f in ['hegemony','concord']],'dirs.png',K=5)
ROLES=['','_officer','_machinegunner','_sniper','_medic','_sapper','_signaller','_runner','_cook','_chaplain','_pilot']
RN=['rifleman','officer','machine gunner','sniper','medic','sapper','signaller','runner','cook','chaplain','pilot']
strip([(f.capitalize(),[(S+f'{f}{r}_south.png',RN[i]) for i,r in enumerate(ROLES)]) for f in ['hegemony','concord']],'roles.png',K=4)

# 4) animation strips (64 canvas)
m=json.load(open(S+'manifest.json'))
def anim(key,a,dd,n=8):
    fr=m[key]['anims'][a][dd][:n]; return [(S+f,f'{i}') for i,f in enumerate(fr)]
strip([('walk S',anim('hegemony','walk','south')),('run E',anim('hegemony','run','east')),('crawl E',anim('concord','crawl','east')),('work E',anim('concord','work','east'))],'anims.png',K=3,canvas=64)

# 5) 64 canvas anchor diagram
im=L(S+m['hegemony']['anims']['walk']['south'][0]) if L(S+m['hegemony']['anims']['walk']['south'][0]).size==(64,64) else None
fr=[f for f in m['hegemony']['anims']['run']['east']]
im=L(S+fr[0])
g=gridimg(im,9,lines=[(47,RED,''),(16,(160,160,160),''),(48,(160,160,160),'')],cols=[(32,GRN),(16,(160,160,160)),(48,(160,160,160))],step=8)
g.save(OUT+'canvas64.png')
g=gridimg(L(S+'concord_south.png'),12,lines=[(31,RED,'')],cols=[(16,GRN)],step=4); g.save(OUT+'canvas32.png')

# 6) palette swatch
sw=60; C=Image.new('RGB',(8*(sw+70)+10,3*(sw+40)+10),BG); d=ImageDraw.Draw(C)
for i,h in enumerate(PAL):
    x=10+(i%8)*(sw+70); y=10+(i//8)*(sw+40)
    d.rectangle([x,y,x+sw,y+sw],fill='#'+h,outline=INK)
    d.text((x,y+sw+4),'#'+h,fill=INK,font=F(13)); 
C.save(OUT+'palette.png')
# palette kit files
open(KIT+'trench24.hex','w').write('\n'.join(PAL)+'\n')
with open(KIT+'trench24.gpl','w') as f:
    f.write('GIMP Palette\nName: Trench 24 (Mud & Iron)\nColumns: 8\n#\n')
    for h in PAL: r,g_,b=(int(h[i:i+2],16) for i in (0,2,4)); f.write(f'{r:3d} {g_:3d} {b:3d}\t#{h}\n')
pi=Image.new('RGB',(24,1)); [pi.putpixel((i,0),tuple(int(h[j:j+2],16) for j in (0,2,4))) for i,h in enumerate(PAL)]; pi.save(KIT+'trench24_palette_24x1.png')

# 7) templates + guide layers
for cv,foot in [(32,30),(64,46)]:
    Image.new('RGBA',(cv,cv)).save(KIT+f'template_{cv}x{cv}_empty.png')
    gd=Image.new('RGBA',(cv,cv)); dd=ImageDraw.Draw(gd)
    off=(cv-32)//2
    dd.rectangle([off+8,off+1,off+23,off+10],fill=(255,170,0,70))   # head zone
    dd.line([0,foot,cv-1,foot],fill=(255,0,0,200))                   # foot row
    dd.line([0,off,cv-1,off],fill=(0,120,255,120))                   # top of 30px figure (row off+0/1)
    dd.line([cv//2,0,cv//2,cv-1],fill=(0,170,80,120))               # centre
    gd.save(KIT+f'guide_{cv}x{cv}_overlay.png')
    gridimg(gd,10 if cv==64 else 16,step=8 if cv==64 else 4).save(OUT+f'guide{cv}.png')

# 8) scale chart (all 1:1 then x4)
items=[('Hegemony',S+'hegemony_south.png'),('Concord',S+'concord_south.png'),('dog sit',P+'dog_shepherd_sit.png'),('dog lie',P+'dog_collie_lie.png'),('grave',P+'grave.png'),('pillbox',P+'pillbox.png'),('truck',P+'truck_heg.png'),('cart + horse',P+'cart_horse.png'),('field gun',P+'gun_heg.png')]
K=4; ims=[L(f) for _,f in items]; H=max(i.size[1] for i in ims)
W=sum(i.size[0] for i in ims)+6*len(ims)
C=Image.new('RGB',(W*K+20,(H+14)*K+20),BG); d=ImageDraw.Draw(C)
x=10
base=10+H*K
for (n,_),im in zip(items,ims):
    b=im.getbbox(); 
    big=im.resize((im.size[0]*K,im.size[1]*K),Image.NEAREST)
    C.paste(big,(x,base-b[3]*K),big)
    d.text((x,base+8),n,fill=INK,font=F(14)); d.text((x,base+26),f'{im.size[0]}x{im.size[1]}',fill=MID,font=F(12))
    x+=(im.size[0]+6)*K
d.line([10,base,C.width-10,base],fill=RED,width=1)
# 1 m ruler
d.rectangle([C.width-16*K-110,14,C.width-110,20],fill=INK); d.text((C.width-16*K-110,24),'1 m = 16 px',fill=INK,font=F(13))
C.save(OUT+'scale.png')

# 9) reference sprites into kit
os.makedirs(KIT+'reference',exist_ok=True)
import shutil
for f in ['hegemony','concord']:
    for dd in DIRS: shutil.copy(S+f'{f}_{dd}.png',KIT+f'reference/{f}_{dd}.png')
    for r in ROLES[1:]: shutil.copy(S+f'{f}{r}_south.png',KIT+f'reference/{f}{r}_south.png')
for a,dd,k in [('walk','south','hegemony'),('run','east','hegemony'),('crawl','east','concord'),('work','east','concord')]:
    for i,f in enumerate(m[k]['anims'][a][dd]): shutil.copy(S+f,KIT+f'reference/{k}@{a}_{dd}_{i}.png')
shutil.copy(R+'docs/mockups/trench/0_now.png',OUT+'ingame.png')
print('ok')
