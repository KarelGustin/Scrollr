interface StoreHeaderProps {
  storeName: string;
  storeDescription?: string | null;
  storeLogoUrl?: string | null;
  isDark: boolean;
}

export function StoreHeader({ storeName, storeDescription, storeLogoUrl, isDark }: StoreHeaderProps) {
  return (
    <div className="text-center py-8">
      {storeLogoUrl ? (
        <img src={storeLogoUrl} alt={storeName} className="w-12 h-12 rounded-full mx-auto mb-3 object-cover" />
      ) : (
        <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg ${isDark ? "bg-white/20" : "bg-[#222]"}`}>
          {storeName.charAt(0).toUpperCase()}
        </div>
      )}
      <h1 className="text-xl font-bold tracking-wide">{storeName.toUpperCase()}</h1>
      {storeDescription && (
        <p className={`text-sm mt-1 ${isDark ? "text-white/50" : "text-[#999]"}`}>{storeDescription}</p>
      )}
    </div>
  );
}
