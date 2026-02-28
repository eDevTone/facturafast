import { FileText, TrendingUp, Users, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
                FacturaFast está listo
              </h3>
              <p className="text-muted-foreground mb-6">
                Sistema de facturación electrónica SAT. Rápido, simple, profesional.
              </p>
              <div className="flex gap-3 justify-center">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Crear Primera Factura
                </Button>
                <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                  Ver Documentación
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design System Preview */}
        <Card className="mt-12 border-border">
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold text-foreground mb-4">
              Cal.com Style - Tailwind 4 + Shadcn/ui
            </h4>
            
            {/* Color Swatches */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="w-full h-20 rounded-lg bg-primary mb-2"></div>
                <p className="text-sm text-foreground">Primary</p>
                <p className="text-xs text-muted-foreground">#18181B</p>
              </div>
              <div className="text-center">
                <div className="w-full h-20 rounded-lg bg-accent mb-2"></div>
                <p className="text-sm text-foreground">Accent</p>
                <p className="text-xs text-muted-foreground">#3B82F6</p>
              </div>
              <div className="text-center">
                <div className="w-full h-20 rounded-lg bg-success mb-2"></div>
                <p className="text-sm text-foreground">Success</p>
                <p className="text-xs text-muted-foreground">#10B981</p>
              </div>
              <div className="text-center">
                <div className="w-full h-20 rounded-lg bg-destructive mb-2"></div>
                <p className="text-sm text-foreground">Destructive</p>
                <p className="text-xs text-muted-foreground">#EF4444</p>
              </div>
            </div>

            {/* Component Samples */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Buttons:</p>
                <div className="flex gap-2 flex-wrap">
                  <Button>Primary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Badges:</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge>Default</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
