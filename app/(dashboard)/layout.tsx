import { Header } from "@/shared/components/header";
import { Sidebar } from "@/shared/components/sidebar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateAccount } from "@features/billing/services/account.service";
import { getAllIssuingProfiles } from "@features/fiscal-profile/services/fiscal-profile.service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Redirect new users to onboarding if they have no fiscal profile
  const profiles = await getAllIssuingProfiles(userId);
  if (profiles.length === 0) redirect("/onboarding");

  const account = await getOrCreateAccount(userId);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden shrink-0 md:block">
        <Sidebar stampsBalance={account.stampsBalance} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header stampsBalance={account.stampsBalance} />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
