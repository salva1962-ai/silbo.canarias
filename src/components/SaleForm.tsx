import { useMemo, useState, useEffect } from 'react'
import { useAppData } from '../lib/useAppData'

interface BrandOption {
  id: string
  label: string
}

interface Distributor {
  id: string | number
  name: string
  completion?: number
  brandPolicy?: {
    allowed?: string[]
    blocked?: string[]
  }
}

interface SaleFamily {
  id: string
  label: string
}

interface SaleFormData {
  date: string
  brand: string
  family: string
  operations: number
  notes: string
}

interface SaleData extends SaleFormData {
  distributorId: string | number
}

interface SaleFormProps {
  distributor?: Distributor
  onSubmit?: (data: SaleData) => void
  onCancel?: () => void
}

type FormErrors = Record<string, string>

const saleFamilies: SaleFamily[] = [
  { id: 'convergente', label: 'Convergente' },
  { id: 'movil', label: 'Línea móvil' },
  { id: 'solo_fibra', label: 'Solo fibra' },
  { id: 'empresa_autonomo', label: 'Empresa / Autónomo' },
  { id: 'microempresa', label: 'Microempresa' }
]

const defaultSale: SaleFormData = {
  date: new Date().toISOString().slice(0, 10),
  brand: 'silbo',
  family: 'convergente',
  operations: 1,
  notes: ''
}

