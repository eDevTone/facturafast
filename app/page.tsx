import { FileText, TrendingUp, Users, DollarSign } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Nav */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900">FacturaFast</h1>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
            Nueva Factura
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-zinc-900">Dashboard</h2>
          <p className="text-zinc-500 mt-1">
            Bienvenido a FacturaFast - Sistema de facturación CFDI 4.0
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stat Card 1 */}
          <div className="border border-gray-200 rounded-lg p-6 hover:border-zinc-900 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-zinc-500">Total Facturado</p>
                <p className="text-3xl font-bold text-zinc-900 mt-2">$45,230</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-emerald-600 mt-3 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +12% vs mes anterior
            </p>
          </div>

          {/* Stat Card 2 */}
          <div className="border border-gray-200 rounded-lg p-6 hover:border-zinc-900 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-zinc-500">Facturas Este Mes</p>
                <p className="text-3xl font-bold text-zinc-900 mt-2">42</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-emerald-600 mt-3 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +8 desde la semana pasada
            </p>
          </div>

          {/* Stat Card 3 */}
          <div className="border border-gray-200 rounded-lg p-6 hover:border-zinc-900 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-zinc-500">Clientes Activos</p>
                <p className="text-3xl font-bold text-zinc-900 mt-2">18</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-zinc-500 mt-3">
              3 nuevos este mes
            </p>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="border border-gray-200 rounded-lg p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-2">
              FacturaFast está listo
            </h3>
            <p className="text-zinc-500 mb-6">
              Sistema de facturación electrónica SAT. Rápido, simple, profesional.
            </p>
            <div className="flex gap-3 justify-center">
              <button className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                Crear Primera Factura
              </button>
              <button className="px-6 py-2.5 border border-zinc-300 text-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors font-medium">
                Ver Documentación
              </button>
            </div>
          </div>
        </div>

        {/* Color Palette Demo (remove in production) */}
        <div className="mt-12 border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-zinc-900 mb-4">
            Cal.com Style - Color Palette
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-full h-20 rounded-lg bg-zinc-900 mb-2"></div>
              <p className="text-sm text-zinc-600">Primary (Zinc-900)</p>
              <p className="text-xs text-zinc-400">#18181B</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 rounded-lg bg-blue-500 mb-2"></div>
              <p className="text-sm text-zinc-600">Accent (Blue)</p>
              <p className="text-xs text-zinc-400">#3B82F6</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 rounded-lg bg-emerald-500 mb-2"></div>
              <p className="text-sm text-zinc-600">Success (Green)</p>
              <p className="text-xs text-zinc-400">#10B981</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 rounded-lg bg-red-500 mb-2"></div>
              <p className="text-sm text-zinc-600">Destructive (Red)</p>
              <p className="text-xs text-zinc-400">#EF4444</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
