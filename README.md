# Exposure Triangle Explorer

An interactive visualization of the photographic exposure triangle. Pick a
scene, then drag inside the triangle to redistribute a *correct* exposure
across aperture, shutter speed, and ISO: the image lightness stays correct
everywhere, while the trade-off between background blur, motion blur, and noise
changes.

**Live:** https://exposure-triangle.arnebaeyens.com

## How it works

- Each scene fixes the illuminance (its EV at ISO 100). The triangle is a
  ternary plot — each **edge is an axis** for one setting, with real f-stop /
  shutter / ISO ticks.
- Every point in the triangle is a correctly-exposed combination: you freely
  choose any two settings and the third follows, because correct exposure
  removes one degree of freedom. The marker snaps to the nearest valid
  full-stop combination.
- The preview is composited in **linear light** (proper sRGB transfer
  function) with energy-conserving bokeh, motion blur as a time-coverage
  average, and **physical per-pixel shot noise** (σ ∝ √value).
- Image-level **noise** depends on sensor area and ISO, *not* on megapixels
  (downsampling averages pixel noise back out); the **photons/pixel** readout
  does depend on resolution.

A bright scene gives a small, comfortable triangle (little blur or noise
anywhere); a dim scene forces blur or noise no matter where you click — light
is what buys you out of the trade-off.

## Running locally

It is a single self-contained file with no dependencies — open `index.html` in
a browser, or serve it:

```bash
python3 -m http.server
# then visit http://localhost:8000
```

## Hosting

Served via GitHub Pages from the repository root (`index.html`), with the
custom domain set in the `CNAME` file.

