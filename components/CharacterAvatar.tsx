import React, { useEffect, useRef } from 'react';
import { CharacterAppearance } from '../types';

interface CharacterAvatarProps {
  appearance: CharacterAppearance;
  size?: number;
}

const CharacterAvatar: React.FC<CharacterAvatarProps> = ({ appearance, size = 100 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const pixelSize = canvas.width / 10;

    // Draw Body (Simple Tunic)
    ctx.fillStyle = '#8B4513'; // Leather brown
    ctx.fillRect(3 * pixelSize, 5 * pixelSize, 4 * pixelSize, 4 * pixelSize);

    // Draw Head
    ctx.fillStyle = appearance.skinColor;
    ctx.fillRect(3 * pixelSize, 2 * pixelSize, 4 * pixelSize, 3 * pixelSize);

    // Draw Hair
    ctx.fillStyle = appearance.hairColor;
    ctx.fillRect(3 * pixelSize, 2 * pixelSize, 4 * pixelSize, 1 * pixelSize); // Top
    ctx.fillRect(2 * pixelSize, 2 * pixelSize, 1 * pixelSize, 3 * pixelSize); // Left side
    ctx.fillRect(7 * pixelSize, 2 * pixelSize, 1 * pixelSize, 3 * pixelSize); // Right side

    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(4 * pixelSize, 3.5 * pixelSize, 0.5 * pixelSize, 0.5 * pixelSize);
    ctx.fillRect(5.5 * pixelSize, 3.5 * pixelSize, 0.5 * pixelSize, 0.5 * pixelSize);

    // Legs
    ctx.fillStyle = appearance.skinColor;
    ctx.fillRect(3.5 * pixelSize, 9 * pixelSize, 1 * pixelSize, 1 * pixelSize);
    ctx.fillRect(5.5 * pixelSize, 9 * pixelSize, 1 * pixelSize, 1 * pixelSize);

  }, [appearance, size]);

  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size} 
      className="border-4 border-gray-600 bg-gray-800 rounded-lg shadow-lg"
    />
  );
};

export default CharacterAvatar;