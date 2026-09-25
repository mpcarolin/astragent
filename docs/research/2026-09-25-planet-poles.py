"""Planet north poles as unit vectors in the ecliptic J2000 frame.

Source: IAU WGCCRE 2015 report (Archinal et al. 2018, CMDA 130:22), as carried in
NAIF's pck00011.tpc. Each pole's right ascension and declination is evaluated at
J2000 (T = 0, so every linear rate drops out), periodic terms included, then
rotated from the ICRF equator into the ecliptic with the obliquity Horizons uses.

These are IAU north poles, not spin poles: for Venus and Uranus the two point
opposite ways. Output feeds `pole` in src/scene/appearance.ts.
"""
from math import radians, degrees, sin, cos, acos

EPS = radians(84381.448 / 3600)  # obliquity of the ecliptic at J2000

def sin_terms(terms): return sum(a*sin(radians(angle)) for a, angle in terms)
def cos_terms(terms): return sum(a*cos(radians(angle)) for a, angle in terms)

# Periodic terms at T = 0: (coefficient, constant part of the angle), degrees.
# Mars: BODY499_NUT_PREC_RA/DEC against BODY4_NUT_PREC_ANGLES blocks 3 and 4.
mars_ra  = [(0.000068,198.991226),(0.000238,226.292679),(0.000052,249.663391),(0.000009,266.183510),(0.419057,79.398797)]
mars_dec = [(0.000051,122.433576),(0.000141,43.058401),(0.000031,57.663379),(0.000005,79.476401),(1.591274,166.325722)]
# Jupiter: BODY599_NUT_PREC_RA/DEC against BODY5_NUT_PREC_ANGLES 11-15 (Ja..Je).
jup_ra   = [(0.000117,99.360714),(0.000938,175.895369),(0.001432,300.323162),(0.000030,114.012305),(0.002150,49.511251)]
jup_dec  = [(0.000050,99.360714),(0.000404,175.895369),(0.000617,300.323162),(-0.000013,114.012305),(0.000926,49.511251)]
# Neptune: BODY899_NUT_PREC_RA/DEC against N = 357.85 + 52.316 T.
N = 357.85

# (right ascension, declination) of the IAU north pole at J2000, degrees.
pole_radec = {
  "mercury": (281.0103, 61.4155),
  "venus":   (272.76, 67.16),
  "earth":   (0.0, 90.0),
  "mars":    (317.269202 + sin_terms(mars_ra), 54.432516 + cos_terms(mars_dec)),
  "jupiter": (268.056595 + sin_terms(jup_ra), 64.495303 + cos_terms(jup_dec)),
  "saturn":  (40.589, 83.537),
  "uranus":  (257.311, -15.175),
  "neptune": (299.36 + 0.70*sin(radians(N)), 43.46 - 0.51*cos(radians(N))),
}

def ecliptic(ra, dec):
  a, d = radians(ra), radians(dec)
  x, y, z = cos(d)*cos(a), cos(d)*sin(a), sin(d)
  return (x, y*cos(EPS) + z*sin(EPS), -y*sin(EPS) + z*cos(EPS))

# Cross-check: angle from each pole to its orbit normal against NASA's Planetary
# Fact Sheet obliquity. (inclination, ascending node) at J2000 from
# src/data/jpl/planets.ts; Venus and Uranus expect 180 - NASA (IAU north).
orbit = {"mercury": (7.00559432, 48.33961819), "venus": (3.39777545, 76.67261496),
  "earth": (-0.00054346, -5.11260389), "mars": (1.85181869, 49.71320984),
  "jupiter": (1.29861416, 100.29282654), "saturn": (2.49424102, 113.63998702),
  "uranus": (0.77298127, 73.96250215), "neptune": (1.77005520, 131.78635853)}
nasa = {"mercury": 0.034, "venus": 180 - 177.36, "earth": 23.44, "mars": 25.19,
        "jupiter": 3.13, "saturn": 26.73, "uranus": 180 - 97.77, "neptune": 28.32}

print(f"{'id':8s} {'x':>10s} {'y':>10s} {'z':>10s}   tilt    nasa")
for k, (ra, dec) in pole_radec.items():
  p = ecliptic(ra, dec)
  i, O = radians(orbit[k][0]), radians(orbit[k][1])
  n = (sin(i)*sin(O), -sin(i)*cos(O), cos(i))
  tilt = degrees(acos(sum(u*v for u, v in zip(p, n))))
  print(f"{k:8s} {p[0]:+10.6f} {p[1]:+10.6f} {p[2]:+10.6f}  {tilt:6.3f}  {nasa[k]:6.3f}")
