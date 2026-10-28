'use client'

// Renders without the root layout (no fonts, no globals.css), so colors are inline.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f7',
          color: '#141414',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: 420,
            background: '#ffffff',
            borderRadius: 4,
            borderLeft: '2px solid #b8382a',
            boxShadow: '0 0 0 1px #e5e5ea, 0 2px 6px rgb(0 0 0 / 0.05)',
            padding: '40px 32px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>FacturaFast no pudo abrir esta pantalla</h2>
          <p style={{ marginTop: 8, fontSize: 14, color: '#5e5e66', lineHeight: 1.5 }}>
            Ocurrió un error inesperado. Tus facturas y datos no se modificaron. Vuelve a intentarlo; si sigue fallando,
            escríbenos con el código de abajo.
          </p>
          {error.digest && (
            <p style={{ marginTop: 8, fontSize: 12, color: '#5e5e66' }}>
              Código <span style={{ fontFamily: 'ui-monospace, monospace', color: '#141414' }}>{error.digest}</span>
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              height: 36,
              padding: '0 16px',
              border: 0,
              borderRadius: 6,
              background: '#2f4ba8',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Volver a intentar
          </button>
        </div>
      </body>
    </html>
  )
}
