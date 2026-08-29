/* ============================================================
   MtaaLink - Generate Icons using Canvas
   ============================================================ */

function generateIcon(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#1A73E8');
    gradient.addColorStop(1, '#0D47A1');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, size * 0.12);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = size * 0.015;
    ctx.beginPath();
    ctx.roundRect(size * 0.05, size * 0.05, size * 0.9, size * 0.9, size * 0.08);
    ctx.stroke();
    
    // M letter
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.55}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', size * 0.5, size * 0.5 - size * 0.05);
    
    // Subtitle
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `${size * 0.07}px system-ui, -apple-system, sans-serif`;
    ctx.fillText('taaLink', size * 0.5, size * 0.5 + size * 0.3);
    
    // Small tagline
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `${size * 0.04}px system-ui, -apple-system, sans-serif`;
    ctx.fillText('Management', size * 0.5, size * 0.5 + size * 0.42);
    
    return canvas.toDataURL('image/png');
}

// Note: This is a helper script. Icons will be generated at build time.
