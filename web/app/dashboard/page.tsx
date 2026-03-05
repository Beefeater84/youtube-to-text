import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import type { Transcript } from "@/entities/transcript";
import { CreateTranscriptForm } from "@/features/create-transcript";
import { DashboardJobList } from "@/widgets/dashboard";

export const metadata: Metadata = {
  title: "Dashboard — YouTube to Text",
  description: "Manage your transcript jobs.",
};

/**
 * Dashboard page showing the user's transcript jobs and a form to create new ones.
 * Protected by middleware — only accessible to authenticated users.
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_languages")
    .eq("id", user.id)
    .single();

  const { data: transcripts } = await supabase
    .from("transcripts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <section className="mx-auto max-w-[960px] px-4 pb-12 pt-6 md:px-6">
      <h1 className="font-headline text-[clamp(1.5rem,4vw,2.2rem)] font-bold leading-tight">
        Your Transcripts
      </h1>

      <hr className="rule-double my-6" />

      <CreateTranscriptForm
        preferredLanguages={profile?.preferred_languages ?? ["en"]}
      />

      <hr className="rule-thin my-8" />

      <h2 className="mb-4 font-headline text-[1.1rem] uppercase tracking-[0.12em]">
        Recent Jobs
      </h2>

      <DashboardJobList transcripts={(transcripts as Transcript[]) ?? []} />
    </section>
  );
}
