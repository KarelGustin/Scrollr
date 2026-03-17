interface StoreHeaderProps {
  storeName: string;
  storeDescription?: string | null;
  storeLogoUrl?: string | null;
  isDark: boolean;
  productCount?: number;
}

export function StoreHeader({ storeName, storeDescription, storeLogoUrl, isDark, productCount }: StoreHeaderProps) {
  return (
    <div className="relative">
      {/* Subtle gradient backdrop */}
      <div className={`absolute inset-0 ${isDark ? "bg-gradient-to-b from-white/[0.03] to-transparent" : "bg-gradient-to-b from-black/[0.02] to-transparent"}`} />

      <div className="relative text-center pt-10 pb-6 px-4">
        {/* Logo */}
        {storeLogoUrl ? (
          <div className="relative w-16 h-16 mx-auto mb-4">
            <img
              src={storeLogoUrl}
              alt={storeName}
              className="w-16 h-16 rounded-2xl object-cover shadow-lg"
            />
          </div>
        ) : (
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center font-bold text-xl shadow-lg ${
            isDark ? "bg-white/10 text-white" : "bg-[#1a1a1a] text-white"
          }`}>
            {storeName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Store name */}
        <h1 className={`text-xl font-display font-bold tracking-[0.2em] ${isDark ? "text-white" : "text-[#1a1a1a]"}`}>
          {storeName.toUpperCase()}
        </h1>

        {/* Description */}
        {storeDescription && (
          <p className={`text-sm mt-2 max-w-sm mx-auto leading-relaxed ${isDark ? "text-white/50" : "text-[#888]"}`}>
            {storeDescription}
          </p>
        )}

        {/* Product count */}
        {productCount !== undefined && productCount > 0 && (
          <p className={`text-[11px] mt-3 font-medium tracking-wider uppercase ${isDark ? "text-white/30" : "text-[#bbb]"}`}>
            {productCount} Products
          </p>
        )}
      </div>
    </div>
  );
}
