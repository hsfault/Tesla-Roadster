import { useState } from 'react';

// Official brand files only (never redrawn). Tries the SVG first, then the supplied raster, then a neutral placeholder.
const SOURCES = {
  logo: ['/brand/tesla-logo.svg', '/brand/tesla-logo.png'],
  wordmark: ['/brand/tesla-wordmark.svg', '/brand/tesla-wordmark.png'],
};

export default function BrandImg({ kind = 'wordmark', alt = 'Tesla', className = '', style }) {
  const [i, setI] = useState(0);
  const list = SOURCES[kind];
  if (i >= list.length) {
    return (
      <span className={`inline-flex items-center justify-center border border-rig px-2 font-mono text-[12px] uppercase text-steel ${className}`} style={style}>
        {kind}
      </span>
    );
  }
  return <img src={list[i]} alt={alt} className={className} style={style} onError={() => setI(i + 1)} draggable={false} />;
}
