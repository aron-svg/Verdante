"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import nvidiaImage from "../image/nvidia.png";
import datacenterLight from "../image/datacenter.png";
import aronPhoto from "../image/aron-bg.jpg";
import logo from "../image/logo-verdante.png";
import robinPhoto from "../image/robin.png";
import shirinPhoto from "../image/shirin.jpg";
import OrbitingPoints from "./components/OrbitingPoints";

export default function Page() {
  const orbitPoints = [
    {
      title: "Grid Signals",
      detail: "Real-time insights align workloads with cleaner energy.",
      angle: 20,
      radius: 190,
      depth: 0.4,
    },
    {
      title: "Load Shaping",
      detail: "Shift demand to low-carbon windows without downtime.",
      angle: 150,
      radius: 220,
      depth: 0.3,
    },
    {
      title: "Impact Reports",
      detail: "Track emissions reductions across every region.",
      angle: 280,
      radius: 170,
      depth: 0.5,
    },
    {
      title: "Compliance",
      detail: "Export-ready sustainability reporting and audit trails.",
      angle: 70,
      radius: 205,
      depth: 0.35,
    },
    {
      title: "Forecasting",
      detail: "Predict carbon intensity before workloads launch.",
      angle: 210,
      radius: 235,
      depth: 0.25,
    },
    {
      title: "Automation",
      detail: "Policies auto-route jobs to cleaner regions.",
      angle: 330,
      radius: 180,
      depth: 0.45,
    },
  ];

  const heroImageRef = useRef<HTMLDivElement | null>(null);
  const signalAreaRef = useRef<HTMLDivElement | null>(null);
  const [signalPaths, setSignalPaths] = useState<string[]>([]);
  const [signalBox, setSignalBox] = useState({ width: 0, height: 0 });

  const signalCount = 8;

  useEffect(() => {
    const generatePaths = () => {
      const sectionRect = signalAreaRef.current?.getBoundingClientRect();
      if (!sectionRect) return;

      setSignalBox({ width: sectionRect.width, height: sectionRect.height });
      const imageRect = heroImageRef.current?.getBoundingClientRect();
      const fallbackX = sectionRect.width / 2;
      const fallbackY = sectionRect.height / 2;
      const startX = imageRect
        ? imageRect.left + imageRect.width / 2 - sectionRect.left
        : fallbackX;
      const startY = imageRect
        ? imageRect.top + imageRect.height / 2 - sectionRect.top
        : fallbackY;
      const maxSteps = 5;

      const paths = Array.from({ length: signalCount }, () => {
        let x = startX;
        let y = startY;
        let direction = Math.floor(Math.random() * 4);
        const points: Array<[number, number]> = [[x, y]];

        for (let step = 0; step < maxSteps; step += 1) {
          const length = 120 + Math.random() * 240;

          switch (direction) {
            case 0:
              x += length;
              break;
            case 1:
              y += length;
              break;
            case 2:
              x -= length;
              break;
            default:
              y -= length;
              break;
          }

          points.push([x, y]);
          direction = (direction + (Math.random() > 0.5 ? 1 : 3)) % 4;
        }

        return points
          .map((point, index) => `${index === 0 ? "M" : "L"} ${point[0]} ${point[1]}`)
          .join(" ");
      });

      setSignalPaths(paths);
    };

    const frame = window.requestAnimationFrame(generatePaths);
    window.addEventListener("resize", generatePaths);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", generatePaths);
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: 0,
        margin: 0,
        background: "linear-gradient(180deg, #e6f3e6 0%, #ffffff 28%)",
      }}
    >
      <div
        ref={signalAreaRef}
        style={{
          position: "relative",
        }}
      >
        <svg
          className="signalCanvas"
          aria-hidden="true"
          width={signalBox.width}
          height={signalBox.height}
          viewBox={`0 0 ${signalBox.width} ${signalBox.height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="signalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c9d1c6" />
              <stop offset="45%" stopColor="#c9d1c6" />
              <stop offset="60%" stopColor="#58a56c" />
              <stop offset="100%" stopColor="#58a56c" />
            </linearGradient>
          </defs>
          {signalPaths.map((path, index) => (
            <path
              key={`${path}-${index}`}
              className="signalPath"
              d={path}
            />
          ))}
        </svg>
        <header
          style={{
            width: "100%",
            maxWidth: 1120,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Image
              src={logo}
              alt="Verdante logo"
              width={72}
              height={72}
              priority
            />
            <div
              style={{
                fontSize: 18,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#3b5b46",
                fontWeight: 600,
              }}
            >
              Verdante
            </div>
          </div>
          <button
            type="button"
            onClick={() => { window.location.href = "/dashboard"; }}
            style={{
              border: "1px solid #1f3326",
              background: "transparent",
              color: "#1f3326",
              padding: "10px 18px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </header>

        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 1120,
              display: "flex",
              alignItems: "center",
              gap: 48,
              flexWrap: "wrap",
              position: "relative",
              zIndex: 1,
            }}
          >
          <section style={{ flex: "1 1 320px", minWidth: 280 }}>
            <h1
              style={{
                fontSize: "clamp(2.5rem, 4vw, 3.6rem)",
                lineHeight: 1.1,
                margin: 0,
                color: "#0c0f0a",
              }}
            >
              GreenFlow Compute
            </h1>
            <p
              style={{
                marginTop: 20,
                fontSize: "1.1rem",
                lineHeight: 1.6,
                color: "#4a5a4a",
                maxWidth: 420,
              }}
            > We are Carbon-Aware Cloud Orchestrator, we
              Optimize compute for CO2, cost, and compliance with transparent, audit-ready
              reporting.
            </p>
          </section>
          <section
            style={{
              flex: "1 1 360px",
              minWidth: 280,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 520,
                position: "relative",
              }}
              ref={heroImageRef}
            >
              <Image
                src={nvidiaImage}
                alt="Datacenter"
                style={{
                  width: "100%",
                  height: "auto",
                }}
                priority
              />
            </div>
          </section>
          </div>
        </section>
      </div>
      <section
        style={{
          width: "100%",
          maxWidth: 1120,
          margin: "0 auto",
          padding: "16px 24px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "clamp(2rem, 3vw, 2.75rem)" }}>
          What our company does
        </h2>
        <p style={{ margin: 0, maxWidth: 760, color: "#4a5a4a", lineHeight: 1.7 }}>
          We help organizations run their cloud computing in a
          <span style={{ color: "#2f7d5a", fontWeight: 700 }}> greener</span>,
          <span style={{ color: "#2f7d5a", fontWeight: 700 }}> cheaper</span>, and
          <span style={{ color: "#2f7d5a", fontWeight: 700 }}> more compliant</span> way -
          automatically.
        </p>
        <div
          style={{
            width: "100%",
            display: "grid",
            gap: 18,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            textAlign: "left",
          }}
        >
          <div
            style={{
              border: "1px solid #d4e2d6",
              borderRadius: 20,
              padding: "20px",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minHeight: 190,
            }}
          >
            <p style={{ margin: 0, color: "#4a5a4a", lineHeight: 1.6 }}>
              Most companies run AI training, data processing, and other heavy compute jobs without
              knowing:
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#4a5a4a", lineHeight: 1.6 }}>
              <li>
                <span style={{ color: "#2f7d5a", fontWeight: 700 }}>1.</span> how much
                <span style={{ color: "#2f7d5a", fontWeight: 700 }}> CO₂</span> they emit
              </li>
              <li>
                <span style={{ color: "#2f7d5a", fontWeight: 700 }}>2.</span> whether they’re
                following Canada/EU
                <span style={{ color: "#2f7d5a", fontWeight: 700 }}> data-residency</span> rules
              </li>
              <li>
                <span style={{ color: "#2f7d5a", fontWeight: 700 }}>3.</span> or whether they’re
                <span style={{ color: "#2f7d5a", fontWeight: 700 }}> overspending</span> because
                they run jobs at the wrong time or in the wrong region
              </li>
            </ul>
            <p style={{ margin: 0, color: "#4a5a4a", lineHeight: 1.6 }}>
              Training a single large AI model can emit over
              <span style={{ color: "#2f7d5a", fontWeight: 700 }}> 626,000 pounds</span> of
              <span style={{ color: "#2f7d5a", fontWeight: 700 }}> CO2</span>,
              equivalent to the lifetime emissions of five cars.
            </p>
            <p style={{ margin: 0, color: "#4a5a4a", lineHeight: 1.6 }}>We solve that.</p>
          </div>
          <div
            style={{
              border: "1px solid #d4e2d6",
              borderRadius: 20,
              padding: "20px",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minHeight: 190,
            }}
          >
            <div style={{ fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              The simplest analogy
            </div>
            <p style={{ margin: 0, color: "#4a5a4a", lineHeight: 1.6 }}>
              Think of us as a map for cloud computing:
            </p>
            <p style={{ margin: 0, color: "#4a5a4a", lineHeight: 1.6 }}>
              <span style={{ color: "#2f7d5a", fontWeight: 700 }}>1.</span> You tell us where you
              want to go (run your workload).
            </p>
            <p style={{ margin: 0, color: "#4a5a4a", lineHeight: 1.6 }}>
              <span style={{ color: "#2f7d5a", fontWeight: 700 }}>2.</span> You tell us your
              priorities (cheapest, greenest, fastest, or compliant).
            </p>
            <p style={{ margin: 0, color: "#4a5a4a", lineHeight: 1.6 }}>
              <span style={{ color: "#2f7d5a", fontWeight: 700 }}>3.</span> We show you the
              <span style={{ color: "#2f7d5a", fontWeight: 700 }}> best route</span>, the
              <span style={{ color: "#2f7d5a", fontWeight: 700 }}> majored case cost</span>, and the
              <span style={{ color: "#2f7d5a", fontWeight: 700 }}> carbon impact</span>.
            </p>
            <p style={{ margin: 0, color: "#4a5a4a", lineHeight: 1.6 }}>
              <span style={{ color: "#2f7d5a", fontWeight: 700 }}>4.</span> Then we simulate the
              run and generate a
              <span style={{ color: "#2f7d5a", fontWeight: 700 }}> regulatory-ready</span> emissions
              report.
            </p>
          </div>
        </div>
      </section>
      <section
        style={{
          width: "100%",
          maxWidth: 960,
          margin: "24px auto 0",
          padding: "48px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "clamp(2rem, 3vw, 2.75rem)" }}>About Us</h2>
        <p style={{ margin: 0, maxWidth: 520, color: "#4a5a4a", lineHeight: 1.6 }}>
          Verdante helps teams make cloud decisions that cut carbon emissions without
          sacrificing performance.
        </p>
        <div
          style={{
            width: "100%",
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {[
            {
              name: "Aron Segovia",
              summary: "Aron Segovia is a multilingual Computer Engineering bachelor’s student at McGill University.",
              photo: aronPhoto,
            },
            {
              name: "Robin Glaude",
              summary: "Robin Glaude is a master’s student in Software Engineering doing a certificate of management at McGill University.",
              photo: robinPhoto,
            },
            {
              name: "Shrin Zoufan",
              summary: "Shrin Zoufan is a PhD student in Civil Engineering at Concordia University.",
              photo: shirinPhoto,
            },
          ].map((member) => (
            <div
              key={member.name}
              style={{
                border: "1px solid #d4e2d6",
                borderRadius: 20,
                padding: "20px",
                background: "#ffffff",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <Image
                src={member.photo}
                alt={member.name}
                style={{
                  width: 140,
                  height: 140,
                  objectFit: "cover",
                  borderRadius: "50%",
                  margin: "0 auto",
                }}
              />
              <div style={{ fontSize: 16, fontWeight: 600, textAlign: "center" }}>
                {member.name}
              </div>
              <p style={{ margin: 0, color: "#4a5a4a", lineHeight: 1.5, textAlign: "center" }}>
                {member.summary}
              </p>
            </div>
          ))}
        </div>
        <div style={{ width: "100%", maxWidth: 560, position: "relative" }}>
          <Image
            src={datacenterLight}
            alt="Datacenter"
            style={{ width: "100%", height: "auto" }}
            priority
          />
          <OrbitingPoints points={orbitPoints} radius={190} size={32} />
        </div>
      </section>
      <section
        style={{
          width: "100%",
          maxWidth: 1120,
          margin: "0 auto 32px",
          padding: "56px 24px 64px",
          textAlign: "center",
          borderTop: "8px solid #4f8f78",
          background: "linear-gradient(180deg, #eef7f0 0%, #ffffff 60%)",
          borderRadius: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          boxShadow: "0 16px 40px rgba(31, 51, 38, 0.08)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "clamp(2rem, 3.4vw, 2.9rem)", color: "#0c0f0a" }}>
          Ready to Make Your Cloud Greener?
        </h2>
        <p style={{ margin: 0, maxWidth: 640, color: "#4a5a4a", lineHeight: 1.6, fontSize: "1.05rem" }}>
          Join forward-thinking companies reducing their carbon footprint without compromising
          performance.
        </p>
        <button
          type="button"
          onClick={() => { window.location.href = "/dashboard"; }}
          style={{
            marginTop: 8,
            border: "none",
            background: "#4f8f78",
            color: "#ffffff",
            padding: "14px 28px",
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "0.02em",
            cursor: "pointer",
            boxShadow: "0 12px 20px rgba(79, 143, 120, 0.25)",
          }}
        >
          Start Calculating Savings →
        </button>
      </section>
      <section
        style={{
          width: "100%",
          maxWidth: 1120,
          margin: "0 auto 48px",
          padding: "24px 24px 72px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "clamp(2rem, 3vw, 2.75rem)" }}>Pricing</h2>
        <p style={{ margin: 0, maxWidth: 560, color: "#4a5a4a", lineHeight: 1.6 }}>
          Flexible plans for teams at every stage of carbon-aware optimization.
        </p>
        <div
          style={{
            width: "100%",
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {[
            {
              name: "Freemium / Developer Tier",
              price: "Free",
              detail: "Local-only planner (your MVP)",
              bullets: [
                "• 1 project, up to 5 jobs",
                "• Basic presets (Greenest / Cheapest / Fastest)",
                "• JSON export",
                "• No compliance templates",
              ],
            },
            {
              name: "Team Tier",
              price: "$29-$99 per user/month",
              detail: "Unlimited projects/jobs",
              bullets: [
    
                "• Unlimited projects/jobs",
                "• Full optimization weights",
                "• Canada/EU compliance templates",
                "• Team workspace + mock collaboration",
                "• Report exports (PDF + JSON)",
                "• Local-only or cloud-synced (when you build backend)",
              ],
            },
            {
              name: "Pro / FinOps Tier",
              price: "$299-$499 per team/month",
              detail: "Advanced constraints (budget, CO2 caps, deadlines)",
              bullets: [
      
  
                "• Provider/region modeling",
                "• Custom compliance policies",
                "• Audit logs",
                "• Integration hooks (when backend exists)",
                "• Multi-project rollups",
                "• Value metric: per team (matches FinOps tooling like CloudZero, Vantage)",
              ],
            },
          ].map((plan) => (
            <div
              key={plan.name}
              style={{
                border: "1px solid #d4e2d6",
                borderRadius: 20,
                padding: "24px 20px",
                textAlign: "left",
                background: "#fbfdfb",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minHeight: 160,
              }}
            >
              <div style={{ fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {plan.name}
              </div>
              <div style={{ fontSize: 28, fontWeight: 600 }}>{plan.price}</div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  color: "#2f3f33",
                  lineHeight: 1.55,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {plan.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <footer
        style={{
          width: "100%",
          marginTop: 24,
          background: "linear-gradient(180deg, #2f5a4b 0%, #23483d 100%)",
          color: "#e9f2ee",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "48px 24px 28px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 28,
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 26 }}>❧</span>
              <div style={{ fontSize: 22, fontWeight: 600 }}>Verdante</div>
            </div>
            <p style={{ margin: 0, color: "#d9e6e0", lineHeight: 1.6, maxWidth: 260 }}>
              Carbon-aware cloud computing for a sustainable future.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Platform
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, color: "#d9e6e0" }}>
              <span>Multi-region deployment</span>
              <span>GDPR compliant</span>
              <span>Real-time optimization</span>
              <span>ESG reporting</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Contact
            </div>
            <p style={{ margin: 0, color: "#d9e6e0", lineHeight: 1.6, maxWidth: 260 }}>
              Ready to turn your compute greener? Get started in one click.
            </p>
          </div>
        </div>
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "0 24px 28px",
            color: "#b8cec4",
            borderTop: "1px solid rgba(233, 242, 238, 0.15)",
            textAlign: "center",
          }}
        >
          <div style={{ paddingTop: 18 }}>© 2026 Verdante. All rights reserved.</div>
        </div>
      </footer>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 24,
          width: 18,
          height: 18,
          borderRight: "2px solid #1f3326",
          borderBottom: "2px solid #1f3326",
          transform: "translateX(-50%) rotate(45deg)",
          animation: "floatArrow 2.8s ease-in-out infinite",
          opacity: 0.65,
          pointerEvents: "none",
        }}
      />
      <style jsx global>{`
        .signalCanvas {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          width: 100%;
          height: 100%;
        }
        .signalPath {
          fill: none;
          stroke: url(#signalGradient);
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          opacity: 0.7;
          stroke-dasharray: 18 12;
          animation: signalDash 4s linear infinite;
        }
        @keyframes signalDash {
          to {
            stroke-dashoffset: -120;
          }
        }
        @keyframes floatArrow {
          0% {
            transform: translateX(-50%) translateY(0) rotate(45deg);
          }
          50% {
            transform: translateX(-50%) translateY(10px) rotate(45deg);
          }
          100% {
            transform: translateX(-50%) translateY(0) rotate(45deg);
          }
        }
      `}</style>
    </main>
  );
}
