/**
 * Mock Notification Service (WhatsApp + Email)
 * 
 * Simula envío de notificaciones sin APIs reales.
 * Log en consola para debugging.
 */

export interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

export class MockNotificationService {
  /**
   * Enviar por WhatsApp (Mock)
   */
  static async sendWhatsApp(to: string, message: string, pdfUrl?: string): Promise<NotificationResult> {
    console.log('[MOCK WhatsApp] Enviando mensaje:')
    console.log('  Para:', to)
    console.log('  Mensaje:', message)
    if (pdfUrl) console.log('  PDF:', pdfUrl)

    await new Promise(resolve => setTimeout(resolve, 500))

    return {
      success: true,
      messageId: `whatsapp_mock_${Date.now()}`,
    }
  }

  /**
   * Enviar por Email (Mock)
   */
  static async sendEmail(
    to: string,
    subject: string,
    body: string,
    attachments?: { filename: string; url: string }[]
  ): Promise<NotificationResult> {
    console.log('[MOCK Email] Enviando email:')
    console.log('  Para:', to)
    console.log('  Asunto:', subject)
    console.log('  Cuerpo:', body.substring(0, 100) + '...')
    if (attachments) console.log('  Adjuntos:', attachments.map(a => a.filename).join(', '))

    await new Promise(resolve => setTimeout(resolve, 500))

    return {
      success: true,
      messageId: `email_mock_${Date.now()}`,
    }
  }

  /**
   * Enviar factura por WhatsApp + Email
   */
  static async sendInvoice(
    clientEmail: string,
    clientPhone: string,
    invoiceNumber: string,
    pdfUrl: string,
    xmlUrl: string
  ): Promise<{ whatsapp: NotificationResult; email: NotificationResult }> {
    const message = `¡Tu factura ${invoiceNumber} está lista! 📋\n\nPuedes descargarla en el link.`
    
    const [whatsapp, email] = await Promise.all([
      this.sendWhatsApp(clientPhone, message, pdfUrl),
      this.sendEmail(
        clientEmail,
        `Factura ${invoiceNumber}`,
        `Adjunto encontrarás tu factura electrónica.\n\nGracias por tu preferencia.`,
        [
          { filename: `factura_${invoiceNumber}.pdf`, url: pdfUrl },
          { filename: `factura_${invoiceNumber}.xml`, url: xmlUrl },
        ]
      ),
    ])

    return { whatsapp, email }
  }
}
