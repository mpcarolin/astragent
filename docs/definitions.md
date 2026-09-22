# Definitions

Terms asked about during this project, answered once and kept here.

## Diffuse light

The portion of the Phong reflection model that scatters light equally in all directions
after striking a surface. It is what makes a matte object look lit from a direction — the
side facing the light is brighter, the far side dimmer. Diffuse is independent of the
viewer's position: you see the same brightness from any angle.

## Eccentric anomaly

An angle that locates a body on its orbit by way of the circle drawn around the ellipse.
Project the body perpendicular to the major axis up onto that circumscribing circle; the
angle from the centre of the ellipse to that projected point, measured from perihelion, is
the eccentric anomaly E. Unlike the true anomaly it is measured from the centre rather
than the focus, and unlike the mean anomaly it is a real geometric angle. It is what turns
the ellipse into a clean parametrisation: x = a(cos E - e), y = a*sqrt(1 - e^2)*sin E. It
is also the unknown Kepler's equation solves for, which is why `kepler` returns it and
`position` consumes it. Sweeping E in equal steps walks the ellipse in near-equal arcs,
which is why `ellipse` samples in E rather than in mean anomaly.

## Ecliptic north

The ecliptic is the plane of Earth's orbit around the Sun, which is also the path the
Sun appears to trace against the stars over a year. Every planet orbits within a few
degrees of that plane, which is why it is the natural floor of the solar system.
Ecliptic north is the direction perpendicular to that plane on the side from which the
planets are seen to orbit counter-clockwise. It is close to, but not the same as, Earth's
north: Earth's axis is tilted 23.4° from it, so ecliptic north points near the
constellation Draco rather than at Polaris. In this project's coordinates it is +z, with
+x pointing at the vernal equinox, the spot where the Sun crosses the celestial equator
heading north each March, and +y 90° east along the plane to complete a right-handed set.

## Julian date

A Julian date (JD) is a continuous count of days, with fractions, since noon Universal
Time on 1 January 4713 BC. Astronomers use it because it is one number with no months,
years, or leap days to step over: subtracting two Julian dates gives elapsed days
directly, which is what orbital equations consume. It starts at noon so one night of
observations never straddles a date boundary. The reference epoch J2000.0 is
JD 2451545.0, noon on 1 January 2000. Midnight UTC on 18 September 2026 is
JD 2461301.5. It is unrelated to the Julian calendar beyond sharing a namesake.

## Line loop

A Three.js object that draws a closed polyline through a list of vertices: `LineLoop`
connects each vertex to the next and then joins the last back to the first, so a ring
needs no duplicated closing vertex. It is the closed counterpart of `Line`, which leaves
the ends open, and it extends `Line` -- so an `instanceof Line` check cannot tell the two
apart. Line thickness is not controllable: the `linewidth` material property is ignored on
virtually every WebGL platform, a limitation of the underlying graphics API rather than a
Three.js bug, so line weight has to come from colour and opacity unless one moves to the
`Line2` family in `three/addons/lines/`.

## Mean anomaly

The angle a body would have travelled from perihelion if it moved at a constant rate
rather than at its real, varying speed. It is a fiction with a purpose: it advances
uniformly in time, so it is the one orbital angle that can be computed from a date by
simple arithmetic. M = n(t - T), with n the mean motion. Real bodies do not move
uniformly -- they sweep equal areas in equal times, so they run fast at perihelion and
slow at aphelion -- so the mean anomaly must be converted to the eccentric anomaly before
it locates anything, via Kepler's equation M = E - e*sin E. That conversion has no closed
form and is solved numerically, which is the whole job of `kepler`. Sampling M uniformly
to draw an orbit bunches points at aphelion, which is why `ellipse` sweeps
[eccentric anomaly](#eccentric-anomaly) instead.

## Phong material

A Three.js shading material named after Bui Tuong Phong, who developed the Phong
reflection model in 1973. It calculates surface appearance by combining three light
components: ambient (background illumination), diffuse (matte scattered light), and
specular (shiny highlights). Phong requires scene lights to be visible. It is the
middle ground between `MeshBasicMaterial` (no lighting cost) and `MeshStandardMaterial`
(physically accurate, more expensive).

## Specular light

The portion of the Phong reflection model that creates shiny highlights on a surface.
Unlike diffuse light, specular brightness depends on the viewer's position — you only
see the highlight when looking at the angle where light bounces directly toward you,
like sunlight reflecting off a mirror or polished metal.
