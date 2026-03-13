"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useProducts,
  useReorderProducts,
  useDeleteProduct,
  useUpdateProduct,
} from "@/hooks/useProducts";
import { ProductCard } from "@/components/dashboard/ProductCard";
import { UploadModal } from "@/components/dashboard/UploadModal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { ImportProductForm } from "@/components/dashboard/ImportProductForm";
// Product type from API includes videos relation
type DashboardProduct = {
  id: string;
  name: string;
  brand: string | null;
  price: number | null;
  priceDisplay: string | null;
  imageUrl: string | null;
  description: string | null;
  affiliateUrl: string;
  position: number;
  published: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  videos: { video: { thumbnailUrl: string | null } }[];
};

function SortableProductCard({
  product,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  product: DashboardProduct;
  onEdit: (p: DashboardProduct) => void;
  onDelete: (p: DashboardProduct) => void;
  onTogglePublish: (p: DashboardProduct) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProductCard
        product={product}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
      />
    </div>
  );
}

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  const reorderProducts = useReorderProducts();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DashboardProduct | null>(
    null
  );

  const [orderedProducts, setOrderedProducts] = useState<
    DashboardProduct[] | null
  >(null);

  // Use local order if we've reordered, otherwise use server data
  const displayProducts: DashboardProduct[] = orderedProducts ?? products ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !displayProducts.length) return;

      const oldIndex = displayProducts.findIndex((p) => p.id === active.id);
      const newIndex = displayProducts.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(displayProducts, oldIndex, newIndex);
      setOrderedProducts(newOrder);
      reorderProducts.mutate(newOrder.map((p) => p.id));
    },
    [displayProducts, reorderProducts]
  );

  const handleEdit = (product: DashboardProduct) => {
    // For now, navigate or open edit — could be expanded with an edit modal
    window.location.href = `/products?edit=${product.id}`;
  };

  const handleDelete = (product: DashboardProduct) => {
    setDeleteConfirm(product);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteProduct.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
      setOrderedProducts(null); // Reset local order
    }
  };

  const handleTogglePublish = (product: DashboardProduct) => {
    updateProduct.mutate({
      id: product.id,
      published: !product.published,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text">
            Products
          </h1>
          <p className="text-sm text-muted mt-1">
            {displayProducts.length} product
            {displayProducts.length !== 1 ? "s" : ""} — drag to reorder
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Product
        </Button>
      </div>

      {/* Import from URL */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-medium text-muted mb-3">Import from URL</h2>
        <ImportProductForm />
      </div>

      {/* Product grid */}
      {displayProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted"
            >
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </div>
          <h2 className="text-lg font-display font-semibold text-text mb-1">
            No products yet
          </h2>
          <p className="text-sm text-muted mb-6 max-w-sm">
            Add your first product with a short video to start building your
            shoppable feed.
          </p>
          <Button onClick={() => setUploadOpen(true)}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Your First Product
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayProducts.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayProducts.map((product) => (
                <SortableProductCard
                  key={product.id}
                  product={product}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Upload modal */}
      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
      >
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            loading={deleteProduct.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
