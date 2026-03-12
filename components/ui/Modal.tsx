"use client";

import * as Dialog from "@radix-ui/react-dialog";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto bg-surface border border-border rounded-[var(--radius)] p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Dialog.Title className="text-lg font-display font-semibold text-text">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="text-sm text-muted mt-1">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-4">{children}</div>
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-muted hover:text-text transition-colors"
              aria-label="Close"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
              >
                <path
                  d="M11.782 4.032a.575.575 0 10-.813-.814L7.5 6.687 4.032 3.218a.575.575 0 00-.814.814L6.687 7.5l-3.469 3.468a.575.575 0 00.814.814L7.5 8.313l3.469 3.469a.575.575 0 00.813-.814L8.313 7.5l3.469-3.468z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
