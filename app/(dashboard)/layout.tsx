import { auth } from "@clerk/nextjs/server";
import { Header } from "@/shared/components/header";
import { Sidebar } from "@/shared/components/sidebar";
import { getOrCreateSubscription } from "@features/billing/services/subscription.service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const subscription = userId ? await getOrCreateSubscription(userId) : null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden shrink-0 md:block">
        <Sidebar
          plan={subscription?.plan ?? 'free'}
          stampsUsed={subscription?.stampsUsed ?? 0}
          stampsLimit={subscription?.stampsLimit ?? 5}
          periodEnd={subscription?.currentPeriodEnd ?? new Date()}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          plan={subscription?.plan ?? 'free'}
          stampsUsed={subscription?.stampsUsed ?? 0}
          stampsLimit={subscription?.stampsLimit ?? 5}
          periodEnd={subscription?.currentPeriodEnd ?? new Date()}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
