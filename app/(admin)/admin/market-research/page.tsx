"use client";

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    Chart: any;
  }
}

const AOV = 65; // Average order value €
const ORDERS_PER_CREATOR = 32; // Monthly orders per active creator
const STRIPE_FIXED = 0.25;
const STRIPE_PERCENT = 2.9;

function fmt(n: number, decimals = 0): string {
  if (n >= 1_000_000) return "€" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "€" + (n / 1_000).toFixed(decimals > 0 ? decimals : 1) + "K";
  return "€" + n.toFixed(decimals);
}

function calcMetrics(creators: number, creatorPct: number) {
  const platformPct = 85 + creatorPct > 100 ? 0 : (100 - 85 - creatorPct);
  const scrollrPct = platformPct;
  const orders = creators * ORDERS_PER_CREATOR;
  const gmv = orders * AOV;
  const scrollrGross = gmv * (scrollrPct / 100);
  const creatorPay = gmv * (creatorPct / 100);
  const stripeFees = orders * STRIPE_FIXED + gmv * (STRIPE_PERCENT / 100);
  const netRevenue = scrollrGross - stripeFees;
  const infra = Math.min(creators * 0.5 + 200, gmv * 0.003 + 500);
  const support = creators > 100 ? creators * 0.3 : 0;
  const costs = infra + support + stripeFees;
  const profit = scrollrGross - costs;
  return { orders, gmv, scrollrGross, creatorPay, stripeFees, netRevenue, scrollrPct, costs, profit, infra, support };
}

