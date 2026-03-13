import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { WhatSection } from "@/components/landing/WhatSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { CategoriesSection } from "@/components/landing/CategoriesSection";
import { EarlyAccessSection } from "@/components/landing/EarlyAccessSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="relative landing-light">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <WhatSection />
      <HowItWorksSection />
      <BenefitsSection />
      <AudienceSection />
      <CategoriesSection />
      <EarlyAccessSection />
      <CTASection />
      <Footer />
    </main>
  );
}
