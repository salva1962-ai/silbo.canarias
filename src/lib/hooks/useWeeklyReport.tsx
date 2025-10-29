import React, { useCallback } from 'react'
import html2canvas from 'html2canvas'
import { pdf } from '@react-pdf/renderer'
import WeeklyPDFReport, {
  type WeeklyReportData
} from '../../components/reports/WeeklyPDFReport'
import { createPrefixedLogger } from '../utils/logger'

const log = createPrefixedLogger('[WeeklyReport]')

/**
 * Hook para generar reportes PDF semanales
 *
 * Captura gráficos del DOM como imágenes y genera un PDF con @react-pdf/renderer
 */
export const useWeeklyReport = () => {
  /**
   * Captura un elemento HTML como imagen base64
   */
  const captureChart = useCallback(
    async (elementId: string): Promise<string | null> => {
      const element = document.getElementById(elementId)

      if (!element) {
        log.warn(`Elemento ${elementId} no encontrado`)
        return null
      }

      try {
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2, // Mayor calidad
          logging: false,
          useCORS: true
        })

        return canvas.toDataURL('image/png')
      } catch (error) {
        log.error(`Error capturando ${elementId}:`, error)
        return null
      }
    },
    []
  )

  /**
   * Genera y descarga el PDF del reporte semanal
   */
  const generateWeeklyPDF = useCallback(
    async (
      data: WeeklyReportData,
      chartElementIds?: {
        salesByBrand?: string
        trends?: string
        topMunicipalities?: string
      }
    ): Promise<void> => {
      try {
        // Capturar gráficos si se proporcionan IDs
        const chartImages: WeeklyReportData['chartImages'] = {}

        if (chartElementIds?.salesByBrand) {
          chartImages.salesByBrand =
            (await captureChart(chartElementIds.salesByBrand)) || undefined
        }

        if (chartElementIds?.trends) {
          chartImages.trends =
            (await captureChart(chartElementIds.trends)) || undefined
        }

        if (chartElementIds?.topMunicipalities) {
          chartImages.topMunicipalities =
            (await captureChart(chartElementIds.topMunicipalities)) || undefined
        }

        // Datos completos con imágenes
        const reportData: WeeklyReportData = {
          ...data,
          chartImages
        }

        // Generar PDF
        const pdfDocument = <WeeklyPDFReport data={reportData} />
        const blob = await pdf(pdfDocument).toBlob()

        // Descargar PDF
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `informe-semanal-${data.week}.pdf`
        link.click()

        // Limpiar
        URL.revokeObjectURL(url)
      } catch (error) {
        log.error('Error generando PDF:', error)
        throw new Error('No se pudo generar el informe PDF')
      }
    },
    [captureChart]
  )

  /**
   * Genera datos de ejemplo para el reporte (útil para testing)
   */
  const generateSampleData = useCallback((): WeeklyReportData => {
    const week = '41'
    const year = new Date().getFullYear()

    return {
      week,
      dateRange: `9 - 15 Octubre ${year}`,
      generatedAt: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      kpis: {
        totalSales: 245,
        totalVisits: 38,
        activeDistributors: 42,
        newCandidates: 7,
        conversionRate: 16.7,
        avgResponseTime: '2.4 días'
      },
      salesByBrand: [
        { brand: 'Silbö', operations: 128, percentage: 52.2 },
        { brand: 'Lowi', operations: 78, percentage: 31.8 },
        { brand: 'Vodafone', operations: 39, percentage: 15.9 }
      ],
      topPerformers: [
        { name: 'Distribuidor Las Palmas Centro', operations: 45, rank: 1 },
        { name: 'Distribuidor Tenerife Sur', operations: 38, rank: 2 },
        { name: 'Distribuidor La Laguna', operations: 32, rank: 3 },
        { name: 'Distribuidor Telde', operations: 28, rank: 4 },
        { name: 'Distribuidor Arona', operations: 24, rank: 5 },
        { name: 'Distribuidor Puerto del Rosario', operations: 21, rank: 6 },
        { name: 'Distribuidor Arrecife', operations: 18, rank: 7 },
        { name: 'Distribuidor Santa Cruz Norte', operations: 15, rank: 8 },
        { name: 'Distribuidor Maspalomas', operations: 13, rank: 9 },
        { name: 'Distribuidor Costa Teguise', operations: 11, rank: 10 }
      ],
      highlights: [
        'Incremento del 12.5% en ventas respecto a la semana anterior',
        'Silbö mantiene el liderazgo con 52.2% de las operaciones',
        '7 nuevos candidatos captados en el pipeline',
        'Tasa de conversión se mantiene estable en 16.7%'
      ]
    }
  }, [])

  return {
    generateWeeklyPDF,
    captureChart,
    generateSampleData
  }
}

export default useWeeklyReport
