import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "For Merchants - Scrollr",
  description:
    "Video commerce for Shopify brands. Connect your store, upload video content, and let customers discover and buy.",
};

export default function ForMerchantsPage() {
  return (
    <main className="relative landing-warm">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-warm-text leading-tight tracking-tight">
            Your products.
            <br />
            Their attention.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-warm-secondary max-w-xl mx-auto leading-relaxed">
            Video commerce for Shopify brands. Show your products in motion and
            turn scrollers into buyers.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/merchant-onboarding"
              className="px-8 py-3.5 bg-coral text-white text-base font-semibold rounded-full hover:bg-coral-hover transition-all duration-200"
            >
              Connect your Shopify Store
            </Link>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 px-6 bg-[#F5F4F0]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-warm-text text-center mb-12">
            Static catalogs don&apos;t convert anymore
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                title: "Rising CAC",
                desc: "Ad costs keep climbing while ROAS keeps shrinking. You need organic discovery channels.",
              },
              {
                title: "Algorithm changes",
                desc: "One platform update can wipe out your traffic overnight. Diversify where customers find you.",
              },
              {
                title: "Low conversion",
                desc: "Product photos don't tell the full story. Video drives 2-3x higher conversion rates.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-6 border border-warm-border"
              >
                <h3 className="text-lg font-display font-bold text-warm-text mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-warm-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-warm-text text-center mb-12">
            Three steps to video commerce
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Connect Shopify",
                desc: "Link your store in seconds. Products sync automatically and stay up to date.",
              },
              {
                step: "2",
                title: "Upload video content",
                desc: "Show your products in action. Tag items directly in each video.",
              },
              {
                step: "3",
                title: "Customers discover & buy",
                desc: "Shoppers find your videos, tap to buy, and orders flow through your existing Shopify workflow.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-coral/10 text-coral font-display font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-display font-bold text-warm-text mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-warm-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6 bg-[#F5F4F0]">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-warm-text mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-warm-secondary mb-8">
            15% platform fee. No hidden costs. You keep 85%.
          </p>
          <div className="bg-white rounded-2xl border border-warm-border p-8">
            <div className="text-5xl font-display font-bold text-warm-text mb-2">
              85%
            </div>
            <p className="text-warm-secondary text-sm mb-6">
              of every sale goes directly to you
            </p>
            <ul className="text-sm text-warm-secondary space-y-2 text-left max-w-xs mx-auto mb-8">
              <li className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                No monthly subscription
              </li>
              <li className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                No setup fees
              </li>
              <li className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Pay only when you sell
              </li>
            </ul>
            <Link
              href="/merchant-onboarding"
              className="inline-block px-8 py-3 bg-coral text-white text-sm font-semibold rounded-full hover:bg-coral-hover transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
