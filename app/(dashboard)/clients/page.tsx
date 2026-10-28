import { ClientList } from "@/features/clients/components/client-list";
import { PendingClientRequests } from "@/features/clients/components/pending-client-requests";
import { RequestClientDataDialog } from "@/features/clients/components/request-client-data-dialog";
import { getPendingClientRequests } from "@/features/clients/services/client-request.service";
import { getClients } from "@/features/clients/services/client.service";
import { getClientFormCatalogs, getTaxRegimeLabels } from "@/shared/services/sat-catalog.service";
import { Button } from "@/shared/ui/button";
import { auth } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  const clients = await getClients(userId);

  const [catalogs, taxRegimeLabels, pendingRequests] = await Promise.all([
    getClientFormCatalogs(),
    getTaxRegimeLabels(),
    getPendingClientRequests(userId),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            Clientes
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {clients.length > 0
              ? `${clients.length} cliente${clients.length !== 1 ? "s" : ""}`
              : "A quién le facturas"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RequestClientDataDialog />
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </Link>
          </Button>
        </div>
      </div>

      <PendingClientRequests requests={pendingRequests} />

      {/* Clients List */}
      <ClientList
        clients={clients}
        taxRegimeLabels={taxRegimeLabels}
        catalogs={catalogs}
      />
    </div>
  );
}
