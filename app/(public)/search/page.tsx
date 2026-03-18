"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import SearchBar from "@/components/search/SearchBar";

type TabType = "all" | "videos" | "products" | "creators" | "stores";

interface SearchVideo {
  id: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  user: {
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
}

interface SearchProduct {
  id: string;
  name: string;
  brand: string | null;
  price: number | null;
  priceDisplay: string | null;
  imageUrl: string | null;
  affiliateUrl: string;
  user: {
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
}

interface SearchCreator {
  id: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  _count: {
    videos: number;
    products: number;
  };
}

interface SearchMerchant {
  id: string;
  slug: string | null;
  storeName: string | null;
  storeLogoUrl: string | null;
  _count: {
    merchantProducts: number;
  };
}

interface SearchResults {
  videos: SearchVideo[];
  products: SearchProduct[];
  creators: SearchCreator[];
  merchants: SearchMerchant[];
}

const tabs: { key: TabType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "videos", label: "Videos" },
  { key: "products", label: "Products" },
  { key: "creators", label: "Creators" },
  { key: "stores", label: "Stores" },
];

async function fetchSearchResults(query: string, type: TabType): Promise<SearchResults> {
  const params = new URLSearchParams({ q: query });
  if (type !== "all") {
    params.set("type", type);
  }
  const res = await fetch(`/api/search?${params.toString()}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["search", query, activeTab],
    queryFn: () => fetchSearchResults(query, activeTab),
    enabled: query.length > 0,
    staleTime: 30_000,
  });

  const { data: suggestions } = useQuery<SearchResults>({
    queryKey: ["search-suggestions"],
    queryFn: async () => {
      const res = await fetch("/api/search/suggestions");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: query.length === 0,
    staleTime: 60_000,
  });

  const hasResults =
    data &&
    (data.videos.length > 0 ||
      data.products.length > 0 ||
      data.creators.length > 0 ||
      data.merchants.length > 0);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          {/* Back button + Search bar */}
          <div className="flex items-center gap-3">
            <Link
              href="/feed"
              className="flex-shrink-0 p-2 -ml-2 text-muted hover:text-text transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 7.5 12l8.25-7.5" />
              </svg>
            </Link>
            <div className="flex-1">
              <SearchBar onChange={handleSearchChange} autoFocus />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-accent text-accent-fg"
                    : "text-muted hover:text-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Suggestions when no query */}
        {query.length === 0 && suggestions && (
          <div className="space-y-8">
            {suggestions.videos.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                  Trending Videos
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {suggestions.videos.map((video) => {
                    const username = video.user.username ?? "anonymous";
                    return (
                      <article key={video.id} className="group block">
                        <Link
                          href={`/@${username}/${video.id}`}
                          className="block"
                        >
                          <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-surface border border-border">
                            {video.thumbnailUrl ? (
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title ?? "Video"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-muted/40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                              </div>
                            )}
                            {video.duration && (
                              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                {formatDuration(video.duration)}
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="mt-2">
                          <Link href={`/@${username}/${video.id}`} className="block">
                            <p className="text-sm font-medium text-text line-clamp-2 leading-snug">
                              {video.title ?? "Untitled"}
                            </p>
                          </Link>
                          <Link href={`/@${username}`} className="text-xs text-muted mt-0.5 hover:text-text transition-colors">
                            @{username}
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {suggestions.products.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                  Popular Products
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {suggestions.products.map((product) => (
                    <a
                      key={product.id}
                      href={product.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-surface border border-border">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-muted/40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-text line-clamp-2 leading-snug">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {product.brand && (
                            <span className="text-xs text-muted">{product.brand}</span>
                          )}
                          {product.priceDisplay && (
                            <span className="text-xs font-semibold text-accent">
                              {product.priceDisplay}
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {suggestions.creators.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                  Top Creators
                </h3>
                <div className="space-y-2">
                  {suggestions.creators.map((creator) => (
                    <Link
                      key={creator.id}
                      href={`/@${creator.username ?? creator.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border hover:border-accent/20 transition-all"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-card overflow-hidden">
                        {creator.avatarUrl ? (
                          <img
                            src={creator.avatarUrl}
                            alt={creator.name ?? creator.username ?? "Creator"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          {creator.name ?? creator.username ?? "Anonymous"}
                        </p>
                        {creator.username && (
                          <p className="text-xs text-muted">@{creator.username}</p>
                        )}
                        {creator.bio && (
                          <p className="text-xs text-muted mt-0.5 line-clamp-1">{creator.bio}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-muted">
                          {creator._count.videos} {creator._count.videos === 1 ? "video" : "videos"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {suggestions.merchants.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                  Top Stores
                </h3>
                <div className="space-y-2">
                  {suggestions.merchants.map((merchant) => (
                    <Link
                      key={merchant.id}
                      href={`/store/${merchant.slug ?? merchant.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border hover:border-accent/20 transition-all"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-card overflow-hidden border border-border">
                        {merchant.storeLogoUrl ? (
                          <img
                            src={merchant.storeLogoUrl}
                            alt={merchant.storeName ?? "Store"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-accent/10">
                            <span className="text-lg font-bold text-accent">
                              {(merchant.storeName ?? "S").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          {merchant.storeName ?? "Unnamed Store"}
                        </p>
                        <p className="text-xs text-muted">
                          {merchant._count.merchantProducts}{" "}
                          {merchant._count.merchantProducts === 1 ? "product" : "products"}
                        </p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted flex-shrink-0">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Empty initial state (no suggestions loaded yet) */}
        {query.length === 0 && !suggestions && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <h2 className="text-lg font-display font-semibold text-text mb-1">
              Search Scrollr
            </h2>
            <p className="text-sm text-muted">
              Find videos, products, creators, and stores
            </p>
          </div>
        )}

        {/* Loading state */}
        {query.length > 0 && isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {/* No results */}
        {query.length > 0 && !isLoading && !hasResults && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-lg font-display font-semibold text-text mb-1">
              No results found
            </h2>
            <p className="text-sm text-muted">
              Try a different search term
            </p>
          </div>
        )}

        {/* Results */}
        {data && hasResults && (
          <div className="space-y-8">
            {/* Videos */}
            {data.videos.length > 0 && (activeTab === "all" || activeTab === "videos") && (
              <section>
                {activeTab === "all" && (
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                    Videos
                  </h3>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {data.videos.map((video) => {
                    const username = video.user.username ?? "anonymous";
                    return (
                      <article key={video.id} className="group block">
                        <Link
                          href={`/@${username}/${video.id}`}
                          className="block"
                        >
                          <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-surface border border-border">
                            {video.thumbnailUrl ? (
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title ?? "Video"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-muted/40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                              </div>
                            )}
                            {video.duration && (
                              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                {formatDuration(video.duration)}
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="mt-2">
                          <Link href={`/@${username}/${video.id}`} className="block">
                            <p className="text-sm font-medium text-text line-clamp-2 leading-snug">
                              {video.title ?? "Untitled"}
                            </p>
                          </Link>
                          <Link href={`/@${username}`} className="text-xs text-muted mt-0.5 hover:text-text transition-colors">
                            @{username}
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Products */}
            {data.products.length > 0 && (activeTab === "all" || activeTab === "products") && (
              <section>
                {activeTab === "all" && (
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                    Products
                  </h3>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {data.products.map((product) => (
                    <a
                      key={product.id}
                      href={product.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-surface border border-border">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-muted/40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-text line-clamp-2 leading-snug">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {product.brand && (
                            <span className="text-xs text-muted">{product.brand}</span>
                          )}
                          {product.priceDisplay && (
                            <span className="text-xs font-semibold text-accent">
                              {product.priceDisplay}
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Creators */}
            {data.creators.length > 0 && (activeTab === "all" || activeTab === "creators") && (
              <section>
                {activeTab === "all" && (
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                    Creators
                  </h3>
                )}
                <div className="space-y-2">
                  {data.creators.map((creator) => (
                    <Link
                      key={creator.id}
                      href={`/@${creator.username ?? creator.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border hover:border-accent/20 transition-all"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-card overflow-hidden">
                        {creator.avatarUrl ? (
                          <img
                            src={creator.avatarUrl}
                            alt={creator.name ?? creator.username ?? "Creator"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          {creator.name ?? creator.username ?? "Anonymous"}
                        </p>
                        {creator.username && (
                          <p className="text-xs text-muted">@{creator.username}</p>
                        )}
                        {creator.bio && (
                          <p className="text-xs text-muted mt-0.5 line-clamp-1">{creator.bio}</p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-muted">
                          {creator._count.videos} {creator._count.videos === 1 ? "video" : "videos"}
                        </p>
                        <p className="text-xs text-muted">
                          {creator._count.products} {creator._count.products === 1 ? "product" : "products"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Stores */}
            {data.merchants.length > 0 && (activeTab === "all" || activeTab === "stores") && (
              <section>
                {activeTab === "all" && (
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                    Stores
                  </h3>
                )}
                <div className="space-y-2">
                  {data.merchants.map((merchant) => (
                    <Link
                      key={merchant.id}
                      href={`/store/${merchant.slug ?? merchant.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border hover:border-accent/20 transition-all"
                    >
                      {/* Store logo / initial */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-card overflow-hidden border border-border">
                        {merchant.storeLogoUrl ? (
                          <img
                            src={merchant.storeLogoUrl}
                            alt={merchant.storeName ?? "Store"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-accent/10">
                            <span className="text-lg font-bold text-accent">
                              {(merchant.storeName ?? "S").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          {merchant.storeName ?? "Unnamed Store"}
                        </p>
                        <p className="text-xs text-muted">
                          {merchant._count.merchantProducts}{" "}
                          {merchant._count.merchantProducts === 1 ? "product" : "products"}
                        </p>
                      </div>

                      {/* Arrow */}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted flex-shrink-0">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
