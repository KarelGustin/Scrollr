import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProofBar } from "@/components/landing/SocialProofBar";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ForCreatorsSection } from "@/components/landing/ForCreatorsSection";
import { ForMerchantsSection } from "@/components/landing/ForMerchantsSection";
import { CategoriesSection } from "@/components/landing/CategoriesSection";
import { FeedDemo } from "@/components/landing/FeedDemo";
import { TrustSection } from "@/components/landing/TrustSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="relative landing-warm">
      <Navbar />
      <HeroSection />
      <SocialProofBar />
      <HowItWorksSection />
      <ForCreatorsSection />
      <ForMerchantsSection />
      <CategoriesSection />
      <FeedDemo />
      <TrustSection />
      <TestimonialSection />
      <CTASection />
      <Footer />
    </main>
  );
}
