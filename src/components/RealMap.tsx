import maplibregl, { type Map as MLMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** U.P. Town Center, Katipunan — the streets in the Figma map screenshot (C.P. Garcia, N. Perez, Pathwalk). */
export const MAP_CENTER: [number, number] = [121.0753, 14.6497];
export const MAP_ZOOM = 15.6;
const VIEW_W = 440;
const VIEW_H = 950;
/** OpenFreeMap: free OpenStreetMap vector tiles, no API key. */
const STYLE = 'https://tiles.openfreemap.org/styles/positron';

const worldSize = (zoom: number) => 512 * 2 ** zoom;

/**
 * A screen point of the initial view → [lng, lat] (Web Mercator).
 * Pins are placed with this so that, before any pan, each sits exactly where Figma draws it.
 */
export function screenToLngLat(x: number, y: number): [number, number] {
  const ws = worldSize(MAP_ZOOM);
  const cx = ((MAP_CENTER[0] + 180) / 360) * ws;
  const s = Math.sin((MAP_CENTER[1] * Math.PI) / 180);
  const cy = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * ws;
  const wx = cx + (x - VIEW_W / 2);
  const wy = cy + (y - VIEW_H / 2);
  const lng = (wx / ws) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * wy) / ws;
  return [lng, (180 / Math.PI) * Math.atan(Math.sinh(n))];
}

type Project = (lngLat: [number, number]) => { x: number; y: number };

/**
 * Interactive OpenStreetMap map (MapLibre GL). Children render as an overlay that is
 * re-laid-out on every camera move, so the Figma pin pills stay plain React elements.
 */
export function RealMap({
  children,
  focus,
  focusOffset = [-50, -175],
}: {
  children: (project: Project) => ReactNode;
  /** When set, the camera eases so this point sits above the listing sheet. */
  focus?: [number, number] | null;
  focusOffset?: [number, number];
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const [, setTick] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    const m = new maplibregl.Map({
      container: el.current!,
      style: STYLE,
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      minZoom: 12,
      maxZoom: 18,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: false,
    });
    m.touchZoomRotate.disableRotation();
    m.keyboard.disableRotation();
    m.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    const rerender = () => setTick((t) => t + 1);
    m.on('move', rerender);
    m.on('load', () => {
      // Keep the © OpenStreetMap credit as the compact (i) button rather than an open banner.
      el.current?.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
      rerender();
    });
    map.current = m;
    rerender();
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !focus) return;
    m.easeTo({ center: focus, offset: focusOffset, duration: first.current ? 0 : 650 });
    first.current = false;
  }, [focus?.[0], focus?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  const project: Project = (ll) => {
    if (map.current) return map.current.project(ll);
    // Before the map exists, use the initial-view math (same result as the first frame).
    const ws = worldSize(MAP_ZOOM);
    const toWorld = ([lng, lat]: [number, number]) => {
      const s = Math.sin((lat * Math.PI) / 180);
      return { x: ((lng + 180) / 360) * ws, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * ws };
    };
    const c = toWorld(MAP_CENTER);
    const p = toWorld(ll);
    return { x: p.x - c.x + VIEW_W / 2, y: p.y - c.y + VIEW_H / 2 };
  };

  return (
    <div className="realmap">
      <div ref={el} className="realmap__gl" />
      <div className="realmap__overlay">{children(project)}</div>
    </div>
  );
}
