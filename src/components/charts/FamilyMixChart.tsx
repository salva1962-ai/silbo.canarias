/**
 * Componente para visualizar el Mix de Familias (§5 KPIs)
 * Muestra la distribución de ventas por familia de productos
 */

import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts'
import Card from '../ui/Card'
import { useSalesByFamily } from '../../lib/hooks/useKPIs'

// Colores para cada familia (palette de Silbö Canarias)
const FAMILY_COLORS: Record<string, string> = {
  Silbö: '#818cf8', // indigo-400
  Lowi: '#22d3ee', // cyan-400
  'Vodafone Residencial': '#34d399', // green-400
  'Vodafone SoHo': '#fbbf24', // yellow-400
  Otros: '#94a3b8' // slate-400
}

export const FamilyMixChart: React.FC = () => {
  const salesByFamily = useSalesByFamily()

  // Preparar datos para Recharts
  const chartData = salesByFamily.map((item) => ({
    name: item.family,
    value: item.operations,
    percentage: item.percentage
  }))

  const totalOperations = salesByFamily.reduce(
    (sum, item) => sum + item.operations,
    0
  )

  // Renderizador personalizado para las etiquetas (sin tipado estricto para compatibilidad con Recharts)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
          📦 Mix de Familias
        </h3>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Total: {totalOperations} operaciones
        </div>
      </div>

      {salesByFamily.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500">
          No hay datos de ventas disponibles
        </div>
      ) : (
        <>
          {/* Gráfico de pastel */}
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={FAMILY_COLORS[entry.name] || '#94a3b8'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} operaciones`]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => (
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Tabla de detalles */}
          <div className="mt-6 space-y-2">
            {salesByFamily.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor: FAMILY_COLORS[item.family] || '#94a3b8'
                    }}
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {item.family}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {item.operations} ops
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-white min-w-[60px] text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}
