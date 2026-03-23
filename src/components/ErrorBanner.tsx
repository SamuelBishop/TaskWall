interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="bg-wall-overdue/10 border border-wall-overdue/30 text-wall-overdue px-4 py-2 flex items-center justify-between">
      <span className="text-sm">{message}</span>
      <button
        onClick={onDismiss}
        className="text-wall-overdue hover:text-red-700 ml-4 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
