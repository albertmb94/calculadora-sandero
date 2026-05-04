"use client";

import { useState, useMemo } from "react";

// ─── Constantes extraídas de los documentos ───────────────────────────────────
const PVP_DEFAULT    = 14654.30; // entrada (6000) + capital financiado (8654.30)
const GASTOS_REG     = 47.00;
const PROT_PAGOS     = 414.79;   // servicios offer 2: 9297.39 - 8882.60
const MANTENIMIENTO  = 1101.38;  // diferencia servicios offer1 - offer2
const N_MESES        = 48;       // cuotas regulares (mes 49 = VMG)

// ─── Modelos lineales calibrados con los 2 datos reales ──────────────────────
// km   60k → VMG 8585.84 €
// km   80k → VMG 8230.03 €
const calcVMG = (km: number) =>
  8585.84 + ((8230.03 - 8585.84) / 20000) * (km - 60000);

// km   60k → comisión 181.30 €
// km   80k → comisión 203.20 €
const calcComision = (km: number) =>
  181.30 + ((203.20 - 181.30) / 20000) * (km - 60000);

// ─── Fórmula principal: préstamo con pago balloon ────────────────────────────
// C = (P - VMG·(1+r)^-n) · r·(1+r)^n / ((1+r)^n - 1)
function calcCuota(P: number, tin: number, n: number, vmg: number) {
  const r = tin / 100 / 12;
  if (r === 0) return (P - vmg) / n;
  const fn = Math.pow(1 + r, n);
  return (P - vmg / fn) * (r * fn) / (fn - 1);
}

// ─── Formateo ─────────────────────────────────────────────────────────────────
const fmt = (n: number, dec = 2) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + " €";

// ─── Slider con etiqueta ──────────────────────────────────────────────────────
function Slider({ label, value, min, max, step, onChange, display }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display?: string;
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "12px", color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{label}</span>
        <span style={{ fontSize: "18px", fontWeight: "700", color: "#f97316", fontFamily: "'DM Mono', monospace" }}>{display || fmt(value)}</span>
      </div>
      <div style={{ position: "relative", height: "4px", background: "#1f2937", borderRadius: "2px" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          width: `${((value - min) / (max - min)) * 100}%`,
          background: "linear-gradient(90deg, #ea580c, #f97316)",
          borderRadius: "2px"
        }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: "absolute", top: "-8px", left: 0, width: "100%", height: "20px",
            opacity: 0, cursor: "pointer", margin: 0
          }}
        />
        <div style={{
          position: "absolute",
          left: `calc(${((value - min) / (max - min)) * 100}% - 8px)`,
          top: "-6px", width: "16px", height: "16px",
          background: "#f97316", borderRadius: "50%",
          border: "2px solid #111827", pointerEvents: "none",
          boxShadow: "0 0 8px rgba(249,115,22,0.6)"
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
        <span style={{ fontSize: "10px", color: "#4b5563", fontFamily: "'DM Mono', monospace" }}>{typeof min === "number" && min >= 1000 ? min.toLocaleString("es-ES") : min}</span>
        <span style={{ fontSize: "10px", color: "#4b5563", fontFamily: "'DM Mono', monospace" }}>{typeof max === "number" && max >= 1000 ? max.toLocaleString("es-ES") : max}</span>
      </div>
    </div>
  );
}

