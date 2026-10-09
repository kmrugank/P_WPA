from PIL import Image, ImageDraw
from pathlib import Path
Path('public').mkdir(exist_ok=True)
for name,size in [('icon-192.png',192),('icon-512.png',512),('icon-maskable.png',512),('apple-touch-icon.png',180)]:
    s=size*3
    im=Image.new('RGB',(s,s),'#FFF9F6'); d=ImageDraw.Draw(im)
    # Broad safe area for maskable icons, a quiet crescent, and a single guiding star.
    d.ellipse((s*.22,s*.19,s*.78,s*.75),fill='#D98F9D')
    d.ellipse((s*.39,s*.12,s*.85,s*.58),fill='#FFF9F6')
    x,y=s*.65,s*.35;r=s*.044
    d.polygon([(x,y-r),(x+r*.35,y-r*.25),(x+r,y),(x+r*.35,y+r*.25),(x,y+r),(x-r*.35,y+r*.25),(x-r,y),(x-r*.35,y-r*.25)],fill='#533849')
    d.ellipse((s*.35,s*.81,s*.65,s*.825),fill='#D98F9D')
    im.resize((size,size),Image.Resampling.LANCZOS).save('public/'+name)
