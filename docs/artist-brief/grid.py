import sys
from PIL import Image, ImageDraw, ImageFont
def grid(path,out,K=20,marks=()):
    im=Image.open(path).convert('RGBA'); w,h=im.size
    pad=28
    G=Image.new('RGBA',(w*K+pad*2,h*K+pad*2),(238,234,224,255))
    # checker
    d=ImageDraw.Draw(G)
    for y in range(h):
        for x in range(w):
            c=(225,221,210,255) if (x+y)%2 else (240,236,226,255)
            d.rectangle([pad+x*K,pad+y*K,pad+x*K+K-1,pad+y*K+K-1],fill=c)
    G.alpha_composite(im.resize((w*K,h*K),Image.NEAREST),(pad,pad))
    d=ImageDraw.Draw(G)
    f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',11)
    for i in range(w+1):
        col=(120,120,120,255) if i%8 else (40,40,40,255)
        d.line([pad+i*K,pad,pad+i*K,pad+h*K],fill=col,width=1)
    for i in range(h+1):
        col=(120,120,120,255) if i%8 else (40,40,40,255)
        d.line([pad,pad+i*K,pad+w*K,pad+i*K],fill=col,width=1)
    for i in range(0,w,2 if w<=32 else 4):
        d.text((pad+i*K+3,8),str(i),fill=(40,40,40),font=f)
    for i in range(0,h,2 if h<=32 else 4):
        d.text((4,pad+i*K+4),str(i),fill=(40,40,40),font=f)
    for (y,col) in marks:
        d.line([pad-6,pad+y*K,pad+w*K+6,pad+y*K],fill=col,width=3)
    G.convert('RGB').save(out)
if __name__=='__main__':
    grid(sys.argv[1],sys.argv[2])
