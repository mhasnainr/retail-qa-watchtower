#!/usr/bin/env python3
"""Create exact, editable workflow diagrams; Pillow is needed only for the GIF.

Run from any directory: python3 tools/generate-doc-images.py
No screenshots, external images, AI image services or company assets are used.
"""
from pathlib import Path
from html import escape
import textwrap

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "images"
OUT.mkdir(parents=True, exist_ok=True)
BG, PANE, INK, MUTED = "#0b1425", "#14243b", "#f1f6ff", "#bbcade"
TEAL, BLUE, AMBER, LINE = "#69e0cb", "#a5c9ff", "#ffd397", "#3a506e"

def text(x, y, content, size=26, color=INK, weight=400, anchor="start"):
    return f'<text x="{x}" y="{y}" fill="{color}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}">{escape(content)}</text>'

def multiline(x, y, content, width=30, size=24, color=MUTED, spacing=33):
    return "".join(text(x,y+i*spacing,line,size,color) for i,line in enumerate(textwrap.wrap(content,width)))

def rect(x,y,w,h,fill=PANE,stroke=LINE,r=18):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'

def arrow(x1,y1,x2,y2,color=TEAL):
    return f'<path d="M{x1} {y1} L{x2} {y2}" fill="none" stroke="{color}" stroke-width="4" marker-end="url(#arrow)"/>'

def svg(name,title,description,w,h,body):
    document=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title desc">
