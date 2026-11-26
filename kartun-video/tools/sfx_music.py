import numpy as np, wave, sys, os
SR=44100
out=sys.argv[1]
def save(name, x):
    x=np.clip(x,-1,1)
    if x.ndim==1: x=np.stack([x,x],1)
    w=wave.open(os.path.join(out,name),'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x*32767).astype(np.int16).tobytes()); w.close()
rng=np.random.default_rng(7)
def T(d): return np.arange(int(d*SR))/SR
def env(t,a,d): return np.minimum(1,t/a)*np.exp(-t/d)
sfx=os.path.join(out,'sfx'); os.makedirs(sfx,exist_ok=True)
# ding
t=T(1.2); x=(np.sin(2*np.pi*1568*t)+0.5*np.sin(2*np.pi*3136*t)+0.25*np.sin(2*np.pi*4704*t))*env(t,0.002,0.35)*0.5
save('sfx/ding.wav',x)
# thunk (wood)
t=T(0.4); x=(np.sin(2*np.pi*(180-120*t)*t)*env(t,0.001,0.06)+rng.normal(0,1,len(t))*env(t,0.001,0.015)*0.4)*0.8
save('sfx/thunk.wav',x)
# pop
t=T(0.25); x=np.sin(2*np.pi*(900*np.exp(-t*30)+300)*t)*env(t,0.001,0.04)*0.6
save('sfx/pop.wav',x)
# net ripple: filtered noise swish
t=T(0.8); n=rng.normal(0,1,len(t)); n=np.convolve(n,np.ones(12)/12,'same'); x=n*env(t,0.02,0.18)*(1+0.5*np.sin(2*np.pi*14*t))*0.9
save('sfx/net.wav',x)
# chalk scratching: noisy bursts
t=T(1.1); n=rng.normal(0,1,len(t)); hp=n-np.convolve(n,np.ones(6)/6,'same')
gate=(np.sin(2*np.pi*9*t)>-0.2).astype(float); gate=np.convolve(gate,np.ones(400)/400,'same')
x=hp*gate*np.minimum(1,t/0.03)*np.minimum(1,(1.1-t)/0.1)*0.35
save('sfx/chalk.wav',x)
# paper tear: crackly noise rising
t=T(0.6); n=rng.normal(0,1,len(t)); cr=(rng.random(len(t))<0.02)*rng.normal(0,1,len(t))*3
x=(n*0.4+cr)*np.minimum(1,t/0.05)*np.exp(-np.maximum(0,t-0.35)/0.08)*0.45
x=x-np.convolve(x,np.ones(5)/5,'same')
save('sfx/tear.wav',x*1.6)
# tick
t=T(0.08); x=np.sin(2*np.pi*2400*t)*env(t,0.0005,0.008)*0.6+rng.normal(0,1,len(t))*env(t,0.0005,0.003)*0.3
save('sfx/tick.wav',x)
# dug: punchy low boom
t=T(0.5); x=np.sin(2*np.pi*(110*np.exp(-t*6)+45)*t)*env(t,0.002,0.14)*1.0+rng.normal(0,1,len(t))*env(t,0.001,0.01)*0.3
save('sfx/dug.wav',x)

# ---------- Music: original low-key samba groove, ~104 BPM, 54 s ----------
bpm=104; beat=60/bpm; dur=72.0; N=int(dur*SR); mix=np.zeros((N,2))
def add(sig, start, pan=0.0, g=1.0):
    i=int(start*SR); j=min(N,i+len(sig))
    if i>=N: return
    s=sig[:j-i]*g
    mix[i:j,0]+=s*(1-max(0,pan)); mix[i:j,1]+=s*(1+min(0,pan))
def surdo(f0=70):
    t=T(0.6); return np.sin(2*np.pi*(f0+40*np.exp(-t*25))*t)*env(t,0.002,0.22)
def tamborim():
    t=T(0.08); return (np.sin(2*np.pi*1100*t)*0.6+rng.normal(0,1,len(t))*0.4)*env(t,0.0005,0.02)
def shaker():
    t=T(0.06); n=rng.normal(0,1,len(t)); n=n-np.convolve(n,np.ones(3)/3,'same'); return n*env(t,0.004,0.015)
def pluck(freq, d=0.5):
    # Karplus-Strong guitar-ish pluck
    n=int(SR/freq); buf=rng.uniform(-1,1,n); outp=np.zeros(int(d*SR))
    for k in range(len(outp)):
        outp[k]=buf[k%n]; buf[k%n]=0.5*(buf[k%n]+buf[(k+1)%n])*0.996
    return outp*np.minimum(1,T(d)/0.003)
def bass(freq,d):
    t=T(d); return (np.sin(2*np.pi*freq*t)+0.3*np.sin(2*np.pi*2*freq*t))*env(t,0.005,d*0.6)
notes={'D':146.83,'E':164.81,'F#':185.0,'G':196.0,'A':220.0,'B':246.94,'C#':277.18,'D5':293.66}
prog=[('D',['D','F#','A']),('B',['B','D5','F#']),('E',['E','G','B']),('A',['A','C#','E'])]
bars=int(dur/(beat*4))+1
for b in range(bars):
    t0=b*beat*4
    root,ch=prog[(b//2)%4]
    # surdo on 1 and 3 (low), answer on 2 and 4
    for q,f0 in [(0,62),(1,74),(2,62),(3,74)]:
        add(surdo(f0),t0+q*beat,0,0.55 if q%2 else 0.7)
    # tamborim syncopation (16ths pattern)
    for s16 in [0,3,6,8,10,13,14]:
        add(tamborim(),t0+s16*beat/4,0.35,0.22)
    # shaker every 16th, accent on offbeats
    for s16 in range(16):
        add(shaker(),t0+s16*beat/4,-0.3,0.12 if s16%2 else 0.07)
    # bass: root on 1, fifth-ish pickup
    rf=notes[root]/2
    add(bass(rf,beat*1.4),t0,0,0.32); add(bass(rf*1.5,beat*0.5),t0+beat*1.5,0,0.22); add(bass(rf,beat*0.9),t0+beat*2,0,0.28); add(bass(rf*1.5,beat*0.5),t0+beat*3.5,0,0.22)
    # guitar comping, bossa-like syncopation
    if b>=1:
        for s16 in [0,3,6,10,12]:
            for i,n_ in enumerate(ch):
                add(pluck(notes[n_]*(2 if n_!='D5' else 1),0.45),t0+s16*beat/4+i*0.008,0.15*(i-1),0.09)
# light reverb (simple feedback delays)
for dl,g in [(0.031,0.25),(0.047,0.2),(0.071,0.15)]:
    d=int(dl*SR); mix[d:]+=mix[:-d]*g
mix/=np.max(np.abs(mix))*1.15
fo=int(1.0*SR); mix[-fo:]*=np.linspace(1,0,fo)[:,None]
w=wave.open(os.path.join(out,'jesus','music.wav'),'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(mix,-1,1)*32767).astype(np.int16).tobytes()); w.close()
print('ok')