// ─── Tarjeta de métrica ───────────────────────────────────────────────────────
function Metric({ label, value, highlight, small }: {
  label: string;
  value: string;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <div style={{
      background: highlight ? "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.08))" : "rgba(255,255,255,0.03)",
      border: `1px solid ${highlight ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: "10px", padding: "14px 16px"
    }}>
      <div style={{ fontSize: "10px", color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: small ? "18px" : "24px", fontWeight: "800", color: highlight ? "#f97316" : "#f3f4f6", fontFamily: "'DM Mono', monospace" }}>{value}</div>
    </div>
  );
}

// ─── Fila de comparación ──────────────────────────────────────────────────────
function CompRow({ label, v1, v2, vCalc, highlight }: {
  label: string;
  v1: string;
  v2: string;
  vCalc: string;
  highlight?: boolean;
}) {
  return (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <td style={{ padding: "8px 0", fontSize: "12px", color: "#9ca3af", fontFamily: "'DM Mono', monospace" }}>{label}</td>
      <td style={{ padding: "8px 8px", fontSize: "12px", color: "#d1d5db", textAlign: "right", fontFamily: "'DM Mono', monospace" }}>{v1}</td>
      <td style={{ padding: "8px 8px", fontSize: "12px", color: "#d1d5db", textAlign: "right", fontFamily: "'DM Mono', monospace" }}>{v2}</td>
      <td style={{ padding: "8px 0", fontSize: "12px", color: highlight ? "#f97316" : "#34d399", fontWeight: "700", textAlign: "right", fontFamily: "'DM Mono', monospace" }}>{vCalc}</td>
    </tr>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DaciaDPRC() {
  const [pvp,      setPvp]      = useState(PVP_DEFAULT);
  const [entrada,  setEntrada]  = useState(6000);
  const [km,       setKm]       = useState(60000);
  const [tin,      setTin]      = useState(7.95);
  const [conManto, setConManto] = useState(false);

  const R = useMemo(() => {
    const vmg       = Math.max(0, calcVMG(km));
    const capital   = Math.max(0, pvp - entrada);
    const comision  = calcComision(km);
    const servicios = PROT_PAGOS + (conManto ? MANTENIMIENTO : 0);
    const totalFin  = capital + comision + GASTOS_REG + servicios;
    const cuota     = Math.max(0, calcCuota(totalFin, tin, N_MESES, vmg));
    const costeTotal    = entrada + cuota * N_MESES + vmg;
    const sobrecosto    = costeTotal - pvp;
    const porcentajeFin = ((sobrecosto / pvp) * 100);
    return { vmg, capital, comision, servicios, totalFin, cuota, costeTotal, sobrecosto, porcentajeFin };
  }, [pvp, entrada, km, tin, conManto]);

  const entradaMax = Math.min(pvp * 0.9, 12000);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0d12",
      fontFamily: "'DM Sans', sans-serif",
      padding: "24px 16px",
      color: "#f3f4f6"
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0d12; }
        ::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
      `}</style>

      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "6px",
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "14px", fontWeight: "800", fontFamily: "'DM Mono', monospace", color: "#fff"
            }}>D</div>
            <span style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#6b7280", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>DACIA PREFERENCE · DPRC</span>
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>Simulador de cuota</h1>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0", fontFamily: "'DM Mono', monospace" }}>Fórmula balloon · TIN fijo · 48 cuotas + VMG</p>
        </div>

        {/* Cuota destacada */}
        <div style={{
          background: "linear-gradient(135deg, #1c1107, #111827)",
          border: "1px solid rgba(249,115,22,0.3)",
          borderRadius: "16px", padding: "24px", marginBottom: "20px",
          position: "relative", overflow: "hidden"
        }}>
          <div style={{
            position: "absolute", top: -30, right: -30, width: "120px", height: "120px",
            background: "radial-gradient(circle, rgba(249,115,22,0.12), transparent 70%)",
            borderRadius: "50%"
          }} />
          <div style={{ fontSize: "11px", color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: "4px" }}>Cuota mensual estimada</div>
          <div style={{ fontSize: "52px", fontWeight: "800", color: "#f97316", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
            {fmt(R.cuota)}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px", fontFamily: "'DM Mono', monospace" }}>
            × 48 meses + VMG {fmt(R.vmg)} en mes 49
          </div>
        </div>

        {/* Métricas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
          <Metric label="Coste total" value={fmt(R.costeTotal)} />
          <Metric label="Sobrecoste" value={fmt(R.sobrecosto)} highlight />
          <Metric label="VMG (mes 49)" value={fmt(R.vmg)} small />
          <Metric label="Total financiado" value={fmt(R.totalFin)} small />
        </div>

        {/* Controles */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px", padding: "20px", marginBottom: "20px"
        }}>
          <div style={{ fontSize: "11px", color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: "20px" }}>Parámetros</div>

          <Slider
            label="PVP del coche"
            value={pvp} min={10000} max={25000} step={100}
            onChange={(v) => { setPvp(v); setEntrada(Math.min(entrada, v * 0.9)); }}
          />
          <Slider
            label="Entrada inicial"
            value={entrada} min={0} max={entradaMax} step={100}
            onChange={setEntrada}
          />
          <Slider
            label="Kilometraje total"
            value={km} min={30000} max={120000} step={5000}
            display={km.toLocaleString("es-ES") + " km"}
            onChange={setKm}
          />
          <Slider
            label="TIN (%)"
            value={tin} min={1} max={15} step={0.05}
            display={tin.toFixed(2) + " %"}
            onChange={setTin}
          />

          {/* Toggle mantenimiento */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px",
            background: conManto ? "rgba(249,115,22,0.1)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${conManto ? "rgba(249,115,22,0.3)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: "10px"
          }}>
            <div>
              <div style={{ fontSize: "12px", color: "#d1d5db", fontWeight: "600" }}>Plan Mantenimiento</div>
              <div style={{ fontSize: "11px", color: "#6b7280", fontFamily: "'DM Mono', monospace" }}>48 meses / 60.000 km · +{fmt(MANTENIMIENTO)}</div>
            </div>
            <button
              onClick={() => setConManto(!conManto)}
              style={{
                width: "44px", height: "24px", borderRadius: "12px",
                background: conManto ? "#f97316" : "#374151",
                border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s"
              }}
            >
              <div style={{
                position: "absolute", top: "3px", left: conManto ? "23px" : "3px",
                width: "18px", height: "18px", borderRadius: "50%",
                background: "#fff", transition: "left 0.2s"
              }} />
            </button>
          </div>
        </div>

        {/* Desglose */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px", padding: "20px", marginBottom: "20px"
        }}>
          <div style={{ fontSize: "11px", color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: "16px" }}>Desglose del capital financiado</div>
          {[
            ["Capital (PVP - entrada)",  fmt(R.capital)],
            ["Comisión apertura",        fmt(R.comision)],
            ["Gastos Registro B. Muebles", fmt(GASTOS_REG)],
            ["Protección de Pagos",      fmt(PROT_PAGOS)],
            ...(conManto ? [["Plan Mantenimiento", fmt(MANTENIMIENTO)]] : []),
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "12px", color: "#9ca3af", fontFamily: "'DM Mono', monospace" }}>{l}</span>
              <span style={{ fontSize: "12px", color: "#e5e7eb", fontFamily: "'DM Mono', monospace" }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#f3f4f6", fontFamily: "'DM Mono', monospace" }}>TOTAL FINANCIADO</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#f97316", fontFamily: "'DM Mono', monospace" }}>{fmt(R.totalFin)}</span>
          </div>
        </div>

        {/* Comparativa con las dos ofertas reales */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px", padding: "20px"
        }}>
          <div style={{ fontSize: "11px", color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: "16px" }}>Vs. ofertas reales del documento</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                {["", "80.000 km", "60.000 km", "Tuya"].map((h, i) => (
                  <th key={h} style={{ padding: "0 0 8px", fontSize: "10px", color: i === 3 ? "#f97316" : "#6b7280", textAlign: i === 0 ? "left" : "right", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: "700" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompRow label="Cuota"         v1="108,91 €"   v2="75,23 €"    vCalc={fmt(R.cuota)} />
              <CompRow label="VMG"           v1="8.230,03 €" v2="8.585,84 €" vCalc={fmt(R.vmg)} />
              <CompRow label="Financiado"    v1="10.420,67 €" v2="9.297,39 €" vCalc={fmt(R.totalFin)} />
              <CompRow label="Coste total"   v1={fmt(6000 + 108.91*48 + 8230.03)} v2={fmt(6000 + 75.23*48 + 8585.84)} vCalc={fmt(R.costeTotal)} highlight />
            </tbody>
          </table>
          <div style={{ marginTop: "14px", padding: "10px 12px", background: "rgba(249,115,22,0.07)", borderRadius: "8px", borderLeft: "3px solid #f97316" }}>
            <div style={{ fontSize: "11px", color: "#9ca3af", fontFamily: "'DM Mono', monospace" }}>
              Sobrecoste financiación: <span style={{ color: "#f97316", fontWeight: "700" }}>{fmt(R.sobrecosto)}</span>
              {" "}({R.porcentajeFin.toFixed(1).replace(".", ",")}% sobre PVP)
            </div>
          </div>
        </div>

        <div style={{ marginTop: "20px", fontSize: "10px", color: "#374151", textAlign: "center", fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>
          Modelo estimado con 2 puntos de datos reales · VMG y comisión interpolados linealmente por km
          <br />Los valores reales pueden diferir según las condiciones del concesionario
        </div>
      </div>
    </div>
  );
}
