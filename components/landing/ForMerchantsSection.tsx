"use client";

import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

const benefits = [
  {
    title: "1-click Shopify install",
    description: "Install the app, your products sync in seconds. A beautiful storefront goes live at scrollr.co/store/yourname. Done.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
      </svg>
    ),
  },
  {
    title: "Only pay when you sell",
    description: "No monthly fees. No setup cost. You keep 85% of every sale. Compare that to 30-50% lost on Instagram ads.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    title: "Creators sell for you",
    description: "Real people making authentic content about your products. Better than any ad you could buy.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  {
    title: "Orders in your Shopify admin",
    description: "Every sale appears in your Shopify dashboard like any other order. Fulfill normally. Nothing changes.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
];

export function ForMerchantsSection() {
  return (
    <section id="for-merchants" className="py-24 sm:py-32 px-6 bg-[#FAFAF8]">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy + benefits */}
          <div>
            <ScrollReveal>
              <p className="text-sm font-semibold text-coral tracking-wider uppercase mb-4">
                For Merchants
              </p>
              <h2 className="text-4xl sm:text-5xl font-display font-bold text-warm-text leading-tight mb-6">
                An army of creators. Zero upfront cost.
              </h2>
              <p className="text-lg text-warm-secondary leading-relaxed mb-10">
                Install our Shopify app. Your products sync instantly. Creators start making content. You only pay 15% when a sale is made. No flat fees, no minimums, no risk.
              </p>
            </ScrollReveal>

            <div className="space-y-6">
              {benefits.map((benefit, i) => (
                <ScrollReveal key={benefit.title} delay={200 + i * 120}>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-coral-tint flex items-center justify-center text-coral">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-warm-text mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-warm-secondary leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={700}>
              <div className="mt-10">
                <Link
                  href="/merchant-register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-coral text-white font-semibold text-base rounded-full transition-all duration-300 hover:bg-coral-hover hover:scale-[1.02] shadow-lg shadow-coral/20"
                >
                  Install Shopify App
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: merchant dashboard mock */}
          <ScrollReveal delay={300}>
            <div className="bg-warm-card rounded-2xl border border-warm-border p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-display font-bold text-warm-text">Merchant Dashboard</h4>
                <span className="text-xs text-warm-muted">Last 30 days</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: "Revenue", value: "€4,820", change: "+34%", color: "text-success" },
                  { label: "Orders", value: "127", change: "+22%", color: "text-coral" },
                  { label: "Creators", value: "18", change: "+6", color: "text-social" },
                  { label: "Conversion", value: "3.2%", change: "+0.8%", color: "text-warning" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-warm-surface rounded-xl p-4">
                    <p className="text-xs text-warm-muted mb-1">{stat.label}</p>
                    <p className="text-2xl font-display font-bold text-warm-text">{stat.value}</p>
                    <span className={`text-xs font-medium ${stat.color}`}>{stat.change}</span>
                  </div>
                ))}
              </div>

              {/* Top products mini list */}
              <div className="space-y-2">
                <p className="text-xs text-warm-muted font-medium uppercase tracking-wider">Top Products</p>
                {[
                  { name: "Oversized Hoodie", sales: 42, revenue: "€2,519" },
                  { name: "Slim Fit Jeans", sales: 38, revenue: "€1,899" },
                  { name: "Graphic Tee", sales: 27, revenue: "€674" },
                ].map((product) => (
                  <div key={product.name} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-warm-text">{product.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-warm-muted">{product.sales} sold</span>
                      <span className="text-sm font-semibold text-success">{product.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
