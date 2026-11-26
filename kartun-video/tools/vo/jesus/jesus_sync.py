import json, re, sys
D, PROJ = sys.argv[1], sys.argv[2]
FPS=30
lay=json.load(open(f'{D}/layout.json')); starts=lay['starts']; TOTAL=lay['total']
ts=open(f'{PROJ}/src/vutuvuti/jesus/timeline.ts').read()
block=ts[ts.index('export const CAPTIONS'):]
block=block[:block.index('};')]
caps={}
for m in re.finditer(r'(?:"([0-9A-Z]+)"|C):\s*\[(.*?)\]', block):
    if m.group(1): caps[m.group(1)]=re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(2))
words=[w for seg in json.load(open(f'{D}/vo.json')) for w in seg['words']]
order=list(starts.keys())
def norm(s): return re.sub(r'[^a-z0-9]','',s.lower())
alias={'tiga':'3','empatsatu':'41','60':'60','28':'28','ke28':'28','27':'27','73':'73','61':'61','duabelas':'12','145':'145','barsa':'bars','suares':'suar','jisus':'jis','msn':'','lebihsedikit':'lebih','kuranganas':'kurang','diba wah':'di','dibawah':'bawah','rafinya':'rafi','kunde':'kund','vutbaler':'fut','bro':'bro','nyocol':'nyo','ditepis':'di','dicadangin':'dicad','starter':'start'}
out=[]
for i,sid in enumerate(order):
    a=starts[sid]/FPS; b=(starts[order[i+1]] if i+1<len(order) else TOTAL)/FPS
    ws=[w for w in words if a-0.1<=w['s']<b]
    toks=caps.get(sid,[])
    times=[]; j=0
    for tk in toks:
        n=norm(re.sub(r'[*+]','',tk))
        key=alias.get(n, n[:4])
        hit=None
        for k in range(j,len(ws)):
            wn=norm(ws[k]['w'])
            if key and (wn.startswith(key) or (len(key)>=3 and key in wn)):
                hit=k; break
        if hit is not None: times.append(ws[hit]['s']); j=hit+1
        else: times.append(None)
    # fill gaps evenly
    for k,tv in enumerate(times):
        if tv is None:
            prev=next((times[q] for q in range(k-1,-1,-1) if times[q] is not None), a+0.1)
            nxt=next((times[q] for q in range(k+1,len(times)) if times[q] is not None), b-0.3)
            gap=[q for q in range(k,len(times)) if times[q] is None]
            times[k]=prev+(nxt-prev)*(1/(len(gap)+1)) if times[k-1] is None or k==0 else prev+(nxt-prev)/(len(gap)+1)
    for k,tk in enumerate(toks):
        f0=int(round(times[k]*FPS))
        f1=int(round(times[k+1]*FPS)) if k+1<len(toks) else int(round(b*FPS))-2
        out.append({'text':tk,'from':f0,'to':max(f0+6,f1)})
    print(sid, [(t,round(x,2)) for t,x in zip(toks,times)])
src=f'''// Generated from the synthetic VO (public/jesus/vo.mp3) by tools/vo/jesus_sync.py.
// Shot starts sit just before each sentence; caption words follow the word timestamps.

import type {{ CaptionWord, ShotId }} from "./timeline";

export const SYNC_STARTS: Partial<Record<ShotId, number>> = {json.dumps(starts)};
export const SYNC_WORDS: CaptionWord[] | null = {json.dumps(out, ensure_ascii=False)};
export const SYNC_TOTAL: number | null = {TOTAL};
'''
open(f'{PROJ}/src/vutuvuti/jesus/sync.ts','w').write(src)
