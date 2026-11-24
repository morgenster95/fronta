# 3D figurka vojáka ze spritů hry (voxely = pixely). Tvar: průnik siluety zepředu (south) a z boku (east/west); barvy stěn z pohledů
# south (předek), north (záda, zrcadleně), east/west (boky). Výstup: STL (jedna barva, k natírání) + OBJ/MTL s barvami (Bambu Studio / PrusaSlicer
# umí barvy z OBJ převést na vícebarevný tisk) + náhled. Podstavec: blátivá destička.
# python3 art/print/make_figure.py hegemony 2.0   (strana, mm na voxel)
import sys, struct, math
from PIL import Image, ImageDraw
R = '/home/user/fronta/'; OUT = R + 'art/print/'
side = sys.argv[1] if len(sys.argv) > 1 else 'hegemony'
MM = float(sys.argv[2]) if len(sys.argv) > 2 else 2.0
L = lambda d: Image.open(R + f'web/public/assets/soldiers/{side}_{d}.png').convert('RGBA')
S, N, E, Wst = L('south'), L('north'), L('east'), L('west')
n = 32
op = lambda im, u, z: 0 <= u < n and 0 <= z < n and im.getpixel((u, n - 1 - z))[3] > 128
col = lambda im, u, z: im.getpixel((u, n - 1 - z))[:3]
# souřadnice: x = sloupec ze south, y = hloubka (0 = předek), z = výška (0 = chodidla)
front = lambda x, z: op(S, x, z)
depth = lambda y, z: op(E, n - 1 - y, z) or op(Wst, y, z)
vox = {(x, y, z) for x in range(n) for y in range(n) for z in range(n) if front(x, z) and depth(y, z)}
# podstavec (2 vrstvy), o 2 voxely širší než postava
xs = [v[0] for v in vox]; ys = [v[1] for v in vox]
BASE = (58, 44, 32)
base = {(x, y, z) for x in range(min(xs) - 2, max(xs) + 3) for y in range(min(ys) - 3, max(ys) + 4) for z in (-2, -1)}
allv = vox | base

def near(im, u, z, du=(0, 1, -1, 2, -2, 3, -3)):  # průhledný pixel → nejbližší barva v řádku
    for d in du:
        if op(im, u + d, z): return col(im, u + d, z)
    return (60, 60, 60)
def face_color(v, nrm):
    x, y, z = v
    if v in base: return BASE if nrm != (0, 0, 1) else (74, 58, 40)
    if nrm == (0, -1, 0): return col(S, x, z)
    if nrm == (0, 1, 0): return near(N, n - 1 - x, z)
    if nrm == (1, 0, 0): return near(Wst, y, z)       # soldier's left side (+x), viewed from that side
    if nrm == (-1, 0, 0): return near(E, n - 1 - y, z)
    if nrm == (0, 0, 1): return near(S, x, z)
    return (30, 28, 25)
DIRS = [(1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)]
def quad(v, d):
    x, y, z = v; dx, dy, dz = d
    if dx: X = x + (dx > 0); return [(X, y, z), (X, y + 1, z), (X, y + 1, z + 1), (X, y, z + 1)][::(1 if dx > 0 else -1)]
    if dy: Y = y + (dy > 0); return [(x, Y, z), (x, Y, z + 1), (x + 1, Y, z + 1), (x + 1, Y, z)][::(1 if dy > 0 else -1)]
    Z = z + (dz > 0); return [(x, y, Z), (x + 1, y, Z), (x + 1, y + 1, Z), (x, y + 1, Z)][::(1 if dz > 0 else -1)]
faces = []
for v in allv:
    for d in DIRS:
        if (v[0] + d[0], v[1] + d[1], v[2] + d[2]) not in allv:
            faces.append((quad(v, d), d, face_color(v, d)))
P = lambda p: (p[0] * MM, p[1] * MM, (p[2] + 2) * MM)
name = f'{side}_soldier'
# STL (binary)
with open(OUT + name + '.stl', 'wb') as f:
    f.write(b'Mud and Iron figure'.ljust(80, b' ')); f.write(struct.pack('<I', len(faces) * 2))
    for q, d, c in faces:
        for tri in ((q[0], q[1], q[2]), (q[0], q[2], q[3])):
            f.write(struct.pack('<3f', *map(float, d)))
            for p in tri: f.write(struct.pack('<3f', *P(p)))
            f.write(b'\0\0')
# OBJ + MTL (barvy)
cols = sorted({c for _, _, c in faces})
with open(OUT + name + '.mtl', 'w') as m:
    for i, c in enumerate(cols): m.write(f'newmtl c{i}\nKd {c[0]/255:.4f} {c[1]/255:.4f} {c[2]/255:.4f}\n')
vid = {}; lines = [f'mtllib {name}.mtl']; fl = {}
for q, d, c in faces:
    ids = []
    for p in q:
        if p not in vid: vid[p] = len(vid) + 1; lines.append('v %.3f %.3f %.3f' % P(p))
        ids.append(vid[p])
    fl.setdefault(cols.index(c), []).append(ids)
for k, fs in fl.items():
    lines.append(f'usemtl c{k}'); lines += ['f ' + ' '.join(map(str, i)) for i in fs]
open(OUT + name + '.obj', 'w').write('\n'.join(lines) + '\n')
# náhled: izometrie ze 4 stran (malíř: od nejvzdálenějších stěn)
def render(yaw):
    K = 9; img = Image.new('RGB', (520, 620), (40, 38, 35)); dr = ImageDraw.Draw(img)
    ca, sa = math.cos(yaw), math.sin(yaw)
    def pr(p):
        x, y, z = p[0] - 16, p[1] - 16, p[2]
        rx, ry = x * ca - y * sa, x * sa + y * ca
        return (260 + rx * K, 470 - z * K - ry * K * 0.45), ry
    light = {(0, 0, 1): 1.0, (0, -1, 0): .9, (0, 1, 0): .9, (1, 0, 0): .75, (-1, 0, 0): .75, (0, 0, -1): .4}
    items = []
    for q, d, c in faces:
        nd = (d[0] * ca - d[1] * sa, d[0] * sa + d[1] * ca)
        if d[2] == 0 and nd[1] > 0.01: continue  # odvrácená
        if d[2] < 0: continue
        pts = [pr(p) for p in q]; depthv = sum(p[1] for p in pts) / 4 - sum(p[2] for p in q) * 0.001
        items.append((-depthv, [p[0] for p in pts], tuple(int(ch * light[d]) for ch in c)))
    for _, pts, c in sorted(items, key=lambda t: t[0], reverse=False): dr.polygon(pts, fill=c)
    return img
views = [render(a) for a in (0.35, -0.6, math.pi + 0.4, math.pi / 2 + 0.3)]
sheet = Image.new('RGB', (520 * 4, 620)); [sheet.paste(v, (i * 520, 0)) for i, v in enumerate(views)]
sheet.save(OUT + name + '_preview.png')
h = (max(v[2] for v in vox) + 3) * MM
print(f'{name}: {len(vox)} voxelů + podstavec, {len(faces)} stěn, {len(cols)} barev, výška {h:.0f} mm, šířka {(max(xs)-min(xs)+5)*MM:.0f} mm')
