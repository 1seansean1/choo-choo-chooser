/* scenes.jsx — abstract layered-landscape placeholders standing in for photos.
   Deterministic per `type`. Not photographs — drop real imagery in later. */

const SCENE_DEFS = {
  tunnel: {
    sky: ["#F4C8A0", "#E89A6B"], sun: { x: 300, y: 70, r: 30, c: "#FBE3B8" },
    layers: [
      { c: "#7E5E78", p: [[0,150],[80,120],[160,140],[240,108],[330,135],[400,118],[400,280],[0,280]] },
      { c: "#3E3550", p: [[0,200],[110,150],[210,185],[300,150],[400,180],[400,280],[0,280]] },
    ],
    tunnel: { c: "#15101C", x: 175, w: 90 },
  },
  canyon: {
    sky: ["#BFE0F0", "#7FB6D6"], sun: null,
    layers: [
      { c: "#B5613A", p: [[0,40],[60,70],[60,280],[0,280]] },
      { c: "#B5613A", p: [[400,40],[330,80],[330,280],[400,280]] },
      { c: "#8C432A", p: [[0,120],[70,150],[70,280],[0,280]] },
      { c: "#8C432A", p: [[400,110],[320,150],[320,280],[400,280]] },
    ],
    river: { c: "#5E93AE", y: 232 },
  },
  mesa: {
    sky: ["#F3D9B0", "#E2A86C"], sun: { x: 90, y: 64, r: 26, c: "#FBEAC4" },
    layers: [
      { c: "#C97B4E", p: [[0,170],[120,168],[120,120],[230,120],[230,168],[400,166],[400,280],[0,280]] },
      { c: "#A04E2E", p: [[0,210],[90,208],[150,178],[260,178],[300,210],[400,206],[400,280],[0,280]] },
    ],
  },
  plains: {
    sky: ["#F6D7A8", "#E59A5E"], sun: { x: 320, y: 86, r: 34, c: "#FCEAC0" },
    layers: [
      { c: "#9A8650", p: [[0,196],[400,182],[400,280],[0,280]] },
      { c: "#6E6135", p: [[0,232],[400,224],[400,280],[0,280]] },
    ],
  },
  river: {
    sky: ["#CDE6EE", "#94C2D6"], sun: null,
    layers: [
      { c: "#7C9A6A", p: [[0,170],[150,160],[280,168],[400,158],[400,200],[0,200]] },
    ],
    river: { c: "#6FA0BC", y: 200 },
  },
  city: {
    sky: ["#9FB8D6", "#5E7BA6"], sun: null,
    skyline: true,
  },
  snow: {
    sky: ["#D8EAF4", "#A9CCE2"], sun: null,
    layers: [
      { c: "#9FB6C9", p: [[0,150],[90,80],[150,120],[230,60],[320,110],[400,80],[400,280],[0,280]] },
      { c: "#E9F1F6", p: [[0,150],[90,80],[110,95],[150,120],[200,82],[230,60],[270,95],[320,110],[360,92],[400,80],[400,140],[0,150]], snow: true },
      { c: "#6E8597", p: [[0,200],[120,150],[240,195],[340,160],[400,185],[400,280],[0,280]] },
    ],
  },
  resort: {
    sky: ["#CFE6F2", "#9CC6E0"], sun: { x: 70, y: 60, r: 24, c: "#FBF4DC" },
    layers: [
      { c: "#A8BECE", p: [[0,140],[120,70],[220,110],[320,64],[400,100],[400,280],[0,280]] },
      { c: "#EDF3F8", p: [[0,150],[120,70],[170,100],[220,110],[270,82],[320,64],[360,92],[400,100],[400,160],[0,170]], snow: true },
    ],
    slopes: true,
  },
  airport: {
    sky: ["#E3D3F0", "#B79AD2"], sun: { x: 310, y: 70, r: 28, c: "#F6E6C0" },
    layers: [
      { c: "#8D8068", p: [[0,210],[400,202],[400,280],[0,280]] },
    ],
    tents: true,
  },
  town: {
    sky: ["#E8DDC0", "#CBB98C"], sun: null,
    layers: [
      { c: "#9CB29B", p: [[0,140],[110,95],[200,125],[300,90],[400,120],[400,170],[0,170]] },
    ],
    town: true,
  },
  alps: {
    sky: ["#CFE6F2", "#9CC6E0"], sun: null,
    layers: [
      { c: "#8DA2B5", p: [[0,150],[70,55],[130,120],[200,38],[280,110],[350,50],[400,100],[400,280],[0,280]] },
      { c: "#EDF3F8", p: [[0,150],[70,55],[95,86],[130,120],[170,68],[200,38],[240,80],[280,110],[320,76],[350,50],[380,82],[400,100],[400,150],[0,150]], snow: true },
      { c: "#5E7A52", p: [[0,205],[120,165],[240,205],[340,168],[400,195],[400,280],[0,280]] },
    ],
  },
  viaduct: {
    sky: ["#CFE2EE", "#9DBFD6"], sun: null,
    layers: [
      { c: "#7E9A6E", p: [[0,150],[120,108],[260,140],[400,112],[400,280],[0,280]] },
    ],
    arches: { c: "#B7A684", topY: 118, baseY: 232, n: 6 },
  },
  fjord: {
    sky: ["#CFE6F2", "#A6CADD"], sun: null,
    layers: [
      { c: "#3C5A46", p: [[0,30],[100,95],[100,280],[0,280]] },
      { c: "#34503E", p: [[400,20],[300,100],[300,280],[400,280]] },
      { c: "#5E7A52", p: [[0,150],[100,95],[140,200],[0,220]] },
      { c: "#3E6E86", p: [[0,218],[400,210],[400,280],[0,280]] },
    ],
  },
  forest: {
    sky: ["#D7E4D0", "#A9C29A"], sun: null,
    layers: [
      { c: "#5E7A52", p: [[0,150],[120,108],[260,142],[400,108],[400,280],[0,280]] },
      { c: "#3E5A3A", p: [[0,200],[140,165],[280,202],[400,168],[400,280],[0,280]] },
    ],
    trees: { style: "conifer", c: "#2C4630" },
  },
  coast: {
    sky: ["#F3D9B0", "#E2A86C"], sun: { x: 300, y: 78, r: 30, c: "#FBEAC4" },
    layers: [
      { c: "#3E6E86", p: [[0,168],[400,158],[400,280],[0,280]] },
      { c: "#6E5A44", p: [[0,158],[90,148],[150,188],[150,280],[0,280]] },
    ],
  },
  fuji: {
    sky: ["#F3CBD6", "#C9A0C0"], sun: { x: 320, y: 66, r: 26, c: "#FBE3E8" },
    layers: [{ c: "#6E8060", p: [[0,238],[400,230],[400,280],[0,280]] }],
    cone: { c: "#5E6E8C", snowC: "#EDF3F8", baseY: 240, peakX: 200, peakY: 66, halfW: 152 },
  },
  plateau: {
    sky: ["#CFE0EE", "#9AB8D0"], sun: null,
    layers: [
      { c: "#A7B8C4", p: [[0,150],[80,118],[150,145],[230,116],[320,142],[400,120],[400,172],[0,172]] },
      { c: "#B89A6A", p: [[0,182],[400,178],[400,280],[0,280]] },
      { c: "#9C7E50", p: [[0,224],[400,218],[400,280],[0,280]] },
    ],
  },
  desert: {
    sky: ["#F3D2A0", "#E09B5C"], sun: { x: 92, y: 70, r: 30, c: "#FBE6BE" },
    layers: [
      { c: "#D08A50", p: [[0,182],[120,168],[240,184],[360,168],[400,176],[400,280],[0,280]] },
      { c: "#A85E32", p: [[0,222],[140,206],[280,224],[400,210],[400,280],[0,280]] },
    ],
  },
  savanna: {
    sky: ["#F1D79E", "#D99A4E"], sun: { x: 300, y: 80, r: 32, c: "#FBE6B8" },
    layers: [
      { c: "#B79A4E", p: [[0,186],[400,178],[400,280],[0,280]] },
      { c: "#8A6E32", p: [[0,226],[400,220],[400,280],[0,280]] },
    ],
    trees: { style: "acacia", c: "#3E3522" },
  },
  dome: { interior: true, sky: ["#CFE6F2", "#8FB8D4"], warm: "#3A2C22", frame: "#1E150F",
    layers: [{ c: "#6E8597", p: [[0,120],[100,70],[200,105],[300,68],[400,100],[400,160],[0,160]] }] },
  meal: { interior: true, sky: ["#F4D7A8", "#E1A36A"], warm: "#3A2C22", frame: "#1E150F", plate: true,
    layers: [{ c: "#8C7B58", p: [[0,130],[400,118],[400,160],[0,160]] }] },
};

