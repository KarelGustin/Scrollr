"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Chart: any;
  }
}

export default function MarketResearchPage() {
  const chartsInitialized = useRef(false);

  useEffect(() => {
    if (chartsInitialized.current) return;

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0";
    script.onload = () => {
      chartsInitialized.current = true;
      initCharts();
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup not needed for CDN script
    };
  }, []);

  function initCharts() {
    const Chart = window.Chart;
    if (!Chart) return;

    // Market Size Chart
    const marketCtx = document.getElementById("marketSizeChart") as HTMLCanvasElement;
    if (marketCtx) {
      new Chart(marketCtx, {
        type: "bar",
        data: {
          labels: ["2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030", "2031"],
          datasets: [{
            label: "Social Commerce Market ($T)",
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
      });
    }

    // Scaling Chart
    const scalingCtx = document.getElementById("scalingChart") as HTMLCanvasElement;
    if (scalingCtx) {
      new Chart(scalingCtx, {
        type: "bar",
        data: {
          labels: ["10 Creators", "100 Creators", "1K Creators", "10K Creators"],
          datasets: [
            { label: "Monthly GMV (€)", data: [20800, 208000, 2080000, 20800000], backgroundColor: "rgba(59, 130, 246, 0.6)", borderRadius: 6 },
            { label: "Monthly Net Revenue (€)", data: [1173, 11728, 117280, 1172800], backgroundColor: "rgba(255, 107, 74, 0.8)", borderRadius: 6 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { type: "logarithmic", ticks: { callback: (v: any) => v >= 1000000 ? "€" + (v / 1000000) + "M" : v >= 1000 ? "€" + (v / 1000) + "K" : "€" + v } },
          },
        },
      });
    }

    // Valuation Chart
    const valCtx = document.getElementById("valuationChart") as HTMLCanvasElement;
    if (valCtx) {
      new Chart(valCtx, {
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
      });
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-text">Market Research</h1>
        <p className="text-muted text-sm mt-1">Scrollr business intelligence — updated March 2026</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Social Commerce TAM", value: "$2T+", sub: "2026 projected" },
          { label: "Market CAGR", value: "29%", sub: "Through 2031" },
          { label: "TikTok Shop GMV", value: "$66B", sub: "2025 actual" },
          { label: "UGC Market", value: "$7.6B", sub: "Growing to $27B" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-5">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="text-2xl font-display font-bold text-accent mt-1">{s.value}</p>
            <p className="text-xs text-muted mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Market Size Chart */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-display font-bold text-text mb-4">Social Commerce Market Size</h2>
        <div style={{ height: 300 }}>
          <canvas id="marketSizeChart"></canvas>
        </div>
      </div>

      {/* Revenue Model */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-display font-bold text-text mb-4">Revenue per €100 Order</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-muted font-medium text-xs uppercase">Line Item</th>
              <th className="text-right py-2 text-muted font-medium text-xs uppercase">Amount</th>
              <th className="text-left py-2 text-muted font-medium text-xs uppercase pl-4">Who</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border"><td className="py-2">Merchant payout</td><td className="text-right">€85.00</td><td className="pl-4 text-muted">Merchant</td></tr>
            <tr className="border-b border-border"><td className="py-2 font-semibold text-accent">Scrollr platform fee</td><td className="text-right font-semibold text-accent">€12.00</td><td className="pl-4 text-muted">Scrollr</td></tr>
            <tr className="border-b border-border"><td className="py-2">Creator commission</td><td className="text-right">€3.00</td><td className="pl-4 text-muted">Creator</td></tr>
            <tr className="border-b border-border"><td className="py-2">Stripe processing</td><td className="text-right">€3.20</td><td className="pl-4 text-muted">Stripe</td></tr>
            <tr className="bg-accent/5"><td className="py-2 font-bold">Net Revenue</td><td className="text-right font-bold">€8.80</td><td className="pl-4 text-muted font-semibold">~8.8% net take</td></tr>
          </tbody>
        </table>
      </div>

      {/* Scaling Scenarios */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-display font-bold text-text mb-4">Scaling Scenarios</h2>
        <div style={{ height: 350 }}>
          <canvas id="scalingChart"></canvas>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-display font-bold text-text mb-4">Revenue by Creator Count (Monthly)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted font-medium text-xs uppercase">Metric</th>
                <th className="text-right py-2 text-muted font-medium text-xs uppercase">10</th>
                <th className="text-right py-2 text-muted font-medium text-xs uppercase">100</th>
                <th className="text-right py-2 text-muted font-medium text-xs uppercase">1,000</th>
                <th className="text-right py-2 text-muted font-medium text-xs uppercase">10,000</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border"><td className="py-2">Monthly GMV</td><td className="text-right">€20.8K</td><td className="text-right">€208K</td><td className="text-right">€2.08M</td><td className="text-right">€20.8M</td></tr>
              <tr className="border-b border-border"><td className="py-2">Monthly Orders</td><td className="text-right">320</td><td className="text-right">3,200</td><td className="text-right">32,000</td><td className="text-right">320,000</td></tr>
              <tr className="border-b border-border font-semibold text-accent"><td className="py-2">Scrollr Revenue (12%)</td><td className="text-right">€2.5K</td><td className="text-right">€25K</td><td className="text-right">€250K</td><td className="text-right">€2.5M</td></tr>
              <tr className="border-b border-border"><td className="py-2">Net Revenue</td><td className="text-right">€1.2K</td><td className="text-right">€11.7K</td><td className="text-right">€117K</td><td className="text-right">€1.17M</td></tr>
              <tr className="border-b border-border"><td className="py-2">Monthly Costs</td><td className="text-right">-€270</td><td className="text-right">-€1.3K</td><td className="text-right">-€9.4K</td><td className="text-right">-€45K</td></tr>
              <tr className="bg-success/10 font-bold"><td className="py-2">Monthly Profit</td><td className="text-right">€903</td><td className="text-right">€10.4K</td><td className="text-right">€108K</td><td className="text-right">€1.13M</td></tr>
              <tr className="bg-success/10 font-bold"><td className="py-2">Annual Profit</td><td className="text-right">€10.8K</td><td className="text-right">€125K</td><td className="text-right">€1.29M</td><td className="text-right">€13.5M</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Competitors */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-display font-bold text-text mb-4">Competitive Landscape</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted font-medium text-xs uppercase">Feature</th>
                <th className="text-center py-2 text-xs">TikTok Shop</th>
                <th className="text-center py-2 text-xs">LTK</th>
                <th className="text-center py-2 text-xs">Whatnot</th>
                <th className="text-center py-2 text-xs">Billo/UGC</th>
                <th className="text-center py-2 text-xs font-bold text-accent">Scrollr</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Video feed", "✅", "❌", "✅", "❌", "✅"],
                ["Merchant storefront", "❌", "❌", "❌", "❌", "✅"],
                ["In-platform checkout", "✅", "❌", "✅", "❌", "✅"],
                ["Shopify integration", "Partial", "Affiliate", "❌", "❌", "✅ Deep"],
                ["Creator commissions", "Varies", "✅", "Seller", "Flat", "3% auto"],
                ["Multi-merchant cart", "✅", "❌", "❌", "❌", "✅"],
                ["Brand storefront", "❌", "❌", "❌", "❌", "✅"],
              ].map(([feature, ...vals]) => (
                <tr key={feature} className="border-b border-border">
                  <td className="py-2">{feature}</td>
                  {vals.map((v, i) => (
                    <td key={i} className={`text-center py-2 ${i === 4 ? "font-bold text-accent" : ""}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Valuation */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-display font-bold text-text mb-4">3-Year Valuation Scenarios</h2>
        <div style={{ height: 350 }}>
          <canvas id="valuationChart"></canvas>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { scenario: "Conservative", creators: "1,000", revenue: "€1.4M", multiple: "6x", valuation: "€8.4M", color: "text-warning" },
            { scenario: "Moderate", creators: "5,000", revenue: "€7M", multiple: "8x", valuation: "€56M", color: "text-social" },
            { scenario: "Optimistic", creators: "10,000", revenue: "€14M", multiple: "12x", valuation: "€168M", color: "text-success" },
          ].map((s) => (
            <div key={s.scenario} className="text-center p-4 bg-card rounded-xl border border-border">
              <p className={`text-xs font-semibold uppercase ${s.color}`}>{s.scenario}</p>
              <p className="text-2xl font-display font-bold text-text mt-2">{s.valuation}</p>
              <p className="text-xs text-muted mt-1">{s.creators} creators • {s.revenue} ARR • {s.multiple}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Growth Timeline */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-display font-bold text-text mb-4">Growth Timeline</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted font-medium text-xs uppercase">Quarter</th>
                <th className="text-right py-2 text-muted text-xs uppercase">Creators</th>
                <th className="text-right py-2 text-muted text-xs uppercase">Merchants</th>
                <th className="text-right py-2 text-muted text-xs uppercase">Monthly GMV</th>
                <th className="text-right py-2 text-muted text-xs uppercase">Revenue</th>
                <th className="text-left py-2 text-muted text-xs uppercase pl-4">Milestone</th>
              </tr>
            </thead>
            <tbody>
              {[
                { q: "Q2 2026", c: "10", m: "5", gmv: "€20K", rev: "€1.2K", ms: "MVP live", mc: "bg-warning/20 text-warning" },
                { q: "Q4 2026", c: "50", m: "20", gmv: "€104K", rev: "€5.9K", ms: "PMF signal", mc: "bg-social/20 text-social" },
                { q: "Q2 2027", c: "200", m: "80", gmv: "€416K", rev: "€23.5K", ms: "Seed fundable", mc: "bg-accent/20 text-accent" },
                { q: "Q4 2027", c: "500", m: "150", gmv: "€1.04M", rev: "€58.6K", ms: "Profitable", mc: "bg-success/20 text-success" },
                { q: "Q2 2028", c: "1,500", m: "400", gmv: "€3.12M", rev: "€176K", ms: "Series A", mc: "bg-accent/20 text-accent" },
                { q: "Q4 2029", c: "10,000", m: "2,000", gmv: "€20.8M", rev: "€1.17M", ms: "Exit target", mc: "bg-success/20 text-success" },
              ].map((r) => (
                <tr key={r.q} className="border-b border-border">
                  <td className="py-2 font-medium">{r.q}</td>
                  <td className="text-right">{r.c}</td>
                  <td className="text-right">{r.m}</td>
                  <td className="text-right">{r.gmv}</td>
                  <td className="text-right">{r.rev}</td>
                  <td className="pl-4"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${r.mc}`}>{r.ms}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Potential acquirers */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-display font-bold text-text mb-4">Potential Acquirers</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      <p className="text-xs text-muted text-center pb-8">Sources: Mordor Intelligence, Grand View Research, Sacra, TechCrunch, Business of Fashion, Aventis Advisors, SaaS Capital</p>
    </div>
  );
}