export function SaleForm({ distributor, onSubmit, onCancel }: SaleFormProps) {
  const { brandOptions } = useAppData()
  const [form, setForm] = useState<SaleFormData>(defaultSale)
  const [errors, setErrors] = useState<FormErrors>({})

  const distributorLabel = useMemo(
    () => distributor?.name ?? 'Distribuidor sin nombre',
    [distributor]
  )
  const completion = distributor?.completion ?? 0
  const hasMinimumCompletion = completion >= 0.7

  const brandPolicy = distributor?.brandPolicy
  const eligibleBrandOptions = useMemo(() => {
    const policy = brandPolicy ?? {}
    if (policy.allowed?.length) {
      const allowed = new Set(policy.allowed)
      return brandOptions.filter((brand: BrandOption) => allowed.has(brand.id))
    }
    if (policy.blocked?.length) {
      const blocked = new Set(policy.blocked)
      return brandOptions.filter((brand: BrandOption) => !blocked.has(brand.id))
    }
    return brandOptions
  }, [brandOptions, brandPolicy])

  useEffect(() => {
    const allowedBrandIds = new Set(
      eligibleBrandOptions.map((brand: BrandOption) => brand.id)
    )
    if (!allowedBrandIds.size) {
      setForm((current) => ({ ...current, brand: '' }))
      return
    }
    if (!allowedBrandIds.has(form.brand)) {
      setForm((current) => ({ ...current, brand: eligibleBrandOptions[0].id }))
    }
  }, [eligibleBrandOptions, form.brand])

  const updateField = (
    field: keyof SaleFormData,
    value: string | number
  ): void => {
    setForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!hasMinimumCompletion) {
      newErrors.base =
        'No se pueden registrar ventas hasta completar el 70% de la ficha.'
    }

    if (!form.date) {
      newErrors.date = 'Selecciona una fecha.'
    }

    if (!form.brand) {
      newErrors.brand = 'Selecciona una marca.'
    } else if (
      !eligibleBrandOptions.some(
        (brand: BrandOption) => brand.id === form.brand
      )
    ) {
      newErrors.brand = 'Marca no disponible para este distribuidor.'
    }

    if (!form.family) {
      newErrors.family = 'Selecciona una familia.'
    }

    if (!form.operations || Number(form.operations) < 1) {
      newErrors.operations = 'Indica al menos una operación.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!validate()) return

    if (!distributor?.id) return

    onSubmit?.({
      distributorId: distributor.id,
      date: form.date,
      brand: form.brand,
      family: form.family,
      operations: Number(form.operations) || 1,
      notes: form.notes.trim()
    })
  }

  const handleDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    updateField('date', event.target.value)
  }

  const handleBrandChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    updateField('brand', event.target.value)
  }

  const handleFamilyChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    updateField('family', event.target.value)
  }

  const handleOperationsChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    updateField('operations', Number(event.target.value))
  }

  const handleNotesChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
    updateField('notes', event.target.value)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Registrar venta
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Asociada a{' '}
          <span className="font-medium text-pastel-indigo">
            {distributorLabel}
          </span>
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Fecha *
          </span>
          <input
            type="date"
            value={form.date}
            onChange={handleDateChange}
            className={`rounded-2xl border px-4 py-2.5 text-sm shadow-inner focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40 ${
              errors.date
                ? 'border-pastel-red/60'
                : 'border-gray-200 dark:border-gray-600'
            }`}
          />
          {errors.date && (
            <span className="text-xs text-pastel-red" role="alert">
              {errors.date}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Marca *
          </span>
          <select
            value={form.brand}
            onChange={handleBrandChange}
            className={`rounded-2xl border px-4 py-2.5 text-sm shadow-inner focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40 ${
              errors.brand
                ? 'border-pastel-red/60'
                : 'border-gray-200 dark:border-gray-600'
            }`}
          >
            <option value="">Selecciona...</option>
            {eligibleBrandOptions.map((brand: BrandOption) => (
              <option key={brand.id} value={brand.id}>
                {brand.label}
              </option>
            ))}
          </select>
          {errors.brand && (
            <span className="text-xs text-pastel-red" role="alert">
              {errors.brand}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Familia *
          </span>
          <select
            value={form.family}
            onChange={handleFamilyChange}
            className={`rounded-2xl border px-4 py-2.5 text-sm shadow-inner focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40 ${
              errors.family
                ? 'border-pastel-red/60'
                : 'border-gray-200 dark:border-gray-600'
            }`}
          >
            <option value="">Selecciona...</option>
            {saleFamilies.map((family) => (
              <option key={family.id} value={family.id}>
                {family.label}
              </option>
            ))}
          </select>
          {errors.family && (
            <span className="text-xs text-pastel-red" role="alert">
              {errors.family}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Operaciones *
          </span>
          <input
            type="number"
            min={1}
            step={1}
            value={form.operations}
            onChange={handleOperationsChange}
            className={`rounded-2xl border px-4 py-2.5 text-sm shadow-inner focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40 ${
              errors.operations
                ? 'border-pastel-red/60'
                : 'border-gray-200 dark:border-gray-600'
            }`}
          />
          {errors.operations && (
            <span className="text-xs text-pastel-red" role="alert">
              {errors.operations}
            </span>
          )}
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Notas comerciales
        </span>
        <textarea
          value={form.notes}
          onChange={handleNotesChange}
          rows={3}
          className="rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm shadow-inner focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40"
          placeholder="Detalle comercial, cross-selling, incidencias..."
          maxLength={500}
        />
        <span className="text-xs text-gray-400 ml-auto">
          {form.notes.length}/500
        </span>
      </label>

      {!hasMinimumCompletion && (
        <div
          className="rounded-2xl border border-pastel-yellow/40 bg-pastel-yellow/15 px-4 py-3 text-sm text-pastel-yellow"
          role="alert"
        >
          Ficha al {Math.round(completion * 100)}% completada. Completa al menos
          el 70% para habilitar el registro de ventas.
        </div>
      )}

      {!eligibleBrandOptions.length && (
        <div
          className="rounded-2xl border border-pastel-red/40 bg-pastel-red/10 px-4 py-3 text-sm text-pastel-red"
          role="alert"
        >
          Ninguna marca disponible según la política actual. Revisa la
          configuración del distribuidor.
        </div>
      )}

      {errors.base && (
        <div
          className="text-xs font-semibold uppercase tracking-wide text-pastel-red"
          role="alert"
        >
          {errors.base}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-gray-200 dark:border-gray-600 px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 transition hover:border-gray-300 hover:bg-white dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={!hasMinimumCompletion || !eligibleBrandOptions.length}
          className="rounded-2xl bg-gradient-to-r from-pastel-indigo to-pastel-cyan px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pastel-indigo/30 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-pastel-indigo focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          Guardar venta
        </button>
      </div>
    </form>
  )
}
