import { FileText, TrendingUp, Users, DollarSign } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">FacturaFast</h1>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            Nueva Factura
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Bienvenido a FacturaFast - Sistema de facturación CFDI 4.0
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stat Card 1 */}
          <Card className="border-border hover:border-primary transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Facturado</p>
                  <p className="text-3xl font-bold text-foreground mt-2">$45,230</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-accent" />
                </div>
              </div>
              <p className="text-sm text-success mt-3 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +12% vs mes anterior
              </p>
            </CardContent>
          </Card>

          {/* Stat Card 2 */}
          <Card className="border-border hover:border-primary transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Facturas Este Mes</p>
                  <p className="text-3xl font-bold text-foreground mt-2">42</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
              </div>
              <p className="text-sm text-success mt-3 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +8 desde la semana pasada
              </p>
            </CardContent>
          </Card>

          {/* Stat Card 3 */}
          <Card className="border-border hover:border-primary transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clientes Activos</p>
                  <p className="text-3xl font-bold text-foreground mt-2">18</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                3 nuevos este mes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Card */}
        <Card className="border-border">
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Arquitectura Screaming 🏗️
              </h3>
              <p className="text-muted-foreground mb-6">
                Features organizadas por dominio de negocio, no por tipo de archivo.
                El proyecto "grita" su propósito: FACTURACIÓN ELECTRÓNICA.
              </p>
              <div className="flex gap-3 justify-center">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Ver Features
                </Button>
                <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                  Documentación
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Architecture Preview */}
        <Card className="mt-12 border-border">
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold text-foreground mb-4">
              🏗️ Screaming Architecture - Features
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-accent" />
                  <p className="font-semibold text-foreground">Invoicing</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Facturación CFDI 4.0, XML, PDF, timbrado
                </p>
              </div>

              <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-accent" />
                  <p className="font-semibold text-foreground">Clients</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Catálogo de clientes y receptores
                </p>
              </div>

              <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-accent" />
                  <p className="font-semibold text-foreground">Fiscal Profile</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Perfil fiscal, CSF, certificados
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground font-mono">
                features/invoicing/    ← Todo sobre FACTURAS<br/>
                features/clients/      ← Todo sobre CLIENTES<br/>
                features/timbrado/     ← Todo sobre PAC/TIMBRADO<br/>
                shared/ui/             ← Componentes UI reutilizables
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