<title id="title">{escape(title)}</title><desc id="desc">{escape(description)}</desc>
<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0L9 5L0 10" fill="none" stroke="{TEAL}" stroke-width="1.6"/></marker></defs>
<rect width="{w}" height="{h}" rx="22" fill="{BG}"/>
<g font-family="DejaVu Sans,Arial,sans-serif">{body}</g></svg>'''
    (OUT/name).write_text(document,encoding="utf-8")

steps=[
    ("01","WATCH","Observation Desk","Step through the illustrated event."),
    ("02","RECORD","Incident Register","Write facts, source, time and next action."),
    ("03","CHECK","Evidence & Cases","Compare the matching source records."),
    ("04","DECIDE","Review / history","Record the finding and next step."),
    ("05","REPORT","Daily Report","Save the reporting date and your name."),
    ("06","KEEP A COPY","Download / export","Save the handover and a JSON backup.")
]
body=text(40,65,"ONE CASE, FROM OBSERVATION TO HANDOVER",27,TEAL,700)
body+=text(40,108,"Use these six steps in the demo.",31,INK,700)
for i,(number,label,screen,explanation) in enumerate(steps):
    x=40+(i%2)*390;y=145+(i//2)*236
    body+=rect(x,y,360,210)
    body+=text(x+22,y+40,number,23,TEAL,700)+text(x+22,y+85,label,30,INK,700)
    body+=text(x+22,y+122,screen,22,BLUE,600)
    body+=multiline(x+22,y+157,explanation,28,21,spacing=29)
body+=text(40,903,"Illustrated training workflow · All data is fictional",21,MUTED)
svg("workflow-overview.svg","Six steps for a retail QA case","Watch the event; record facts; check source records; decide and document the result; prepare the daily report; keep a copy. The image is a diagram, not a screenshot.",840,940,body)

body=text(40,65,"START WITHOUT CODING",30,TEAL,700)
for i,(title,caption) in enumerate([
    ("1. DOWNLOAD","On GitHub: Code → Download ZIP. Or use the ZIP provided with the project."),
    ("2. EXTRACT","Right-click the ZIP and choose Extract All. Open the extracted project folder."),
    ("3. OPEN","Double-click START_HERE.html for the guide, or index.html for the demo.")
]):
    y=105+i*168;body+=rect(40,y,760,140)+text(64,y+44,title,29,INK,700)+multiline(64,y+82,caption,54,23,spacing=31)
    if i<2:body+=arrow(420,y+144,420,y+162)
body+=text(40,650,"Keep the extracted folder together. No signup is needed.",23,MUTED)
svg("quick-start.svg","Three steps to open the project","Download the ZIP, extract the whole folder, then open START_HERE.html for a clickable guide or index.html for the application. Do not open the files from inside the ZIP.",840,690,body)

body=text(40,65,"WHAT SHOULD HAPPEN NEXT?",30,TEAL,700)
body+=rect(40,105,760,125,fill="#1c3348",stroke=BLUE)
body+=text(420,155,"Compare the source records.",30,INK,700,anchor="middle")
body+=text(420,196,"Do they establish the same event and approval?",23,MUTED,anchor="middle")
branches=[
    ("MATCH + APPROVAL","Record the comparison and close with No deviation found.",TEAL),
    ("A RECORD IS MISSING","Keep the uncertainty clear. Request the record; escalate if needed.",AMBER),
    ("DETAILS DO NOT MATCH","Write the exact difference. Ask the supervisor for clarification.",BLUE)
]
body+='<path d="M65 230 V758" fill="none" stroke="'+TEAL+'" stroke-width="3"/>'
for i,(title,caption,color) in enumerate(branches):
    y=285+i*195;body+=arrow(65,y+82,94,y+82)
    body+=rect(100,y,700,165,stroke=color)
    body+=text(125,y+48,title,27,color,700)+multiline(125,y+90,caption,43,24,spacing=34)
body+=text(40,915,"These are alternative outcomes, not three required steps.",22,INK,600)
body+=text(40,952,"A missing record does not establish wrongdoing or intent.",22,MUTED)
svg("decision-guide.svg","Three alternative review outcomes","If records match and approval is established, document the comparison and close. If records are missing, request them and retain uncertainty. If details differ, record the mismatch and request clarification. These are alternative outcomes, not sequential stages.",840,990,body)

body=text(40,65,"WHAT GOES INTO THE DAILY HANDOVER?",27,TEAL,700)
body+=text(40,109,"First choose a day and a timezone, then save.",26,INK,700)
for y,title,desc in [
    (155,"INCLUDE: EVENTS FROM THAT DAY","All observations whose event time falls within the selected reporting day."),
    (335,"ALSO INCLUDE: OLDER OPEN CASES","Older cases that still need a decision or action. These are called carry-over cases.")
]:
    body+=rect(40,y,760,150,stroke=TEAL)+text(64,y+44,title,25,TEAL,700)+multiline(64,y+84,desc,51,24,spacing=33)
body+=text(420,330,"+",30,TEAL,700,anchor="middle")
body+=arrow(420,500,420,535)
body+=rect(40,550,760,135,fill="#1c3348",stroke=BLUE)+text(420,600,"COMPLETE HANDOVER",32,INK,700,anchor="middle")+text(420,646,"Every included case is listed. Nothing is cut off at eight.",23,MUTED,anchor="middle")
body+=rect(40,725,760,170,stroke=AMBER)+text(64,770,"LEFT OUT, WITH A COUNT SHOWN",25,AMBER,700)+multiline(64,810,"Older closed cases and future-dated events. The task list is a current snapshot, not a count of today's work.",52,23,spacing=32)
svg("report-scope.svg","How daily report scope works","The report combines all events in the selected day and timezone with older unresolved carry-over cases. Every included incident is listed. Older resolved and future events are excluded with a count. Administrative tasks are explicitly a current snapshot.",840,920,body)

# An animation of this exact workflow; no simulated application screens are used.
try:
    from PIL import Image,ImageDraw,ImageFont
except ImportError:
    raise SystemExit("SVGs generated. Install Pillow to also regenerate the GIF: python3 -m pip install Pillow")

def font(size,bold=False):
    name="DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    for folder in [Path('/usr/share/fonts/truetype/dejavu'),Path('/Library/Fonts'),Path('C:/Windows/Fonts')]:
        p=folder/name
        if p.exists():return ImageFont.truetype(str(p),size)
    return ImageFont.load_default(size=size)

frames=[]
for active,(_,label,screen,explanation) in enumerate(steps):
    im=Image.new('RGB',(840,640),BG);draw=ImageDraw.Draw(im)
    draw.text((34,24),'A CASE IN SIX STEPS',font=font(25,True),fill=TEAL)
    draw.text((34,70),f'{active+1}. {label}',font=font(38,True),fill=INK)
    draw.text((34,122),screen,font=font(25),fill=BLUE)
    for i,(n,l,s,caption) in enumerate(steps):
        x=34+(i%2)*392;y=182+(i//2)*120
        draw.rounded_rectangle((x,y,x+372,y+100),radius=14,fill='#244a49' if i==active else PANE,outline=TEAL if i==active else LINE,width=3)
        draw.text((x+16,y+14),n,font=font(20,True),fill=TEAL)
        draw.text((x+16,y+48),l,font=font(24,True),fill=INK)
    for n,line in enumerate(textwrap.wrap(explanation,48)):
        draw.text((34,558+n*32),line,font=font(25),fill=INK)
    draw.text((34,612),'Workflow diagram · Fictional training data',font=font(16),fill=MUTED)
    frames.append(im)
frames[0].save(OUT/'workflow-demo.gif',save_all=True,append_images=frames[1:],duration=[2100]*6,loop=0,optimize=True,disposal=2)
print('Created four accessible SVG diagrams and one six-frame workflow GIF in docs/images/.')
