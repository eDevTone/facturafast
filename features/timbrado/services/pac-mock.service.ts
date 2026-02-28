/**
 * Mock PAC Service (Finkok/SW Sapien)
 * 
 * Simula el timbrado de CFDI sin llamar al PAC real.
 * Genera UUID fake y datos de respuesta similares.
 */

export interface TimbradoResult {
  success: boolean
  uuid?: string
  xmlSellado?: string
  fechaTimbrado?: string
  error?: string
}

export class MockPACService {
  /**
   * Timbrar CFDI (Mock)
   */
  static async timbrar(xmlString: string): Promise<TimbradoResult> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simular éxito (90% de las veces)
    if (Math.random() > 0.1) {
      const uuid = this.generateMockUUID()
      
      return {
        success: true,
        uuid,
        xmlSellado: this.addMockSello(xmlString, uuid),
        fechaTimbrado: new Date().toISOString(),
      }
    }

    // Simular error ocasional
    return {
      success: false,
      error: 'Error de conexión con PAC (simulado)',
    }
  }

  /**
   * Cancelar CFDI (Mock)
   */
  static async cancelar(uuid: string, motivo: string): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 800))

    return {
      success: true,
    }
  }

  /**
   * Generar UUID fake pero válido en formato
   */
  private static generateMockUUID(): string {
    return 'XXXXXXXX-XXXX-4XXX-YXXX-XXXXXXXXXXXX'.replace(/[XY]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'X' ? r : (r & 0x3 | 0x8)
      return v.toString(16).toUpperCase()
    })
  }

  /**
   * Agregar sello digital mock al XML
   */
  private static addMockSello(xml: string, uuid: string): string {
    // En producción, el PAC agrega TimbreFiscalDigital
    // Por ahora solo agregamos UUID como comentario
    return xml.replace('</cfdi:Comprobante>', `
  <!-- Mock Timbrado -->
  <!-- UUID: ${uuid} -->
  <!-- Fecha Timbrado: ${new Date().toISOString()} -->
</cfdi:Comprobante>`)
  }
}