function ridgePath(points) {
  return points.map((p, i) => (i === 0 ? "M" : "L") + p[0] + "," + p[1]).join(" ") + " Z";
}

function Scene({ type, className, vignette = true }) {
  const d = SCENE_DEFS[type] || SCENE_DEFS.plains;
  const gid = "g_" + type;
  const W = 400, H = 280;

  // skyline (city) buildings
  const buildings = [];
  if (d.skyline) {
    let x = 0;
    const hs = [120, 70, 150, 95, 175, 60, 200, 110, 140, 80, 160, 100];
    let i = 0;
    while (x < W) {
      const w = 26 + ((i * 13) % 22);
      const top = hs[i % hs.length];
      buildings.push(<rect key={"b"+i} x={x} y={top} width={w - 3} height={H - top} fill={i % 2 ? "#465E84" : "#3A4E70"} />);
      x += w; i++;
    }
  }

  return (
    <svg className={"scene " + (className || "")} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={d.sky[0]} />
          <stop offset="1" stopColor={d.sky[1]} />
        </linearGradient>
        <radialGradient id={gid + "_v"} cx="0.5" cy="0.42" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </radialGradient>
        <clipPath id={gid + "_win"}><path d="M40,250 L40,90 Q200,30 360,90 L360,250 Z" /></clipPath>
      </defs>

      {!d.interior && <>
        <rect x="0" y="0" width={W} height={H} fill={`url(#${gid})`} />
        {d.sun && <circle cx={d.sun.x} cy={d.sun.y} r={d.sun.r} fill={d.sun.c} opacity="0.92" />}
        {buildings}
        {(d.layers || []).map((L, i) => (
          <g key={i}>
            <path d={ridgePath(L.p)} fill={L.c} />
          </g>
        ))}
        {d.river && <rect x="0" y={d.river.y} width={W} height={H - d.river.y} fill={d.river.c} opacity="0.85" />}
        {d.tunnel && <path d={`M${d.tunnel.x},280 L${d.tunnel.x},${190} Q${d.tunnel.x + d.tunnel.w/2},150 ${d.tunnel.x + d.tunnel.w},190 L${d.tunnel.x + d.tunnel.w},280 Z`} fill={d.tunnel.c} />}
        {d.slopes && <g stroke="#C9DCE8" strokeWidth="2" opacity="0.7">
          <path d="M120,72 L150,260" fill="none" /><path d="M210,108 L235,260" fill="none" /><path d="M310,66 L330,260" fill="none" />
        </g>}
        {d.tents && <g fill="#F0E9DA" stroke="#C9BFA8" strokeWidth="1.5">
          <path d="M60,210 Q110,150 160,210 Z" /><path d="M150,210 Q200,150 250,210 Z" /><path d="M240,210 Q290,150 340,210 Z" /><path d="M330,210 Q370,160 400,210 Z" />
        </g>}
        {d.town && <g fill="#6E5A48">
          <rect x="60" y="135" width="40" height="35" /><rect x="110" y="120" width="30" height="50" /><rect x="160" y="142" width="46" height="28" /><rect x="230" y="125" width="34" height="45" /><rect x="290" y="138" width="40" height="32" />
        </g>}
        {d.cone && (() => {
          const c = d.cone, lx = c.peakX - c.halfW, rx = c.peakX + c.halfW;
          const capH = (c.baseY - c.peakY) * 0.34, capHalf = c.halfW * 0.34;
          return <g>
            <path d={`M${c.peakX},${c.peakY} L${rx},${c.baseY} L${lx},${c.baseY} Z`} fill={c.c} />
            <path d={`M${c.peakX},${c.peakY} L${c.peakX + capHalf},${c.peakY + capH} Q${c.peakX},${c.peakY + capH - 10} ${c.peakX - capHalf},${c.peakY + capH} Z`} fill={c.snowC} />
          </g>;
        })()}
        {d.arches && (() => {
          const a = d.arches, span = W / a.n, pierW = span * 0.2, deckH = 13;
          const els = [<rect key="deck" x="0" y={a.topY} width={W} height={deckH} fill={a.c} />];
          for (let i = 0; i <= a.n; i++) {
            const x = i * span - pierW / 2;
            els.push(<rect key={"p" + i} x={x} y={a.topY + deckH} width={pierW} height={a.baseY - a.topY - deckH} fill={a.c} />);
          }
          els.push(<rect key="sh" x="0" y={a.topY + deckH} width={W} height="4" fill="#000" opacity="0.12" />);
          return <g>{els}</g>;
        })()}
        {d.trees && (() => {
          const t = d.trees, els = [];
          if (t.style === "conifer") {
            const base = 206;
            for (let i = 0; i < 13; i++) {
              const x = 12 + i * 31, h = 26 + ((i * 17) % 22), w = 11;
              els.push(<path key={i} d={`M${x},${base - h} L${x + w},${base} L${x - w},${base} Z`} fill={t.c} opacity={0.85} />);
            }
          } else {
            // acacia umbrella trees
            [[70, 196, 1], [180, 188, 1.25], [300, 198, 0.95], [360, 192, 1.1]].forEach((s, i) => {
              const [x, y, k] = s;
              els.push(<g key={i} fill={t.c}>
                <rect x={x - 1.5} y={y - 22 * k} width="3" height={22 * k} />
                <ellipse cx={x} cy={y - 24 * k} rx={26 * k} ry={7 * k} />
              </g>);
            });
          }
          return <g>{els}</g>;
        })()}
      </>}

      {d.interior && <>
        <rect x="0" y="0" width={W} height={H} fill={d.warm} />
        <g clipPath={`url(#${gid}_win)`}>
          <rect x="0" y="0" width={W} height={H} fill={`url(#${gid})`} />
          {(d.layers || []).map((L, i) => <path key={i} d={ridgePath(L.p)} fill={L.c} />)}
        </g>
        <path d="M40,250 L40,90 Q200,30 360,90 L360,250 Z" fill="none" stroke={d.frame} strokeWidth="13" />
        <line x1="200" y1="42" x2="200" y2="250" stroke={d.frame} strokeWidth="7" />
        <path d="M40,90 Q200,30 360,90" fill="none" stroke={d.frame} strokeWidth="7" opacity="0.5" />
        {d.plate && <g>
          <ellipse cx="200" cy="250" rx="78" ry="18" fill="#241B14" />
          <ellipse cx="200" cy="245" rx="60" ry="13" fill="#EDE3CE" />
          <ellipse cx="200" cy="243" rx="30" ry="7" fill="#C98A5A" />
        </g>}
      </>}

      {vignette && <rect x="0" y="0" width={W} height={H} fill={`url(#${gid}_v)`} />}
    </svg>
  );
}

window.Scene = Scene;
