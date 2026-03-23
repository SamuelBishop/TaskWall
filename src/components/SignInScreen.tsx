interface SetupScreenProps {
  error: string | null;
}

export default function SetupScreen({ error }: SetupScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-wall-bg text-wall-text">
      <h1 className="text-4xl font-bold mb-2 tracking-tight">TaskWall</h1>
      <p className="text-wall-muted text-lg mb-8">
        Your tasks, at a glance.
      </p>

      <div className="bg-wall-surface border border-wall-border rounded-xl px-8 py-6 max-w-md text-center">
        <p className="text-wall-text text-base font-medium mb-4">
          Todoist API Token Required
        </p>
        <div className="text-wall-muted text-sm leading-relaxed space-y-3 text-left">
          <p>1. Go to <span className="text-wall-text">Settings → Integrations → Developer</span> in Todoist</p>
          <p>2. Copy your API token</p>
          <p>3. Create a <span className="text-wall-text font-mono text-xs">.env</span> file in the project root:</p>
          <pre className="bg-gray-100 rounded-lg px-4 py-2 text-xs font-mono text-wall-today mt-1">
VITE_TODOIST_API_TOKEN=your-token-here</pre>
          <p>4. Restart the dev server</p>
        </div>
        {error && (
          <p className="mt-4 text-wall-overdue text-sm">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
