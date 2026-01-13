"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
}

const COLORS = [
  "rgb(107, 135, 107)", // sage-500
  "rgb(134, 161, 134)", // sage-400
  "rgb(79, 108, 79)",   // sage-600
  "rgb(161, 186, 161)", // sage-300
  "rgb(188, 206, 188)", // sage-200
];

export function Confetti({ isActive }: { isActive: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 500,
      }));
      setPieces(newPieces);

      // Clear after animation
      const timer = setTimeout(() => {
        setPieces([]);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute h-3 w-3"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
            animation: `confetti-fall 2.5s ease-out ${piece.delay}ms forwards`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
}
