"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import greenBall from "../../image/green-ball.png";

type OrbitPoint = {
  title: string;
  detail: string;
  angle: number;
  radius?: number;
  speed?: number;
  wobble?: number;
  depth?: number;
  depthSpeed?: number;
};

type OrbitingPointsProps = {
  points: OrbitPoint[];
  radius?: number;
  size?: number;
};

export default function OrbitingPoints({
  points,
  radius = 220,
  size = 14,
}: OrbitingPointsProps) {
  const [paused, setPaused] = useState(false);

  return (
    <div className="orbitWrap">
      <div
        className="orbit"
        style={{ animationPlayState: paused ? "paused" : "running" }}
      >
        {points.map((point, index) => (
          <div
            key={point.title}
            className="orbitDot"
            style={{
              "--angle": `${point.angle}deg`,
              "--radius": `${point.radius ?? radius}px`,
              "--wobble": `${point.wobble ?? 16}px`,
              "--depth-min": `${1 - (point.depth ?? 0.35)}`,
              "--depth-max": `${1 + (point.depth ?? 0.35)}`,
              "--spin": `${point.speed ?? 9 + index * 2.3}s`,
              "--depth-speed": `${point.depthSpeed ?? 6.5 + index * 1.2}s`,
              "--delay": `${-(index * 1.4)}s`,
              "--spin-direction": index % 2 === 0 ? "normal" : "reverse",
              animationPlayState: paused ? "paused" : "running",
            } as CSSProperties}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            tabIndex={0}
            aria-label={`${point.title}: ${point.detail}`}
          >
            <div
              className="orbitNode"
              style={{
                width: size,
                height: size,
                animationPlayState: paused ? "paused" : "running",
              }}
            >
              <span
                className="orbitSprite"
                style={{
                  backgroundImage: `url(${greenBall.src})`,
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
              <span
                className="orbitTip"
                style={{ animationPlayState: paused ? "paused" : "running" }}
              >
                <strong>{point.title}</strong>
                <span>{point.detail}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .orbitWrap {
          position: absolute;
          inset: -8%;
        }
        .orbit {
          position: absolute;
          inset: 0;
          animation: orbitSpin 16s linear infinite;
        }
        .orbitDot {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 0;
          height: 0;
          pointer-events: auto;
          cursor: default;
          animation: orbitSpin var(--spin) linear infinite;
          animation-direction: var(--spin-direction);
          animation-delay: var(--delay);
          animation-play-state: inherit;
        }
        .orbitNode {
          position: relative;
          border-radius: 50%;
          transform: translateX(calc(var(--radius) + var(--wobble)));
          animation: orbitWobble 6s ease-in-out infinite;
          animation-delay: var(--delay);
        }
        .orbitSprite {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          box-shadow: 0 0 0 6px rgba(31, 51, 38, 0.08);
          animation: orbitDepth var(--depth-speed) ease-in-out infinite;
          animation-delay: var(--delay);
        }
        .orbitDot:focus-visible {
          outline: 2px solid #3b5b46;
          outline-offset: 4px;
        }
        .orbitTip {
          position: absolute;
          left: 50%;
          bottom: calc(100% + 12px);
          transform: translateX(-50%) rotate(calc(var(--angle) * -1));
          transform-origin: center;
          background: #ffffff;
          color: #1f3326;
          border: 1px solid #d4e2d6;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 12px;
          line-height: 1.4;
          width: 180px;
          text-align: left;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
          animation: spinReverse var(--spin) linear infinite;
          animation-direction: var(--spin-direction);
          animation-delay: var(--delay);
        }
        .orbitTip strong {
          display: block;
          font-size: 12px;
          margin-bottom: 4px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .orbitTip span {
          display: block;
          color: #4a5a4a;
        }
        .orbitDot:hover .orbitTip,
        .orbitDot:focus-visible .orbitTip {
          opacity: 1;
        }
        @keyframes orbitSpin {
          from {
            transform: rotate(var(--angle));
          }
          to {
            transform: rotate(calc(var(--angle) + 360deg));
          }
        }
        @keyframes orbitWobble {
          0% {
            transform: translateX(calc(var(--radius) + var(--wobble)));
          }
          40% {
            transform: translateX(calc(var(--radius) - var(--wobble)));
          }
          70% {
            transform: translateX(calc(var(--radius) + var(--wobble) / 2));
          }
          100% {
            transform: translateX(calc(var(--radius) + var(--wobble)));
          }
        }
        @keyframes orbitDepth {
          0% {
            transform: scale(var(--depth-min));
            opacity: 0.7;
          }
          50% {
            transform: scale(var(--depth-max));
            opacity: 1;
          }
          100% {
            transform: scale(var(--depth-min));
            opacity: 0.7;
          }
        }
        @keyframes spinReverse {
          from {
            transform: translateX(-50%) rotate(calc(var(--angle) * -1));
          }
          to {
            transform: translateX(-50%) rotate(calc((var(--angle) + 360deg) * -1));
          }
        }
      `}</style>
    </div>
  );
}
