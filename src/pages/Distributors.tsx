import React, { useEffect, useMemo, useState } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  MapPinIcon,
  ChartBarIcon,
  EyeIcon,
  PencilSquareIcon,
  CalendarIcon,
  PhoneIcon,
  QueueListIcon
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../lib/useAppData'
import DistributorForm from '../components/DistributorForm'
import { VisitForm } from '../components/VisitForm'
import { SaleForm } from '../components/SaleForm'
import Modal from '../components/ui/Modal'
import ImportExportMenu from '../components/ImportExportMenu'
import {
  downloadDistributorTemplate,
  exportDistributors,
  importDistributorsWithUpdate
} from '../utils/excel'
import type {
  Distributor,
  NewDistributor,
  NewVisit,
  NewSale,
  PriorityLevel
} from '../lib/types'
import { TrashIcon } from '@heroicons/react/24/solid'

const statusStyles = {
  active: 'bg-pastel-green/20 text-pastel-green',
  pending: 'bg-pastel-yellow/20 text-pastel-yellow',
  blocked: 'bg-pastel-red/20 text-pastel-red'
}

const priorityStyles: Record<PriorityLevel, string> = {
  high: 'bg-pastel-red/15 text-pastel-red border border-pastel-red/30',
  medium:
    'bg-pastel-yellow/20 text-pastel-yellow border border-pastel-yellow/30',
  low: 'bg-pastel-cyan/15 text-pastel-cyan border border-pastel-cyan/30'
}

const priorityLabels: Record<PriorityLevel, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja'
}

interface ModalState {
  type: 'create' | 'edit' | 'visit' | 'sale'
  distributor?: Distributor | null
}

interface ModalMeta {
  title: string
  maxWidth: string
}

interface ActionButtonProps {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  theme?: 'indigo' | 'cyan' | 'green' | 'danger'
  onClick: () => void
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  label,
  theme = 'indigo',
  onClick
}) => {
  const themeMap: Record<string, string> = {
    indigo: 'bg-pastel-indigo/10 text-pastel-indigo hover:bg-pastel-indigo/20',
    cyan: 'bg-pastel-cyan/10 text-pastel-cyan hover:bg-pastel-cyan/20',
    green: 'bg-pastel-green/10 text-pastel-green hover:bg-pastel-green/20',
    danger: 'bg-pastel-red/10 text-pastel-red hover:bg-pastel-red/20'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
        themeMap[theme] ?? themeMap.indigo
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </button>
  )
}