export default function MarketResearchPage() {
  const [creatorCount, setCreatorCount] = useState(100);
  const [creatorPct, setCreatorPct] = useState(5);
  const chartsLoaded = useRef(false);
  const chartInstances = useRef<any[]>([]);

  const m = calcMetrics(creatorCount, creatorPct);

  const destroyCharts = useCallback(() => {
    chartInstances.current.forEach((c) => c?.destroy());
    chartInstances.current = [];
  }, []);

  useEffect(() => {
    if (chartsLoaded.current) return;
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0";
    script.onload = () => {
      chartsLoaded.current = true;
      buildCharts();
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (chartsLoaded.current) buildCharts();
  }, [creatorCount, creatorPct]);

  function buildCharts() {
    const Chart = window.Chart;
    if (!Chart) return;
    destroyCharts();

    // Market Size
    const mCtx = document.getElementById("marketSizeChart") as HTMLCanvasElement;
    if (mCtx) {
      chartInstances.current.push(
        new Chart(mCtx, {
          type: "bar",
          data: {
            labels: ["2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030", "2031"],
            datasets: [{
              label: "Social Commerce ($T)",
              data: [0.95, 1.25, 1.63, 2.11, 2.73, 3.53, 4.56, 5.89, 7.55],
              backgroundColor: "rgba(255, 107, 74, 0.7)",
              borderRadius: 6,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => "$" + v + "T" } } },
          },
        })
      );
    }

    // Sensitivity: commission % impact
    const sensCtx = document.getElementById("sensitivityChart") as HTMLCanvasElement;
    if (sensCtx) {
      const pcts = [3, 5, 7, 10, 12, 15];
      const scrollrRevs = pcts.map((p) => calcMetrics(creatorCount, p).scrollrGross);
      const creatorPays = pcts.map((p) => calcMetrics(creatorCount, p).creatorPay);
      chartInstances.current.push(
        new Chart(sensCtx, {
          type: "bar",
          data: {
            labels: pcts.map((p) => p + "% creator"),
            datasets: [
              { label: "Scrollr Revenue", data: scrollrRevs, backgroundColor: "rgba(255, 107, 74, 0.8)", borderRadius: 6 },
              { label: "Creator Payout", data: creatorPays, backgroundColor: "rgba(59, 130, 246, 0.6)", borderRadius: 6 },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } },
            scales: { y: { ticks: { callback: (v: any) => v >= 1000 ? "€" + (v / 1000).toFixed(0) + "K" : "€" + v } } },
          },
        })
      );
    }

    // Scaling chart
    const scCtx = document.getElementById("scalingChart") as HTMLCanvasElement;
    if (scCtx) {
      const tiers = [10, 100, 1000, 10000];
      chartInstances.current.push(
        new Chart(scCtx, {
          type: "bar",
          data: {
            labels: tiers.map((t) => t >= 1000 ? (t / 1000) + "K" : t + ""),
            datasets: [
              { label: "Monthly GMV", data: tiers.map((t) => calcMetrics(t, creatorPct).gmv), backgroundColor: "rgba(59, 130, 246, 0.6)", borderRadius: 6 },
              { label: "Scrollr Revenue", data: tiers.map((t) => calcMetrics(t, creatorPct).scrollrGross), backgroundColor: "rgba(255, 107, 74, 0.8)", borderRadius: 6 },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { type: "logarithmic", ticks: { callback: (v: any) => v >= 1000000 ? "€" + (v / 1000000) + "M" : v >= 1000 ? "€" + (v / 1000) + "K" : "€" + v } },
            },
            plugins: { legend: { position: "bottom" } },
          },
        })
      );
    }

    // Valuation
    const vCtx = document.getElementById("valuationChart") as HTMLCanvasElement;
    if (vCtx) {
      chartInstances.current.push(
        new Chart(vCtx, {
          type: "bar",
          data: {
            labels: ["Year 1", "Year 2", "Year 3"],
            datasets: [
              { label: "Conservative (6x)", data: [1.8, 4.2, 8.4], backgroundColor: "rgba(245, 158, 11, 0.6)", borderRadius: 6 },
              { label: "Moderate (8x)", data: [2.4, 16, 56], backgroundColor: "rgba(59, 130, 246, 0.6)", borderRadius: 6 },
              { label: "Optimistic (12x)", data: [3.6, 36, 168], backgroundColor: "rgba(34, 197, 94, 0.6)", borderRadius: 6 },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { ticks: { callback: (v: any) => "€" + v + "M" } } },
            plugins: { legend: { position: "bottom" } },
          },
        })
      );
    }
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-display font-bold text-text">Market Research</h1>
        <p className="text-muted text-sm mt-1">Scrollr business intelligence — updated March 2026</p>
      </div>

      {/* Interactive Controls */}
      <div className="bg-accent/5 rounded-2xl border border-accent/20 p-4 sm:p-6">
        <h2 className="text-base font-display font-bold text-text mb-4">Interactive Model</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted">Active Creators</span>
              <span className="font-bold text-text text-lg">{creatorCount.toLocaleString()}</span>
            </label>
            <input
              type="range"
              min={10}
              max={10000}
              step={10}
              value={creatorCount}
              onChange={(e) => setCreatorCount(Number(e.target.value))}
              className="w-full h-2 bg-border rounded-full appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>10</span>
              <span>100</span>
              <span>1K</span>
              <span>10K</span>
            </div>
          </div>
          <div>
            <label className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted">Creator Commission</span>
              <span className="font-bold text-text text-lg">{creatorPct}%</span>
            </label>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={creatorPct}
              onChange={(e) => setCreatorPct(Number(e.target.value))}
              className="w-full h-2 bg-border rounded-full appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>1%</span>
              <span>5%</span>
              <span>10%</span>
              <span>15%</span>
            </div>
          </div>
        </div>

        {/* Live results */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { label: "Monthly GMV", value: fmt(m.gmv), color: "text-text" },
            { label: `Scrollr (${m.scrollrPct}%)`, value: fmt(m.scrollrGross), color: "text-accent" },
            { label: `Creator (${creatorPct}%)`, value: fmt(m.creatorPay), color: "text-social" },
            { label: "Net Profit", value: fmt(m.profit), color: m.profit >= 0 ? "text-success" : "text-destructive" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-3 text-center">
              <p className="text-[10px] sm:text-xs text-muted truncate">{s.label}</p>
              <p className={`text-lg sm:text-xl font-display font-bold ${s.color} mt-0.5`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Social Commerce TAM", value: "$2T+", sub: "2026 projected" },
          { label: "Market CAGR", value: "29%", sub: "Through 2031" },
          { label: "TikTok Shop GMV", value: "$66B", sub: "2025 actual" },
          { label: "UGC Market", value: "$7.6B", sub: "Growing to $27B" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs text-muted">{s.label}</p>
            <p className="text-xl sm:text-2xl font-display font-bold text-accent mt-1">{s.value}</p>
            <p className="text-[10px] sm:text-xs text-muted mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Market Size Chart */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-display font-bold text-text mb-4">Social Commerce Market Size</h2>
        <div className="h-[250px] sm:h-[300px]">
          <canvas id="marketSizeChart"></canvas>
        </div>
      </div>

      {/* Revenue per €100 */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-display font-bold text-text mb-4">Revenue per €100 Order</h2>
        <div className="space-y-2">
          {[
            { label: "Merchant payout", amount: "€85.00", who: "Merchant", bold: false },
            { label: "Scrollr platform fee", amount: `€${(100 - 85 - creatorPct).toFixed(2)}`, who: "Scrollr", bold: true, accent: true },
            { label: "Creator commission", amount: `€${creatorPct.toFixed(2)}`, who: "Creator", bold: false },
            { label: "Stripe processing", amount: "€3.15", who: "Stripe", bold: false },
            { label: "Net Revenue", amount: `€${(100 - 85 - creatorPct - 3.15).toFixed(2)}`, who: `~${(100 - 85 - creatorPct - 3.15).toFixed(1)}% net`, bold: true, bg: true },
          ].map((r) => (
            <div key={r.label} className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${r.bg ? "bg-accent/5" : "border-b border-border"}`}>
              <span className={`${r.bold ? "font-semibold" : ""} ${r.accent ? "text-accent" : "text-text"}`}>{r.label}</span>
              <div className="flex items-center gap-3">
                <span className={`${r.bold ? "font-semibold" : ""} ${r.accent ? "text-accent" : ""}`}>{r.amount}</span>
                <span className="text-[10px] text-muted w-16 text-right hidden sm:block">{r.who}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Sensitivity Analysis */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-display font-bold text-text mb-2">Commission Sensitivity Analysis</h2>
        <p className="text-xs text-muted mb-4">Impact of creator commission % on revenue with {creatorCount.toLocaleString()} creators</p>
        <div className="h-[250px] sm:h-[300px]">
          <canvas id="sensitivityChart"></canvas>
        </div>

        {/* Sensitivity Table */}
        <div className="mt-4 -mx-4 sm:mx-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm" style={{ minWidth: 500 }}>
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted font-medium text-[10px] sm:text-xs uppercase">Creator %</th>
                  <th className="text-right py-2 px-2 text-muted font-medium text-[10px] sm:text-xs uppercase">Scrollr %</th>
                  <th className="text-right py-2 px-2 text-muted font-medium text-[10px] sm:text-xs uppercase">Scrollr Rev</th>
                  <th className="text-right py-2 px-2 text-muted font-medium text-[10px] sm:text-xs uppercase">Creator Pay</th>
                  <th className="text-right py-2 px-2 text-muted font-medium text-[10px] sm:text-xs uppercase">Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {[3, 5, 7, 10, 12, 15].map((pct) => {
                  const r = calcMetrics(creatorCount, pct);
                  const isActive = pct === creatorPct;
                  return (
                    <tr key={pct} className={`border-b border-border ${isActive ? "bg-accent/10 font-semibold" : ""}`}>
                      <td className="py-2 px-2">{pct}%{isActive ? " ←" : ""}</td>
                      <td className="text-right py-2 px-2">{r.scrollrPct}%</td>
                      <td className="text-right py-2 px-2 text-accent">{fmt(r.scrollrGross)}</td>
                      <td className="text-right py-2 px-2 text-social">{fmt(r.creatorPay)}</td>
                      <td className={`text-right py-2 px-2 ${r.profit >= 0 ? "text-success" : "text-destructive"}`}>{fmt(r.profit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Scaling Scenarios */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-display font-bold text-text mb-2">Scaling Scenarios</h2>
        <p className="text-xs text-muted mb-4">At {creatorPct}% creator commission</p>
        <div className="h-[250px] sm:h-[350px]">
          <canvas id="scalingChart"></canvas>
        </div>
      </div>

      {/* Revenue by Creator Count Table */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-display font-bold text-text mb-4">Revenue by Creator Count (Monthly)</h2>
        <div className="-mx-4 sm:mx-0 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm" style={{ minWidth: 480 }}>
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted font-medium text-[10px] sm:text-xs uppercase">Metric</th>
                {[10, 100, 1000, 10000].map((t) => (
                  <th key={t} className="text-right py-2 px-2 text-muted font-medium text-[10px] sm:text-xs uppercase">{t >= 1000 ? (t / 1000) + "K" : t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const tiers = [10, 100, 1000, 10000];
                const rows = tiers.map((t) => calcMetrics(t, creatorPct));
                return (
                  <>
                    <tr className="border-b border-border">
                      <td className="py-2 px-2">Monthly GMV</td>
                      {rows.map((r, i) => <td key={i} className="text-right py-2 px-2">{fmt(r.gmv)}</td>)}
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-2 px-2">Orders</td>
                      {rows.map((r, i) => <td key={i} className="text-right py-2 px-2">{r.orders.toLocaleString()}</td>)}
                    </tr>
                    <tr className="border-b border-border font-semibold text-accent">
                      <td className="py-2 px-2">Scrollr ({rows[0].scrollrPct}%)</td>
                      {rows.map((r, i) => <td key={i} className="text-right py-2 px-2">{fmt(r.scrollrGross)}</td>)}
                    </tr>
                    <tr className="border-b border-border text-social">
                      <td className="py-2 px-2">Creator ({creatorPct}%)</td>
                      {rows.map((r, i) => <td key={i} className="text-right py-2 px-2">{fmt(r.creatorPay)}</td>)}
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-2 px-2">Stripe Fees</td>
                      {rows.map((r, i) => <td key={i} className="text-right py-2 px-2">-{fmt(r.stripeFees)}</td>)}
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-2 px-2">Infra + Support</td>
                      {rows.map((r, i) => <td key={i} className="text-right py-2 px-2">-{fmt(r.infra + r.support)}</td>)}
                    </tr>
                    <tr className="bg-success/10 font-bold">
                      <td className="py-2 px-2">Monthly Profit</td>
                      {rows.map((r, i) => <td key={i} className={`text-right py-2 px-2 ${r.profit >= 0 ? "text-success" : "text-destructive"}`}>{fmt(r.profit)}</td>)}
                    </tr>
                    <tr className="bg-success/10 font-bold">
                      <td className="py-2 px-2">Annual Profit</td>
                      {rows.map((r, i) => <td key={i} className={`text-right py-2 px-2 ${r.profit >= 0 ? "text-success" : "text-destructive"}`}>{fmt(r.profit * 12)}</td>)}
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Break-Even Analysis */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-display font-bold text-text mb-4">Break-Even Analysis by Commission</h2>
        <div className="-mx-4 sm:mx-0 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm" style={{ minWidth: 400 }}>
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted font-medium text-[10px] sm:text-xs uppercase">Creator %</th>
                <th className="text-right py-2 px-2 text-muted font-medium text-[10px] sm:text-xs uppercase">Scrollr %</th>
                <th className="text-right py-2 px-2 text-muted font-medium text-[10px] sm:text-xs uppercase">Margin/Order</th>
                <th className="text-right py-2 px-2 text-muted font-medium text-[10px] sm:text-xs uppercase">Break-Even Orders</th>
              </tr>
            </thead>
            <tbody>
              {[3, 5, 7, 10, 12, 15].map((pct) => {
                const scrollrPct = Math.max(0, 100 - 85 - pct);
                const marginPerOrder = AOV * (scrollrPct / 100) - (AOV * STRIPE_PERCENT / 100 + STRIPE_FIXED);
                const fixedCosts = 500; // Monthly minimum
                const breakEven = marginPerOrder > 0 ? Math.ceil(fixedCosts / marginPerOrder) : Infinity;
                const isActive = pct === creatorPct;
                return (
                  <tr key={pct} className={`border-b border-border ${isActive ? "bg-accent/10 font-semibold" : ""}`}>
                    <td className="py-2 px-2">{pct}%{isActive ? " ←" : ""}</td>
                    <td className="text-right py-2 px-2">{scrollrPct}%</td>
                    <td className="text-right py-2 px-2">{marginPerOrder > 0 ? `€${marginPerOrder.toFixed(2)}` : "Negative"}</td>
                    <td className={`text-right py-2 px-2 ${breakEven === Infinity ? "text-destructive" : ""}`}>{breakEven === Infinity ? "N/A" : breakEven.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Competitors */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-display font-bold text-text mb-4">Competitive Landscape</h2>
        <div className="-mx-4 sm:mx-0 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm" style={{ minWidth: 500 }}>
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted font-medium text-[10px] sm:text-xs uppercase">Feature</th>
                <th className="text-center py-2 px-2 text-[10px] sm:text-xs">TikTok</th>
                <th className="text-center py-2 px-2 text-[10px] sm:text-xs">LTK</th>
                <th className="text-center py-2 px-2 text-[10px] sm:text-xs">Whatnot</th>
                <th className="text-center py-2 px-2 text-[10px] sm:text-xs font-bold text-accent">Scrollr</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Video feed", "✅", "❌", "✅", "✅"],
                ["Merchant store", "❌", "❌", "❌", "✅"],
                ["In-app checkout", "✅", "❌", "✅", "✅"],
                ["Shopify sync", "Partial", "Affiliate", "❌", "✅ Deep"],
                ["Creator pay", "Varies", "✅", "Seller", `${creatorPct}% auto`],
                ["Multi-merchant", "✅", "❌", "❌", "✅"],
                ["EU-first", "❌", "❌", "❌", "✅"],
              ].map(([feature, ...vals]) => (
                <tr key={feature} className="border-b border-border">
                  <td className="py-2 px-2 whitespace-nowrap">{feature}</td>
                  {vals.map((v, i) => (
                    <td key={i} className={`text-center py-2 px-2 ${i === 3 ? "font-bold text-accent" : ""}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Valuation */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-display font-bold text-text mb-4">3-Year Valuation Scenarios</h2>
        <div className="h-[250px] sm:h-[350px]">
          <canvas id="valuationChart"></canvas>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          {[
            { scenario: "Conservative", creators: "1,000", revenue: "€1.4M", multiple: "6x", valuation: "€8.4M", color: "text-warning" },
            { scenario: "Moderate", creators: "5,000", revenue: "€7M", multiple: "8x", valuation: "€56M", color: "text-social" },
            { scenario: "Optimistic", creators: "10,000", revenue: "€14M", multiple: "12x", valuation: "€168M", color: "text-success" },
          ].map((s) => (
            <div key={s.scenario} className="text-center p-4 bg-card rounded-xl border border-border">
              <p className={`text-xs font-semibold uppercase ${s.color}`}>{s.scenario}</p>
              <p className="text-xl sm:text-2xl font-display font-bold text-text mt-2">{s.valuation}</p>
              <p className="text-[10px] sm:text-xs text-muted mt-1">{s.creators} creators • {s.revenue} ARR • {s.multiple}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Growth Timeline */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-display font-bold text-text mb-4">Growth Timeline</h2>
        <div className="-mx-4 sm:mx-0 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm" style={{ minWidth: 480 }}>
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted text-[10px] sm:text-xs uppercase">Quarter</th>
                <th className="text-right py-2 px-2 text-muted text-[10px] sm:text-xs uppercase">Creators</th>
                <th className="text-right py-2 px-2 text-muted text-[10px] sm:text-xs uppercase">GMV/mo</th>
                <th className="text-right py-2 px-2 text-muted text-[10px] sm:text-xs uppercase">Revenue</th>
                <th className="text-left py-2 px-2 text-muted text-[10px] sm:text-xs uppercase">Milestone</th>
              </tr>
            </thead>
            <tbody>
              {[
                { q: "Q2 2026", c: 10, ms: "MVP live", mc: "bg-warning/20 text-warning" },
                { q: "Q4 2026", c: 50, ms: "PMF signal", mc: "bg-social/20 text-social" },
                { q: "Q2 2027", c: 200, ms: "Seed fundable", mc: "bg-accent/20 text-accent" },
                { q: "Q4 2027", c: 500, ms: "Profitable", mc: "bg-success/20 text-success" },
                { q: "Q2 2028", c: 1500, ms: "Series A", mc: "bg-accent/20 text-accent" },
                { q: "Q4 2029", c: 10000, ms: "Exit target", mc: "bg-success/20 text-success" },
              ].map((r) => {
                const met = calcMetrics(r.c, creatorPct);
                return (
                  <tr key={r.q} className="border-b border-border">
                    <td className="py-2 px-2 font-medium whitespace-nowrap">{r.q}</td>
                    <td className="text-right px-2">{r.c.toLocaleString()}</td>
                    <td className="text-right px-2">{fmt(met.gmv)}</td>
                    <td className="text-right px-2">{fmt(met.scrollrGross)}</td>
                    <td className="px-2"><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${r.mc}`}>{r.ms}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unit Economics */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-display font-bold text-text mb-4">Unit Economics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "AOV", value: `€${AOV}`, sub: "Average order" },
            { label: "Orders/Creator", value: `${ORDERS_PER_CREATOR}`, sub: "Monthly" },
            { label: "Rev/Creator", value: fmt(m.scrollrGross / creatorCount), sub: "Scrollr take" },
            { label: "LTV/Creator", value: fmt((m.scrollrGross / creatorCount) * 18), sub: "18-mo retention" },
          ].map((s) => (
            <div key={s.label} className="bg-surface rounded-xl border border-border p-3 text-center">
              <p className="text-[10px] sm:text-xs text-muted">{s.label}</p>
              <p className="text-lg sm:text-xl font-display font-bold text-text mt-1">{s.value}</p>
              <p className="text-[10px] text-muted mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Acquirers */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-display font-bold text-text mb-4">Potential Acquirers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { name: "Shopify", reason: "Adds discovery/creator layer they lack" },
            { name: "Klarna / Affirm", reason: "Video-driven shopping for BNPL network" },
            { name: "Zalando / ASOS", reason: "Creator acquisition for EU fashion" },
            { name: "PE Roll-up", reason: "4-6x revenue, marketplace consolidation" },
          ].map((a) => (
            <div key={a.name} className="p-4 bg-card rounded-xl border border-border">
              <p className="font-bold text-text">{a.name}</p>
              <p className="text-xs text-muted mt-1">{a.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] sm:text-xs text-muted text-center pb-8">Sources: Mordor Intelligence, Grand View Research, Sacra, TechCrunch, Business of Fashion, Aventis Advisors, SaaS Capital</p>
    </div>
  );
}
