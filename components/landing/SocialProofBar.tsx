"use client";

export function SocialProofBar() {
  return (
    <section className="py-6 px-6 bg-warm-surface border-y border-warm-border">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
        {/* Avatar stack */}
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {[
              "bg-coral",
              "bg-social",
              "bg-success",
              "bg-warning",
              "bg-coral-soft",
            ].map((bg, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full ${bg} border-2 border-warm-surface flex items-center justify-center`}
              >
                <span className="text-white text-[10px] font-bold">
                  {["E", "M", "A", "J", "S"][i]}
                </span>
              </div>
            ))}
          </div>
          <span className="ml-3 text-sm font-medium text-warm-text">
            Join 2,000+ creators and shoppers
          </span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-warm-border" />

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-4 h-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-warm-secondary">4.9 from early users</span>
        </div>
      </div>
    </section>
  );
}
