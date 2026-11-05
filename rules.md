# rules.md
# STRICT CODING CONSTRAINTS FOR ANTIGRAVITY

## 1. Zero Hallucination UI & Demo State
- No raw "Lorem Ipsum". Use Tailwind skeleton pulses (`animate-pulse bg-white/20 rounded-xl h-24`) while loading.
- Implement an explicit `isDemoMode` toggle in the header. When enabled:
  - Bypasses camera input and uses a pre-encoded demo image of a heritage site.
  - Fixes GPS to `30.1337, 77.3000`.
  - Simulates the full network & AI pipeline so judges inside concrete basements experience the live app smoothly.

## 2. Leaflet Asset Fix (Mandatory)
Standard Leaflet marker icons break under Vite bundling. You must include this explicit fix in `MapContext.jsx`:
```javascript
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});