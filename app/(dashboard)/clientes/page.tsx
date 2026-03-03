import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default function ClientesPage() {
  // TODO: Fetch clients from DB
  const clients: any[] = [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona todos tus clientes y sus datos fiscales
          </p>
        </div>
        <Link href="/clientes/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No hay clientes aún</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Crea tu primer cliente para comenzar a facturar
              </p>
              <Link href="/clientes/nuevo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Cliente
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* TODO: Client table/list */}
              <p>Listado de clientes aquí</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
