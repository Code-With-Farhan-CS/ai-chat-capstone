async function getHealthCheck() {
  const res = await fetch("https://jsonplaceholder.typicode.com/todos/1");
  return res.json();
}

export default async function HealthPage() {
  const data = await getHealthCheck();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start gap-4 px-4 py-12 sm:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Health check</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This fetches a test endpoint at request time to verify data fetching works.
        </p>
      </div>
      <pre className="w-full overflow-x-auto rounded-lg border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-800 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}
