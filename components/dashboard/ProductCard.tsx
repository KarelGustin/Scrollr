"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
// Product type flexible for both old and new schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProductWithVideo = any;

interface ProductCardProps {
  product: ProductWithVideo;
  onEdit: (product: ProductWithVideo) => void;
  onDelete: (product: ProductWithVideo) => void;
  onTogglePublish: (product: ProductWithVideo) => void;
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onTogglePublish,
}: ProductCardProps) {
  const thumbnailUrl = product.imageUrl ?? (product as any).videos?.[0]?.video?.thumbnailUrl ?? null;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] max-h-56 bg-surface overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
        )}

        {/* Status badge */}
        <span
          className={`absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            product.published
              ? "bg-green-500/20 text-green-400"
              : "bg-muted/20 text-muted"
          }`}
        >
          {product.published ? "Live" : "Draft"}
        </span>

        {/* Actions dropdown */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="p-1.5 bg-bg/80 backdrop-blur-sm rounded-lg text-text hover:bg-bg transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[160px] bg-surface border border-border rounded-lg p-1 shadow-xl z-50"
                sideOffset={5}
                align="end"
              >
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text rounded-md cursor-pointer hover:bg-card outline-none"
                  onSelect={() => onEdit(product)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text rounded-md cursor-pointer hover:bg-card outline-none"
                  onSelect={() => onTogglePublish(product)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {product.published ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                  {product.published ? "Unpublish" : "Publish"}
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="h-px bg-border my-1" />
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm text-destructive rounded-md cursor-pointer hover:bg-destructive/10 outline-none"
                  onSelect={() => onDelete(product)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-text truncate">{product.name}</h3>
        {product.brand && (
          <p className="text-xs text-muted mt-0.5">{product.brand}</p>
        )}
        {(product as any).priceDisplay && (
          <p className="text-sm font-medium text-accent mt-1">{(product as any).priceDisplay}</p>
        )}
      </div>
    </div>
  );
}
