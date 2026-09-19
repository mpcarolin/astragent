import math, json

def propagate(a,e,i,om,w,ma,epoch_jd,target_jd):
    """JPL approx_pos algorithm. Angles in degrees, a in AU."""
    d2r=math.pi/180.0
    # mean motion from Kepler's 3rd law (GM_sun in AU^3/day^2)
    k=0.01720209895          # Gaussian gravitational constant
    n=k/math.sqrt(a**3)      # rad/day
    dt=target_jd-epoch_jd
    M=ma*d2r+n*dt
    M=(M+math.pi)%(2*math.pi)-math.pi   # wrap to [-pi,pi]
    # Kepler solve, Newton-Raphson
    E=M+e*math.sin(M)
    for _ in range(50):
        dM=M-(E-e*math.sin(E))
        dE=dM/(1-e*math.cos(E))
        E+=dE
        if abs(dE)<1e-12: break
    # orbital plane
    xp=a*(math.cos(E)-e)
    yp=a*math.sqrt(1-e*e)*math.sin(E)
    # rotate to heliocentric ecliptic
    i_,om_,w_=i*d2r,om*d2r,w*d2r
    cw,sw=math.cos(w_),math.sin(w_)
    co,so=math.cos(om_),math.sin(om_)
    ci,si=math.cos(i_),math.sin(i_)
    x=(cw*co-sw*so*ci)*xp+(-sw*co-cw*so*ci)*yp
    y=(cw*so+sw*co*ci)*xp+(-sw*so+cw*co*ci)*yp
    z=(sw*si)*xp+(cw*si)*yp
    return x,y,z

# Icarus elements from SBDB (reduced precision, as fetched)
d=json.load(open('pha.json'))
row=next(r for r in d['data'] if 'Icarus' in r[0])
full_name,epoch,e,a,i,om,w,ma,H,diam=row
a,e,i,om,w,ma,epoch=map(float,(a,e,i,om,w,ma,epoch))
print(f"Icarus elements: a={a} e={e} i={i} om={om} w={w} ma={ma} epoch={epoch}")

target=2461301.5
x,y,z=propagate(a,e,i,om,w,ma,epoch,target)
gx,gy,gz=4.632983014443794E-02,-1.293523789136803E+00,-3.893248841550451E-02
err=math.dist((x,y,z),(gx,gy,gz))
print(f"\ncomputed : {x:.6f} {y:.6f} {z:.6f}")
print(f"horizons : {gx:.6f} {gy:.6f} {gz:.6f}")
print(f"error    : {err:.6f} AU  ({err*149597870.7:,.0f} km)")
r=math.dist((0,0,0),(gx,gy,gz))
print(f"heliocentric distance {r:.4f} AU -> relative error {err/r*100:.4f}%")
