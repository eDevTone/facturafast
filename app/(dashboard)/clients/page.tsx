import { ClientList } from "@/features/clients/components/client-list";
import { getClients } from "@/features/clients/services/client.service";
import { Button } from "@/shared/ui/button";
import { auth } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const { userId } = await auth();

  let clients: Awaited<ReturnType<typeof getClients>> = [];

  if (userId) {
    try {
      clients = await getClients(userId);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Clientes
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {clients.length > 0
              ? `${clients.length} cliente${clients.length !== 1 ? "s" : ""} registrado${clients.length !== 1 ? "s" : ""}`
              : "Gestiona los datos fiscales de tus clientes"}
          </p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Clients List */}
      <ClientList clients={clients} />
    </div>
  );
}