const Distributors: React.FC = () => {
  const navigate = useNavigate()
  const {
    distributors,
    addDistributor,
    updateDistributor,
    deleteDistributor,
    addVisit,
    addSale,
    lookups,
    channelOptions,
    statusOptions,
    provinceOptions,
    stats
  } = useAppData()

  const [searchTerm, setSearchTerm] = useState<string>('')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [provinceFilter, setProvinceFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>(
    'all'
  )
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [activeModal, setActiveModal] = useState<ModalState | null>(null)
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [distributorToDelete, setDistributorToDelete] =
    useState<Distributor | null>(null)

  const modalMeta = useMemo((): ModalMeta => {
    if (!activeModal) return { title: '', maxWidth: 'max-w-2xl' }

    const base = { title: '', maxWidth: 'max-w-2xl' }
    switch (activeModal.type) {
      case 'create':
        return { ...base, title: 'Nuevo distribuidor' }
      case 'edit':
        return {
          ...base,
          title: `Editar distribuidor • ${activeModal.distributor?.name ?? ''}`
        }
      case 'visit':
        return {
          title: `Registrar visita • ${activeModal.distributor?.name ?? ''}`,
          maxWidth: 'max-w-xl'
        }
      case 'sale':
        return {
          title: `Registrar venta • ${activeModal.distributor?.name ?? ''}`,
          maxWidth: 'max-w-xl'
        }
      default:
        return base
    }
  }, [activeModal])

  const summaryCards = useMemo(
    (): {
      title: string
      value: string
      delta: string
      accent: string
      icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    }[] => [
      {
        title: 'Distribuidores activos',
        value: stats.activeDistributors.toString(),
        delta: `${stats.pendingDistributors} pendientes de activación`,
        accent: 'from-pastel-indigo/20 to-white',
        icon: ChartBarIcon
      },
      {
        title: 'Visitas últimos 7 días',
        value: stats.visitsLast7Days.toString(),
        delta: 'Seguimiento comercial reciente',
        accent: 'from-pastel-cyan/20 to-white',
        icon: CalendarIcon
      },
      {
        title: 'Operaciones registradas',
        value: stats.totalOperations.toString(),
        delta: `${stats.operationsByBrand[0]?.value ?? 0} Silbö | ${stats.operationsByBrand[1]?.value ?? 0} Lowi`,
        accent: 'from-pastel-yellow/30 to-white',
        icon: PhoneIcon
      }
    ],
    [stats]
  )

  const filteredDistributors = useMemo((): Distributor[] => {
    const filtered = distributors.filter((item: Distributor) => {
      const searchTermLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm
        ? true
        : [item.name, item.code, item.city, item.province]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(searchTermLower)

      const matchesChannel =
        channelFilter === 'all' || item.channelType === channelFilter
      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter
      const matchesProvince =
        provinceFilter === 'all' || item.province === provinceFilter
      const matchesPriority =
        priorityFilter === 'all' || item.priorityLevel === priorityFilter

      return (
        matchesSearch &&
        matchesChannel &&
        matchesStatus &&
        matchesProvince &&
        matchesPriority
      )
    })
    // Mostrar primero los distribuidores con mayor prioridad.
    return filtered.sort(
      (a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0)
    )
  }, [
    channelFilter,
    distributors,
    priorityFilter,
    provinceFilter,
    searchTerm,
    statusFilter
  ])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredDistributors.length / pageSize))
  }, [filteredDistributors.length, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [
    searchTerm,
    channelFilter,
    statusFilter,
    provinceFilter,
    priorityFilter,
    pageSize
  ])

  useEffect(() => {
    setCurrentPage((prev) => (prev > totalPages ? totalPages : prev))
  }, [totalPages])

  const paginatedDistributors = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredDistributors.slice(start, start + pageSize)
  }, [currentPage, filteredDistributors, pageSize])

  // Detectar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm !== '' ||
      channelFilter !== 'all' ||
      statusFilter !== 'all' ||
      provinceFilter !== 'all' ||
      priorityFilter !== 'all'
    )
  }, [searchTerm, channelFilter, statusFilter, provinceFilter, priorityFilter])

  const openModal = (
    type: ModalState['type'],
    distributor: Distributor | null = null
  ): void => {
    setActiveModal({ type, distributor })
  }

  const closeModal = (): void => setActiveModal(null)

  const handleCreateDistributor = (payload: NewDistributor): void => {
    addDistributor(payload)
    setActiveModal(null)
  }

  const handleEditDistributor =
    (id: string) =>
    (payload: NewDistributor): void => {
      updateDistributor(id, payload)
      setActiveModal(null)
    }

  const handleVisit = (payload: NewVisit): void => {
    addVisit(payload)
    setActiveModal(null)
  }

  const handleSale = (payload: NewSale): void => {
    addSale(payload)
    setActiveModal(null)
  }

  const handleDeleteDistributor = (): void => {
    if (!distributorToDelete) return
    deleteDistributor(distributorToDelete.id)
    setDistributorToDelete(null)
  }

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setSearchTerm(event.target.value)
  }

  const handleChannelFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setChannelFilter(event.target.value)
  }

  const handleStatusFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setStatusFilter(event.target.value)
  }

  const handleProvinceFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setProvinceFilter(event.target.value)
  }

  const handlePriorityFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setPriorityFilter(event.target.value as 'all' | PriorityLevel)
  }

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const nextSize = Number(event.target.value) || 10
    setPageSize(nextSize)
  }

  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  const resetFilters = (): void => {
    setSearchTerm('')
    setChannelFilter('all')
    setStatusFilter('all')
    setProvinceFilter('all')
    setPriorityFilter('all')
  }

  const tableHeaders = [
    'Distribuidor',
    'Código',
    'Tipo',
    'Marcas',
    'Estado',
    'Prioridad',
    'Completitud',
    'Operaciones',
    'Acciones'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pastel-indigo/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full px-2 sm:px-4 md:px-6 py-10 max-w-none">
        <header className="relative rounded-4xl border border-white/40 dark:border-gray-700/40 bg-gradient-to-r from-white/90 via-white/70 to-pastel-indigo/20 dark:from-gray-800/90 dark:via-gray-800/70 dark:to-pastel-indigo/10 p-8 shadow-xl backdrop-blur-lg">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-pastel-indigo/20 blur-3xl -z-10" />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-pastel-indigo">
                  Red de distribución
                </p>
                <h1 className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
                  Distribuidores
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
                  Monitorea el estado de cada partner, organiza visitas y
                  asegura la cobertura completa sobre las islas.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <span className="rounded-2xl bg-white/70 dark:bg-gray-700/70 px-4 py-2 text-sm font-semibold text-pastel-indigo shadow-sm whitespace-nowrap">
                  {stats.activeDistributors} activos ·{' '}
                  {stats.pendingDistributors} pendientes
                </span>

                <div className="relative z-10">
                  <ImportExportMenu<
                    Partial<Distributor> & {
                      isUpdate?: boolean
                      existingId?: string | number
                    }
                  >
                    type="distributors"
                    onDownloadTemplate={downloadDistributorTemplate}
                    onExport={() => exportDistributors(distributors)}
                    onExportFiltered={() =>
                      exportDistributors(filteredDistributors)
                    }
                    hasFilters={hasActiveFilters}
                    filteredCount={filteredDistributors.length}
                    totalCount={distributors.length}
                    onImport={(file) =>
                      importDistributorsWithUpdate(file, distributors)
                    }
                    onImportComplete={(data) => {
                      data.forEach((dist) => {
                        if (dist.isUpdate && dist.existingId) {
                          // Actualizar distribuidor existente
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          const { isUpdate, existingId, ...updateData } = dist
                          updateDistributor(existingId, updateData)
                        } else {
                          // Crear nuevo distribuidor
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          const { isUpdate, existingId, ...newData } = dist
                          addDistributor(newData as NewDistributor)
                        }
                      })
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => openModal('create')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pastel-indigo to-pastel-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pastel-indigo/30 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-indigo whitespace-nowrap"
                >
                  <PlusIcon className="h-4 w-4" />
                  Nuevo distribuidor
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowFilters((value) => !value)}
                className="inline-flex items-center gap-2 rounded-2xl border border-pastel-indigo/30 bg-white/60 dark:bg-gray-700/60 px-4 py-2 text-sm font-semibold text-pastel-indigo shadow-sm backdrop-blur transition hover:bg-white dark:hover:bg-gray-700"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                {showFilters ? 'Ocultar filtros' : 'Guardar filtro'}
              </button>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-6 md:grid-cols-3">
          {summaryCards.map((card) => (
            <article
              key={card.title}
              className={`rounded-3xl border border-white/40 bg-gradient-to-br ${card.accent} p-6 shadow-lg backdrop-blur`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                </div>
                <span className="rounded-2xl bg-white/70 dark:bg-gray-700/70 p-3 text-pastel-indigo shadow-inner">
                  <card.icon className="h-6 w-6" />
                </span>
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Resumen
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {card.delta}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/80 dark:bg-gray-800/80 p-6 shadow-xl backdrop-blur">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filtrar red
          </h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Buscar
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Nombre, código, localidad..."
                  className="w-full rounded-2xl border-0 bg-gray-100 dark:bg-gray-700/80 dark:bg-gray-700/80 px-11 py-3 text-sm text-gray-700 dark:text-gray-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-pastel-indigo"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Tipo de canal
              </label>
              <select
                value={channelFilter}
                onChange={handleChannelFilterChange}
                aria-label="Filtrar por tipo de canal"
                className="w-full rounded-2xl border-0 bg-gray-100 dark:bg-gray-700/80 dark:bg-gray-700/80 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-pastel-indigo"
              >
                <option value="all">Todos</option>
                {channelOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                aria-label="Filtrar por estado"
                className="w-full rounded-2xl border-0 bg-gray-100 dark:bg-gray-700/80 dark:bg-gray-700/80 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-pastel-indigo"
              >
                <option value="all">Todos</option>
                {statusOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Prioridad
              </label>
              <select
                value={priorityFilter}
                onChange={handlePriorityFilterChange}
                aria-label="Filtrar por prioridad"
                className="w-full rounded-2xl border-0 bg-gray-100 dark:bg-gray-700/80 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-pastel-indigo"
              >
                <option value="all">Todas</option>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Provincia
              </label>
              <select
                value={provinceFilter}
                onChange={handleProvinceFilterChange}
                aria-label="Filtrar por provincia"
                className="w-full rounded-2xl border-0 bg-gray-100 dark:bg-gray-700/80 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-pastel-indigo"
              >
                <option value="all">Todas</option>
                {provinceOptions.map((option) => (
                  <option
                    key={option.id || option.label}
                    value={option.id || option.label}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 shadow-sm transition hover:bg-white dark:hover:bg-gray-700"
              >
                Restablecer filtros
              </button>
            </div>
          </div>
          {showFilters && (
            <div className="mt-4 rounded-2xl border border-dashed border-pastel-indigo/40 bg-white/60 dark:bg-gray-700/60 p-4 text-xs text-gray-500 dark:text-gray-400">
              Próximamente podrás guardar filtros favoritos y compartirlos con
              tu equipo.
            </div>
          )}
        </section>

        <section className="mt-8 overflow-x-auto rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/85 dark:bg-gray-800/85 shadow-2xl backdrop-blur">
          <div className="min-w-[1200px]">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-pastel-indigo/20 via-white dark:via-gray-800 to-pastel-cyan/20">
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredDistributors.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-16 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No hay distribuidores que coincidan con los filtros
                      seleccionados.
                    </td>
                  </tr>
                )}

                {paginatedDistributors.map((distributor) => {
                  const channelLabel =
                    lookups.channels[distributor.channelType]?.label ??
                    distributor.channelType
                  const statusLabel =
                    lookups.statuses[distributor.status]?.label ??
                    distributor.status
                  const brands =
                    distributor.brands?.map(
                      (brandId: string) =>
                        lookups.brands[brandId]?.label ?? brandId
                    ) ?? []

                  return (
                    <tr
                      key={distributor.id}
                      className="hover:bg-gray-50 dark:bg-gray-700/80"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-pastel-indigo/30 to-pastel-cyan/20 text-sm font-semibold text-pastel-indigo">
                            {distributor.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/distributors/${distributor.id}`)
                              }
                              className="text-sm font-semibold text-gray-900 dark:text-white transition hover:text-pastel-indigo"
                            >
                              {distributor.name}
                            </button>
                            {distributor.contactPerson && (
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Responsable:{' '}
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {distributor.contactPerson}
                                </span>
                              </p>
                            )}
                            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <MapPinIcon className="h-4 w-4" />
                              {[distributor.city, distributor.province]
                                .filter(Boolean)
                                .join(', ') || 'Sin localización'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-semibold tracking-widest text-gray-600 dark:text-gray-300">
                          {distributor.code || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-2 rounded-full bg-pastel-indigo/10 px-3 py-1 text-xs font-medium text-pastel-indigo">
                          <QueueListIcon className="h-4 w-4" />
                          {channelLabel}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {brands.map((brand: string) => (
                            <span
                              key={brand}
                              className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-inner"
                            >
                              {brand}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[distributor.status] ??
                            'bg-gray-200 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-current" />
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {distributor.priorityLevel ? (
                          <div className="flex flex-col gap-2 text-sm">
                            <span
                              className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                                priorityStyles[distributor.priorityLevel] ??
                                'bg-gray-200 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {priorityLabels[distributor.priorityLevel] ??
                                'Sin dato'}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-semibold text-gray-700 dark:text-gray-200">
                                {Math.round(distributor.priorityScore ?? 0)}
                              </span>
                              <span>/100</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                              {/* Width refleja la puntuación de prioridad normalizada */}
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-pastel-indigo to-pastel-cyan"
                                style={{
                                  width: `${Math.max(5, Math.min(100, Math.round(distributor.priorityScore ?? 0)))}%`
                                }}
                                role="progressbar"
                                aria-label={`Prioridad ${Math.round(distributor.priorityScore ?? 0)} sobre 100`}
                              />
                            </div>
                            {distributor.priorityDrivers && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                {`${distributor.priorityDrivers.salesLast90Days} ops · ${
                                  distributor.priorityDrivers.lastVisitDays !=
                                  null
                                    ? `${distributor.priorityDrivers.lastVisitDays} días sin visita`
                                    : 'Visita pendiente'
                                }`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Sin datos
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2 text-sm">
                          <div className="h-2 w-full rounded-full bg-gray-200">
                            {/* Inline style required for dynamic completion % - see docs/CSS_INLINE_STYLES.md */}
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-pastel-indigo to-pastel-cyan"
                              style={{
                                width: `${Math.round((distributor.completion ?? 0) * 100)}%`
                              }}
                              role="progressbar"
                              aria-label={`Completitud: ${Math.round((distributor.completion ?? 0) * 100)}%`}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {Math.round((distributor.completion ?? 0) * 100)}%
                            completado
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-gray-900 dark:text-white">
                        {distributor.salesYtd?.toLocaleString('es-ES') ?? '—'}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <ActionButton
                            icon={EyeIcon}
                            label="Ficha"
                            onClick={() =>
                              navigate(`/distributors/${distributor.id}`)
                            }
                          />
                          <ActionButton
                            icon={PencilSquareIcon}
                            label="Editar"
                            theme="cyan"
                            onClick={() => openModal('edit', distributor)}
                          />
                          <ActionButton
                            icon={CalendarIcon}
                            label="Visita"
                            theme="green"
                            onClick={() => openModal('visit', distributor)}
                          />
                          <ActionButton
                            icon={ChartBarIcon}
                            label="Venta"
                            theme="indigo"
                            onClick={() => openModal('sale', distributor)}
                          />
                          <ActionButton
                            icon={TrashIcon}
                            label="Eliminar"
                            theme="danger"
                            onClick={() => setDistributorToDelete(distributor)}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {filteredDistributors.length > 0 && (
          <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/70 px-5 py-4 shadow-lg backdrop-blur md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Mostrando</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                aria-label="Seleccionar cantidad por página"
                className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-200"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} por página
                  </option>
                ))}
              </select>
              <span>de {filteredDistributors.length} distribuidores</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  canGoPrevious &&
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                disabled={!canGoPrevious}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white dark:hover:bg-gray-700"
              >
                Anterior
              </button>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Página {currentPage} de {totalPages}
              </div>
              <button
                type="button"
                onClick={() =>
                  canGoNext &&
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={!canGoNext}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white dark:hover:bg-gray-700"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {activeModal && (
        <Modal
          title={modalMeta.title}
          maxWidth={modalMeta.maxWidth}
          onClose={closeModal}
        >
          {activeModal.type === 'create' && (
            <DistributorForm
              onSubmit={handleCreateDistributor}
              onCancel={closeModal}
            />
          )}

          {activeModal.type === 'edit' && (
            <DistributorForm
              initial={activeModal.distributor}
              onSubmit={handleEditDistributor(
                String(activeModal.distributor?.id || '')
              )}
              onCancel={closeModal}
            />
          )}

          {activeModal.type === 'visit' && (
            <VisitForm
              distributor={activeModal.distributor ?? undefined}
              onSubmit={handleVisit}
              onCancel={closeModal}
            />
          )}

          {activeModal.type === 'sale' && activeModal.distributor && (
            <SaleForm
              distributor={{
                ...activeModal.distributor,
                brandPolicy: {
                  ...activeModal.distributor.brandPolicy,
                  allowed:
                    activeModal.distributor.brandPolicy.allowed ?? undefined
                }
              }}
              onSubmit={handleSale}
              onCancel={closeModal}
            />
          )}
        </Modal>
      )}

      {distributorToDelete && (
        <Modal
          title="Eliminar distribuidor"
          maxWidth="max-w-md"
          onClose={() => setDistributorToDelete(null)}
        >
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <p>
              ¿Seguro que quieres eliminar{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {distributorToDelete.name}
              </span>
              ? Se quitarán también sus visitas y ventas asociadas.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDistributorToDelete(null)}
                className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 shadow-sm hover:border-pastel-indigo/40 hover:text-pastel-indigo"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteDistributor}
                className="inline-flex items-center gap-2 rounded-2xl bg-pastel-red px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-pastel-red/90"
              >
                <TrashIcon className="h-4 w-4" /> Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Distributors
