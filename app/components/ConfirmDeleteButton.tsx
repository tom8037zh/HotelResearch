"use client";

export function ConfirmDeleteButton({
  action,
  confirmMessage,
  children = "Löschen",
  className = "text-sm text-red-600 hover:underline",
  title,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  children?: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <form
      action={action}
      onClick={(e) => e.stopPropagation()}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className={className} title={title}>
        {children}
      </button>
    </form>
  );
}
