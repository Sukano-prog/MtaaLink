#!/usr/bin/env python3
"""
Generate PNG icons for MtaaLink PWA
Requires: pip install pillow
"""

import os
from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename):
    """Create a simple icon with the letter M"""
    # Create image with gradient-like background
    img = Image.new('RGB', (size, size), color=(26, 115, 232))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded rectangle
    draw.rectangle([(0, 0), (size, size)], fill=(26, 115, 232))
    
    # Draw the letter M
    try:
        # Try to use a system font
        font_size = int(size * 0.55)
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    # Get text size and position
    text = "M"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - int(size * 0.05)
    draw.text((x, y), text, fill=(255, 255, 255), font=font)
    
    # Draw subtitle
    try:
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", int(size * 0.07))
    except:
        font_small = ImageFont.load_default()
    
    subtitle = "taaLink"
    bbox = draw.textbbox((0, 0), subtitle, font=font_small)
    sw = bbox[2] - bbox[0]
    sh = bbox[3] - bbox[1]
    sx = (size - sw) // 2
    sy = y + int(size * 0.55)
    draw.text((sx, sy), subtitle, fill=(255, 255, 255, 200), font=font_small)
    
    # Draw tagline
    tagline = "Village Management"
    try:
        font_tag = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", int(size * 0.04))
    except:
        font_tag = ImageFont.load_default()
    
    bbox = draw.textbbox((0, 0), tagline, font=font_tag)
    tw = bbox[2] - bbox[0]
    tx = (size - tw) // 2
    ty = sy + int(size * 0.2)
    draw.text((tx, ty), tagline, fill=(255, 255, 255, 150), font=font_tag)
    
    # Save
    img.save(filename, 'PNG')
    print(f"Created: {filename}")

def main():
    # Create icons directory
    os.makedirs('frontend/icons', exist_ok=True)
    
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    for size in sizes:
        filename = f'frontend/icons/icon-{size}x{size}.png'
        create_icon(size, filename)

if __name__ == '__main__':
    main()
