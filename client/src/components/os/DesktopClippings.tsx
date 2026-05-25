"use client";

import { Rnd } from "react-rnd";

// Loose "clippings" scattered on the desktop — draggable, sit below windows.
// Swap the gradient placeholders for real images by giving a clipping an
// `img` path under /public and rendering it instead of the gradient box.
type Clipping = {
  id: string;
  caption: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotate: number;
  gradient: string;
  img?: string;
};

const CLIPPINGS: Clipping[] = [
  { id: "c1", caption: "summer '24", x: 60,  y: 90,  w: 120, h: 96,  rotate: -5, gradient: "linear-gradient(135deg,#e80,#c33)" },
  { id: "c2", caption: "studio",     x: 220, y: 240, w: 110, h: 110, rotate: 4,  gradient: "linear-gradient(135deg,#37a,#2a7)" },
  { id: "c3", caption: "sketch",     x: 120, y: 380, w: 130, h: 90,  rotate: -3, gradient: "linear-gradient(135deg,#a3a,#37a)" },
];

export function DesktopClippings() {
  return (
    <>
      {CLIPPINGS.map((c) => (
        <Rnd
          key={c.id}
          default={{ x: c.x, y: c.y, width: c.w, height: c.h }}
          enableResizing={false}
          bounds="parent"
          style={{ zIndex: 1 }}
        >
          <div style={{ ...polaroid, transform: `rotate(${c.rotate}deg)` }}>
            <div
              style={{
                flex: 1,
                background: c.img ? `center/cover url(${c.img})` : c.gradient,
                border: "1px solid var(--wb-black)",
              }}
            />
            <div style={caption}>{c.caption}</div>
          </div>
        </Rnd>
      ))}
    </>
  );
}

const polaroid: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  gap: 3,
  padding: 4,
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
  cursor: "grab",
};
const caption: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  textAlign: "center",
  color: "var(--wb-black)",
};
