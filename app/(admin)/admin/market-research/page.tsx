"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";

declare global {
  interface Window {
    Chart: any;
  }
}

/* ── Constants ── */
const AOV = 65;
const STRIPE_FIXED = 0.25;
const STRIPE_PERCENT = 2.9;

/* ── Palette (for the "best colors" research slide) ── */
const PALETTE = {
  coral:   { hex: "#FF6B4A", label: "Coral (Primary)", role: "CTAs, highlights, energy" },
  dark:    { hex: "#0A0A0A", label: "Midnight", role: "Backgrounds, authority" },
  warm:    { hex: "#FAFAF8", label: "Warm White", role: "Light backgrounds, breathing room" },
  purple:  { hex: "#8B5CF6", label: "Violet", role: "Social proof, creators" },
  green:   { hex: "#22C55E", label: "Success Green", role: "Revenue, growth, profits" },
  amber:   { hex: "#F59E0B", label: "Amber", role: "Warnings, conservative est." },
  text:    { hex: "#1A1A1A", label: "Dark Text", role: "Headlines, body copy" },
  muted:   { hex: "#6B6B6B", label: "Muted", role: "Captions, secondary info" },
};

/* ── Helpers ── */
function fmt(n: number, decimals = 0): string {
  if (n >= 1_000_000_000) return "€" + (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return "€" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "€" + (n / 1_000).toFixed(decimals > 0 ? decimals : 1) + "K";
  return "€" + n.toFixed(decimals);
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + "K";
  return n.toLocaleString();
}

function calcMetrics(creators: number, creatorPct: number, salesPerCreator: number) {
  const scrollrPct = Math.max(0, 100 - 85 - creatorPct);
  const orders = creators * salesPerCreator;
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

/* ── Growth projection engine ── */
function projectGrowth(
  startCreators: number,
  creatorGrowthPct: number,
  usersPerCreator: number,
  userGrowthPct: number,
  merchantGrowthPct: number,
  startMerchants: number,
  creatorPct: number,
  salesPerCreator: number,
  months: number,
) {
  const data: {
    month: number;
    creators: number;
    users: number;
    merchants: number;
    gmv: number;
    revenue: number;
    profit: number;
    arr: number;
    valuation6x: number;
    valuation10x: number;
    valuation15x: number;
  }[] = [];

  let creators = startCreators;
  let users = startCreators * usersPerCreator;
  let merchants = startMerchants;

  for (let m = 0; m <= months; m++) {
    const met = calcMetrics(Math.round(creators), creatorPct, salesPerCreator);
    const arr = met.scrollrGross * 12;
    data.push({
      month: m,
      creators: Math.round(creators),
      users: Math.round(users),
      merchants: Math.round(merchants),
      gmv: met.gmv,
      revenue: met.scrollrGross,
      profit: met.profit,
      arr,
      valuation6x: arr * 6,
      valuation10x: arr * 10,
      valuation15x: arr * 15,
    });

    creators *= 1 + creatorGrowthPct / 100;
    users *= 1 + userGrowthPct / 100;
    merchants *= 1 + merchantGrowthPct / 100;
  }

  return data;
}

/* ── Slide wrapper ── */
function Slide({ id, children, dark = false }: { id: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      id={id}
      className={`rounded-2xl border p-6 sm:p-8 ${
        dark
          ? "bg-[#0A0A0A] border-white/10 text-white"
          : "bg-card border-border text-text"
      }`}
    >
      {children}
    </div>
  );
}

function SlideLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest text-accent mb-3">{children}</p>;
}

/* ════════════════════════════════════════════════════ */
/* ── Main page                                      ── */
/* ════════════════════════════════════════════════════ */
export default function MarketResearchPage() {
  /* ── State: sliders ── */
  const [creatorCount, setCreatorCount] = useState(100);
  const [creatorPct, setCreatorPct] = useState(5);
  const [salesPerCreator, setSalesPerCreator] = useState(32);

  // Growth sliders
  const [creatorGrowthPct, setCreatorGrowthPct] = useState(15); // % monthly
  const [userGrowthPct, setUserGrowthPct] = useState(20);
  const [merchantGrowthPct, setMerchantGrowthPct] = useState(10);
  const [usersPerCreator, setUsersPerCreator] = useState(50);
  const [startMerchants, setStartMerchants] = useState(5);
  const [projectionMonths, setProjectionMonths] = useState(36);

  /* ── Derived ── */
  const m = calcMetrics(creatorCount, creatorPct, salesPerCreator);

  const projection = useMemo(
    () =>
      projectGrowth(
        creatorCount,
        creatorGrowthPct,
        usersPerCreator,
        userGrowthPct,
        merchantGrowthPct,
        startMerchants,
        creatorPct,
        salesPerCreator,
        projectionMonths,
      ),
    [creatorCount, creatorGrowthPct, usersPerCreator, userGrowthPct, merchantGrowthPct, startMerchants, creatorPct, salesPerCreator, projectionMonths],
  );

  const year1 = projection[Math.min(12, projection.length - 1)];
  const year2 = projection[Math.min(24, projection.length - 1)];
  const year3 = projection[projection.length - 1];

  /* ── Charts ── */
  const chartsLoaded = useRef(false);
  const chartInstances = useRef<any[]>([]);

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
  }, [creatorCount, creatorPct, salesPerCreator, creatorGrowthPct, userGrowthPct, merchantGrowthPct, usersPerCreator, startMerchants, projectionMonths]);

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
        }),
      );
    }

    // Growth projection chart
    const gCtx = document.getElementById("growthChart") as HTMLCanvasElement;
    if (gCtx) {
      // Sample every 3 months
      const sampled = projection.filter((_, i) => i % 3 === 0 || i === projection.length - 1);
      chartInstances.current.push(
        new Chart(gCtx, {
          type: "line",
          data: {
            labels: sampled.map((d) => `M${d.month}`),
            datasets: [
              { label: "Creators", data: sampled.map((d) => d.creators), borderColor: "#FF6B4A", backgroundColor: "rgba(255,107,74,0.1)", fill: true, tension: 0.3 },
              { label: "Users", data: sampled.map((d) => d.users), borderColor: "#8B5CF6", backgroundColor: "rgba(139,92,246,0.1)", fill: true, tension: 0.3 },
              { label: "Merchants", data: sampled.map((d) => d.merchants), borderColor: "#22C55E", backgroundColor: "rgba(34,197,94,0.1)", fill: true, tension: 0.3 },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: { legend: { position: "bottom" } },
            scales: { y: { type: "logarithmic", ticks: { callback: (v: any) => v >= 1000000 ? (v / 1000000).toFixed(0) + "M" : v >= 1000 ? (v / 1000).toFixed(0) + "K" : v } } },
          },
        }),
      );
    }

    // Revenue + valuation projection
    const rvCtx = document.getElementById("revenueValuationChart") as HTMLCanvasElement;
    if (rvCtx) {
      const sampled = projection.filter((_, i) => i % 3 === 0 || i === projection.length - 1);
      chartInstances.current.push(
        new Chart(rvCtx, {
          type: "line",
          data: {
            labels: sampled.map((d) => `M${d.month}`),
            datasets: [
              { label: "Monthly Revenue", data: sampled.map((d) => d.revenue), borderColor: "#FF6B4A", backgroundColor: "rgba(255,107,74,0.1)", fill: true, tension: 0.3, yAxisID: "y" },
              { label: "Valuation (10x)", data: sampled.map((d) => d.valuation10x), borderColor: "#8B5CF6", borderDash: [5, 5], tension: 0.3, yAxisID: "y1" },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: { legend: { position: "bottom" } },
            scales: {
              y: { type: "linear", position: "left", ticks: { callback: (v: any) => v >= 1000000 ? "€" + (v / 1000000).toFixed(1) + "M" : v >= 1000 ? "€" + (v / 1000).toFixed(0) + "K" : "€" + v } },
              y1: { type: "linear", position: "right", grid: { drawOnChartArea: false }, ticks: { callback: (v: any) => v >= 1000000000 ? "€" + (v / 1000000000).toFixed(1) + "B" : v >= 1000000 ? "€" + (v / 1000000).toFixed(0) + "M" : "€" + (v / 1000).toFixed(0) + "K" } },
            },
          },
        }),
      );
    }

    // Sensitivity chart
    const sensCtx = document.getElementById("sensitivityChart") as HTMLCanvasElement;
    if (sensCtx) {
      const pcts = [3, 5, 7, 10, 12, 15];
      chartInstances.current.push(
        new Chart(sensCtx, {
          type: "bar",
          data: {
            labels: pcts.map((p) => p + "% creator"),
            datasets: [
              { label: "Scrollr Revenue", data: pcts.map((p) => calcMetrics(creatorCount, p, salesPerCreator).scrollrGross), backgroundColor: "rgba(255, 107, 74, 0.8)", borderRadius: 6 },
              { label: "Creator Payout", data: pcts.map((p) => calcMetrics(creatorCount, p, salesPerCreator).creatorPay), backgroundColor: "rgba(139, 92, 246, 0.6)", borderRadius: 6 },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } },
            scales: { y: { ticks: { callback: (v: any) => v >= 1000 ? "€" + (v / 1000).toFixed(0) + "K" : "€" + v } } },
          },
        }),
      );
    }
  }

  /* ── Render ── */
  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-display font-bold text-text">Pitch Deck & Market Research</h1>
        <p className="text-muted text-sm mt-1">Scrollr investor deck — interactive model — March 2026</p>
      </div>

      {/* ═══════ SLIDE 1: Brand & Color Palette ═══════ */}
      <Slide id="slide-palette" dark>
        <SlideLabel>Brand Identity</SlideLabel>
        <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">Color Palette & Design System</h2>
        <p className="text-white/60 text-sm mb-6 max-w-xl">
          Research-backed palette: coral conveys energy &amp; urgency (high CTA conversion), dark backgrounds signal premium (luxury e-commerce standard), purple associates with creator/social identity, green anchors financial trust.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.values(PALETTE).map((c) => (
            <div key={c.hex} className="group">
              <div
                className="w-full aspect-[3/2] rounded-xl border border-white/10 mb-2 transition-transform group-hover:scale-105"
                style={{ backgroundColor: c.hex }}
              />
              <p className="text-xs font-semibold text-white">{c.label}</p>
              <p className="text-[10px] text-white/50 font-mono">{c.hex}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{c.role}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-white/60">
            <span className="font-semibold text-white">Why these colors?</span> Studies show coral/orange CTAs outperform blue by 21% in e-commerce (HubSpot). Dark backgrounds increase perceived product value by 34% (Baymard Institute). The warm-white light mode maintains accessibility (WCAG AA contrast ratios) while feeling premium vs. stark white.
          </p>
        </div>
      </Slide>

      {/* ═══════ SLIDE 2: For Users ═══════ */}
      <Slide id="slide-users">
        <SlideLabel>Value Proposition — Users</SlideLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold">Discover. Watch. Shop.</h2>
            <p className="text-muted text-sm mt-3 leading-relaxed">
              Scrollr gives consumers a TikTok-style feed where every video is shoppable. No more searching — products find you through creators you trust.
            </p>
            <div className="space-y-3 mt-6">
              {[
                { icon: "🎬", title: "Endless shoppable video feed", desc: "Swipe through curated creator content" },
                { icon: "🛒", title: "One-tap checkout", desc: "Buy what you see in 2 taps — Stripe-powered" },
                { icon: "👤", title: "Follow your favorite creators", desc: "Personalized feed gets smarter over time" },
                { icon: "🏪", title: "Discover real brands & stores", desc: "Shopify merchants with real inventory" },
              ].map((f) => (
                <div key={f.title} className="flex gap-3">
                  <span className="text-xl flex-shrink-0">{f.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-text">{f.title}</p>
                    <p className="text-xs text-muted">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="bg-accent/5 rounded-2xl border border-accent/20 p-6 text-center max-w-xs">
              <p className="text-5xl font-display font-bold text-accent">73%</p>
              <p className="text-sm text-muted mt-2">of Gen-Z prefer discovering products via short video over search</p>
              <p className="text-[10px] text-muted/60 mt-2">Source: Morning Consult 2025</p>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════ SLIDE 3: For Creators ═══════ */}
      <Slide id="slide-creators" dark>
        <SlideLabel>Value Proposition — Creators</SlideLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold">Create. Sell. Earn.</h2>
            <p className="text-white/60 text-sm mt-3 leading-relaxed">
              Creators upload short videos featuring products from any connected merchant. Earn commission on every sale your content drives — automatically.
            </p>
            <div className="space-y-3 mt-6">
              {[
                { icon: "💰", title: `${creatorPct}% automatic commission`, desc: "On every sale your video generates" },
                { icon: "📊", title: "Real-time analytics dashboard", desc: "Track views, clicks, conversions, earnings" },
                { icon: "🔗", title: "Tag products from any merchant", desc: "Shopify stores synced, auto-inventory" },
                { icon: "📱", title: "Upload from your phone", desc: "HLS video, auto-thumbnail, instant publish" },
              ].map((f) => (
                <div key={f.title} className="flex gap-3">
                  <span className="text-xl flex-shrink-0">{f.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-xs text-white/50">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-center max-w-xs">
              <p className="text-sm text-white/60 mb-2">Estimated monthly earnings per creator</p>
              <p className="text-4xl font-display font-bold text-accent">{fmt(m.creatorPay / creatorCount)}</p>
              <p className="text-xs text-white/40 mt-2">at {salesPerCreator} sales/mo, €{AOV} AOV, {creatorPct}% commission</p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-white/60">Annual per creator</p>
                <p className="text-2xl font-display font-bold text-social">{fmt((m.creatorPay / creatorCount) * 12)}</p>
              </div>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════ SLIDE 4: For Merchants ═══════ */}
      <Slide id="slide-merchants">
        <SlideLabel>Value Proposition — Merchants</SlideLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold">Connect. Sell. Scale.</h2>
            <p className="text-muted text-sm mt-3 leading-relaxed">
              Shopify merchants connect their store and instantly tap into a network of video creators promoting their products to engaged audiences.
            </p>
            <div className="space-y-3 mt-6">
              {[
                { icon: "🔌", title: "One-click Shopify integration", desc: "Products, inventory, prices auto-synced" },
                { icon: "📹", title: "Creator marketplace", desc: "Creators discover and feature your products" },
                { icon: "💳", title: "85% revenue — you keep the bulk", desc: "Scrollr + creator take just 15% combined" },
                { icon: "📈", title: "Zero CAC — creator-driven traffic", desc: "No ad spend, creators bring the audience" },
              ].map((f) => (
                <div key={f.title} className="flex gap-3">
                  <span className="text-xl flex-shrink-0">{f.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-text">{f.title}</p>
                    <p className="text-xs text-muted">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="bg-success/5 rounded-2xl border border-success/20 p-6 text-center max-w-xs">
              <p className="text-5xl font-display font-bold text-success">0€</p>
              <p className="text-sm text-muted mt-2">Customer acquisition cost for merchants</p>
              <p className="text-xs text-muted/60 mt-1">vs €15-45 on Meta/Google Ads</p>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-2xl font-display font-bold text-text">85%</p>
                <p className="text-xs text-muted">of GMV goes to the merchant</p>
              </div>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════ SLIDE 5: Market Size ═══════ */}
      <Slide id="slide-market">
        <SlideLabel>Market Opportunity</SlideLabel>
        <h2 className="text-xl sm:text-2xl font-display font-bold mb-4">Social Commerce — $7.5T by 2031</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Social Commerce TAM", value: "$2T+", sub: "2026 projected" },
            { label: "Market CAGR", value: "29%", sub: "Through 2031" },
            { label: "TikTok Shop GMV", value: "$66B", sub: "2025 actual" },
            { label: "UGC Market", value: "$7.6B", sub: "Growing to $27B" },
          ].map((s) => (
            <div key={s.label} className="bg-surface rounded-xl border border-border p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-muted">{s.label}</p>
              <p className="text-lg sm:text-2xl font-display font-bold text-accent mt-1">{s.value}</p>
              <p className="text-[10px] text-muted mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
        <div className="h-[250px] sm:h-[300px]">
          <canvas id="marketSizeChart"></canvas>
        </div>
      </Slide>

      {/* ═══════ SLIDE 6: Interactive Financial Model ═══════ */}
      <Slide id="slide-model">
        <SlideLabel>Interactive Financial Model</SlideLabel>
        <h2 className="text-xl sm:text-2xl font-display font-bold mb-6">Adjust the Levers</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          {/* Creator count */}
          <div>
            <label className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted">Active Creators</span>
              <span className="font-bold text-text text-lg">{creatorCount.toLocaleString()}</span>
            </label>
            <input type="range" min={10} max={10000} step={10} value={creatorCount} onChange={(e) => setCreatorCount(Number(e.target.value))} className="w-full h-2 bg-border rounded-full appearance-none cursor-pointer accent-accent" />
            <div className="flex justify-between text-[10px] text-muted mt-1"><span>10</span><span>1K</span><span>10K</span></div>
          </div>

          {/* Sales per creator */}
          <div>
            <label className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted">Sales / Creator / Month</span>
              <span className="font-bold text-text text-lg">{salesPerCreator}</span>
            </label>
            <input type="range" min={5} max={200} step={1} value={salesPerCreator} onChange={(e) => setSalesPerCreator(Number(e.target.value))} className="w-full h-2 bg-border rounded-full appearance-none cursor-pointer accent-accent" />
            <div className="flex justify-between text-[10px] text-muted mt-1"><span>5</span><span>50</span><span>100</span><span>200</span></div>
          </div>

          {/* Creator commission */}
          <div>
            <label className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted">Creator Commission</span>
              <span className="font-bold text-text text-lg">{creatorPct}%</span>
            </label>
            <input type="range" min={1} max={15} step={1} value={creatorPct} onChange={(e) => setCreatorPct(Number(e.target.value))} className="w-full h-2 bg-border rounded-full appearance-none cursor-pointer accent-accent" />
            <div className="flex justify-between text-[10px] text-muted mt-1"><span>1%</span><span>5%</span><span>10%</span><span>15%</span></div>
          </div>
        </div>

        {/* Live KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Monthly GMV", value: fmt(m.gmv), color: "text-text" },
            { label: `Scrollr (${m.scrollrPct}%)`, value: fmt(m.scrollrGross), color: "text-accent" },
            { label: `Creator (${creatorPct}%)`, value: fmt(m.creatorPay), color: "text-social" },
            { label: "Stripe Fees", value: "-" + fmt(m.stripeFees), color: "text-muted" },
            { label: "Net Profit", value: fmt(m.profit), color: m.profit >= 0 ? "text-success" : "text-destructive" },
          ].map((s) => (
            <div key={s.label} className="bg-surface rounded-xl border border-border p-3 text-center">
              <p className="text-[10px] text-muted truncate">{s.label}</p>
              <p className={`text-lg font-display font-bold ${s.color} mt-0.5`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue per order breakdown */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-text mb-3">Revenue per €{AOV} Order</h3>
          <div className="flex items-center h-8 rounded-lg overflow-hidden text-[10px] font-semibold">
            <div className="h-full flex items-center justify-center bg-success/20 text-success" style={{ width: "85%" }}>Merchant 85%</div>
            <div className="h-full flex items-center justify-center bg-accent/20 text-accent" style={{ width: `${m.scrollrPct}%` }}>Scrollr {m.scrollrPct}%</div>
            <div className="h-full flex items-center justify-center bg-social/20 text-social" style={{ width: `${creatorPct}%` }}>Creator {creatorPct}%</div>
          </div>
        </div>
      </Slide>

      {/* ═══════ SLIDE 7: Commission Sensitivity ═══════ */}
      <Slide id="slide-sensitivity">
        <SlideLabel>Sensitivity Analysis</SlideLabel>
        <h2 className="text-xl sm:text-2xl font-display font-bold mb-2">Commission Impact</h2>
        <p className="text-xs text-muted mb-4">With {creatorCount.toLocaleString()} creators, {salesPerCreator} sales/creator/mo</p>
        <div className="h-[250px] sm:h-[300px]">
          <canvas id="sensitivityChart"></canvas>
        </div>
        <div className="mt-4 -mx-4 sm:mx-0 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm" style={{ minWidth: 500 }}>
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted font-medium text-[10px] uppercase">Creator %</th>
                <th className="text-right py-2 px-2 text-muted font-medium text-[10px] uppercase">Scrollr %</th>
                <th className="text-right py-2 px-2 text-muted font-medium text-[10px] uppercase">Scrollr Rev</th>
                <th className="text-right py-2 px-2 text-muted font-medium text-[10px] uppercase">Creator Pay</th>
                <th className="text-right py-2 px-2 text-muted font-medium text-[10px] uppercase">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {[3, 5, 7, 10, 12, 15].map((pct) => {
                const r = calcMetrics(creatorCount, pct, salesPerCreator);
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
      </Slide>

      {/* ═══════ SLIDE 8: Growth Model ═══════ */}
      <Slide id="slide-growth" dark>
        <SlideLabel>Growth Projections</SlideLabel>
        <h2 className="text-2xl sm:text-3xl font-display font-bold mb-6">Growth Engine</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="text-xs text-white/60 mb-1 block">Creator Growth / mo</label>
            <div className="flex items-center gap-2">
              <input type="range" min={5} max={50} step={1} value={creatorGrowthPct} onChange={(e) => setCreatorGrowthPct(Number(e.target.value))} className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent" />
              <span className="text-sm font-bold text-accent w-10 text-right">{creatorGrowthPct}%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">User Growth / mo</label>
            <div className="flex items-center gap-2">
              <input type="range" min={5} max={50} step={1} value={userGrowthPct} onChange={(e) => setUserGrowthPct(Number(e.target.value))} className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent" />
              <span className="text-sm font-bold text-social w-10 text-right">{userGrowthPct}%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Merchant Growth / mo</label>
            <div className="flex items-center gap-2">
              <input type="range" min={2} max={30} step={1} value={merchantGrowthPct} onChange={(e) => setMerchantGrowthPct(Number(e.target.value))} className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent" />
              <span className="text-sm font-bold text-success w-10 text-right">{merchantGrowthPct}%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Users / Creator</label>
            <div className="flex items-center gap-2">
              <input type="range" min={10} max={200} step={5} value={usersPerCreator} onChange={(e) => setUsersPerCreator(Number(e.target.value))} className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent" />
              <span className="text-sm font-bold text-white w-10 text-right">{usersPerCreator}</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Projection</label>
            <div className="flex items-center gap-2">
              <input type="range" min={12} max={60} step={6} value={projectionMonths} onChange={(e) => setProjectionMonths(Number(e.target.value))} className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent" />
              <span className="text-sm font-bold text-white w-10 text-right">{projectionMonths}mo</span>
            </div>
          </div>
        </div>

        {/* Growth chart */}
        <div className="h-[280px] sm:h-[350px] mb-6">
          <canvas id="growthChart"></canvas>
        </div>

        {/* Milestone cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Year 1", data: year1, color: "border-accent/40" },
            { label: "Year 2", data: year2, color: "border-social/40" },
            { label: `Month ${projectionMonths}`, data: year3, color: "border-success/40" },
          ].map(({ label, data: d, color }) => (
            <div key={label} className={`rounded-xl border ${color} bg-white/5 p-4`}>
              <p className="text-xs font-semibold text-white/60 uppercase mb-3">{label}</p>
              <div className="space-y-2">
                <div><p className="text-[10px] text-white/40">Creators</p><p className="text-lg font-bold text-accent">{fmtNum(d.creators)}</p></div>
                <div><p className="text-[10px] text-white/40">Users</p><p className="text-lg font-bold text-social">{fmtNum(d.users)}</p></div>
                <div><p className="text-[10px] text-white/40">Merchants</p><p className="text-lg font-bold text-success">{fmtNum(d.merchants)}</p></div>
                <div className="pt-2 border-t border-white/10"><p className="text-[10px] text-white/40">Monthly Revenue</p><p className="text-lg font-bold text-white">{fmt(d.revenue)}</p></div>
              </div>
            </div>
          ))}
        </div>
      </Slide>

      {/* ═══════ SLIDE 9: Valuation ═══════ */}
      <Slide id="slide-valuation">
        <SlideLabel>Valuation Model</SlideLabel>
        <h2 className="text-xl sm:text-2xl font-display font-bold mb-2">Revenue-Multiple Valuation</h2>
        <p className="text-xs text-muted mb-6">Based on growth projections above — ARR x multiple</p>

        <div className="h-[280px] sm:h-[350px] mb-6">
          <canvas id="revenueValuationChart"></canvas>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Conservative (6x ARR)", arr: year3.arr, multiple: 6, color: "text-warning", bg: "bg-warning/5 border-warning/20" },
            { label: "Moderate (10x ARR)", arr: year3.arr, multiple: 10, color: "text-social", bg: "bg-social/5 border-social/20" },
            { label: "Optimistic (15x ARR)", arr: year3.arr, multiple: 15, color: "text-success", bg: "bg-success/5 border-success/20" },
          ].map((s) => {
            const val = s.arr * s.multiple;
            return (
              <div key={s.label} className={`rounded-xl border p-5 text-center ${s.bg}`}>
                <p className={`text-xs font-semibold uppercase ${s.color}`}>{s.label}</p>
                <p className="text-3xl sm:text-4xl font-display font-bold text-text mt-3">{fmt(val)}</p>
                <p className="text-xs text-muted mt-2">
                  {fmtNum(year3.creators)} creators &bull; {fmt(year3.arr)} ARR
                </p>
                <p className="text-xs text-muted">Month {projectionMonths}</p>
              </div>
            );
          })}
        </div>

        {/* Year-by-year table */}
        <div className="mt-6 -mx-4 sm:mx-0 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm" style={{ minWidth: 500 }}>
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted font-medium text-[10px] uppercase">Period</th>
                <th className="text-right py-2 px-2 text-muted font-medium text-[10px] uppercase">Creators</th>
                <th className="text-right py-2 px-2 text-muted font-medium text-[10px] uppercase">Users</th>
                <th className="text-right py-2 px-2 text-muted font-medium text-[10px] uppercase">Monthly Rev</th>
                <th className="text-right py-2 px-2 text-muted font-medium text-[10px] uppercase">ARR</th>
                <th className="text-right py-2 px-2 text-muted font-medium text-[10px] uppercase">Val (10x)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Today", d: projection[0] },
                { label: "Month 6", d: projection[Math.min(6, projection.length - 1)] },
                { label: "Year 1", d: year1 },
                { label: "Year 2", d: year2 },
                { label: `Month ${projectionMonths}`, d: year3 },
              ].map(({ label, d }) => (
                <tr key={label} className="border-b border-border">
                  <td className="py-2 px-2 font-medium">{label}</td>
                  <td className="text-right py-2 px-2">{fmtNum(d.creators)}</td>
                  <td className="text-right py-2 px-2">{fmtNum(d.users)}</td>
                  <td className="text-right py-2 px-2 text-accent">{fmt(d.revenue)}</td>
                  <td className="text-right py-2 px-2">{fmt(d.arr)}</td>
                  <td className="text-right py-2 px-2 font-semibold text-social">{fmt(d.valuation10x)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Slide>

      {/* ═══════ SLIDE 10: Competitive Landscape ═══════ */}
      <Slide id="slide-competitors">
        <SlideLabel>Competitive Landscape</SlideLabel>
        <h2 className="text-xl sm:text-2xl font-display font-bold mb-4">How Scrollr Compares</h2>
        <div className="-mx-4 sm:mx-0 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm" style={{ minWidth: 500 }}>
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted font-medium text-[10px] uppercase">Feature</th>
                <th className="text-center py-2 px-2 text-[10px]">TikTok Shop</th>
                <th className="text-center py-2 px-2 text-[10px]">LTK</th>
                <th className="text-center py-2 px-2 text-[10px]">Whatnot</th>
                <th className="text-center py-2 px-2 text-[10px] font-bold text-accent">Scrollr</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Video feed", "✅", "❌", "✅", "✅"],
                ["Merchant storefront", "❌", "❌", "❌", "✅"],
                ["In-app checkout", "✅", "❌", "✅", "✅"],
                ["Shopify deep sync", "Partial", "Affiliate", "❌", "✅"],
                ["Auto creator pay", "Varies", "✅", "Seller", `${creatorPct}% auto`],
                ["Multi-merchant", "✅", "❌", "❌", "✅"],
                ["EU-first / GDPR", "❌", "❌", "❌", "✅"],
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
      </Slide>

      {/* ═══════ SLIDE 11: Potential Acquirers ═══════ */}
      <Slide id="slide-exit" dark>
        <SlideLabel>Exit Strategy</SlideLabel>
        <h2 className="text-2xl sm:text-3xl font-display font-bold mb-6">Potential Acquirers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { name: "Shopify", reason: "Adds discovery/creator layer they lack", fit: "Strategic" },
            { name: "Klarna / Affirm", reason: "Video-driven shopping for BNPL network", fit: "Strategic" },
            { name: "Zalando / ASOS", reason: "Creator acquisition for EU fashion", fit: "Vertical" },
            { name: "PE Roll-up", reason: "Marketplace consolidation play", fit: "Financial" },
          ].map((a) => (
            <div key={a.name} className="p-4 rounded-xl border border-white/10 bg-white/5">
              <span className="text-[10px] font-semibold uppercase text-accent">{a.fit}</span>
              <p className="font-bold text-white text-lg mt-1">{a.name}</p>
              <p className="text-xs text-white/50 mt-1">{a.reason}</p>
            </div>
          ))}
        </div>
      </Slide>

      <p className="text-[10px] text-muted text-center pb-8">Sources: Mordor Intelligence, Grand View Research, Sacra, TechCrunch, Business of Fashion, Morning Consult, HubSpot, Baymard Institute</p>
    </div>
  );
}
