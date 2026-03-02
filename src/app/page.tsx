import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: channels, error } = await supabase
    .from("channels")
    .select("id")
    .limit(1);

  const dbConnected = !error;

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-3xl font-bold">YouTube to Text</h1>
      <p className="mt-4 text-base text-gray-600">
        Project bootstrap is ready. Next step: implement SEO pages and
        transcript flow.
      </p>
      <div className="mt-6 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Status</h2>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            Supabase:{" "}
            {dbConnected ? (
              <span className="text-green-600 font-medium">Connected</span>
            ) : (
              <span className="text-red-600 font-medium">
                Error — {error?.message}
              </span>
            )}
          </li>
          <li>Channels in DB: {channels?.length ?? 0}</li>
        </ul>
      </div>
    </main>
  );
}
