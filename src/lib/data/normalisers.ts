import type {
  Candidate,
  Checklist,
  Distributor,
  Preferences,
  PriorityDrivers,
  PriorityLevel,
  Sale,
  User,
  Visit,
  VisitReminder
} from '../types'
import {
  pipelineStages,
  type ChannelType
} from './config'
import { DEFAULT_PREFERENCES } from './defaults'
import {
  getInitials,
  generateId,
  normaliseDate,
  sanitisePhone
} from './helpers'
import { resolveCategory, deriveBrandsForChannel } from './taxonomy'
import {
  resolveReminderWithDefaults,
  shiftReminderForVisitDate
} from './reminders'
import {
  emailPattern,
  spanishMobilePattern,
  postalCodePattern,
  taxIdPattern
} from './patterns'

type UnknownRecord = Record<string, unknown>

export type RawDistributor = UnknownRecord & {
  id?: string
  code?: string
  external_code?: string
  nombre_pdv?: string
  name?: string
  contactPerson?: string
  responsable?: string
  contact_name?: string
  responsableSecundario?: string
  responsable_backup?: string
  contactPersonBackup?: string
  provincia?: string
  province?: string
  poblacion?: string
  city?: string
  postalCode?: string
  cp?: string
  email?: string
  telefono?: string
  phone?: string
  brands?: string[]
  brands_enabled?: string[]
  channel_type?: string
  channelType?: ChannelType
  taxId?: string
  cif?: string
  fiscalName?: string
  razonSocial?: string
  fiscalAddress?: string
  direccionFiscal?: string
  operational_status?: string
  status?: string
  pendingData?: boolean
  completion?: number
  salesYtd?: number
  sales?: number
  fecha_alta?: string
  createdAt?: string
  notes?: string
  upgradeRequested?: boolean
  priorityScore?: number
  priorityLevel?: PriorityLevel
  priorityDrivers?: Partial<PriorityDrivers>
}

export type DistributorInput = RawDistributor | Distributor

export type RawCandidate = UnknownRecord & {
  id?: string
  nombre?: string
  name?: string
  poblacion?: string
  city?: string
  island?: string
  channelCode?: string
  propuesta_nomenclatura?: string
  stage?: string
  source?: string
  notes?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  position?: number
  pendingData?: boolean
  contacto?: {
    nombre?: string
    name?: string
    movil?: string
    phone?: string
    email?: string
  }
  contact?: {
    name?: string
    phone?: string
    email?: string
  }
}

export type CandidateInput = RawCandidate | Candidate

export type RawVisit = UnknownRecord & {
  id?: string
  distributor_id?: string
  distributorId?: string
  candidate_id?: string
  candidateId?: string
  visit_date?: string
  date?: string
  visit_type?: string
  type?: string
  objetivo?: string
  objective?: string
  resumen?: string
  summary?: string
  proximos_pasos?: string
  nextSteps?: string
  resultado?: string
  result?: string
  duracion_min?: number
  durationMinutes?: number
  reminder?: Partial<VisitReminder>
  reminder_minutes?: number
  reminderMinutes?: number
  reminder_channel?: string
  reminder_enabled?: boolean
}

export type VisitInput = RawVisit | Visit

export type RawSale = UnknownRecord & {
  id?: string
  distributor_id?: string
  distributorId?: string
  sale_date?: string
  date?: string
  brand?: string
  family?: string
  operaciones?: number
  operations?: number
  notes?: string
}

export type SaleInput = RawSale | Sale

export type RawUser = UnknownRecord & {
  id?: string
  fullName?: string
  name?: string
  email?: string
  mail?: string
  role?: string
  position?: string
  region?: string
  zone?: string
  permissions?: string
  permission?: string
  phone?: string
  mobile?: string
  avatarInitials?: string
  lastLogin?: string
  createdAt?: string
  activity?: Array<UnknownRecord>
}

export type UserInput = RawUser | User | null | undefined

export type RawPreferences = UnknownRecord & {
  privacyEmail?: string
  allowDataExports?: boolean
}

const toStringValue = (value: unknown): string => {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (value == null) return ''
  return String(value).trim()
}

export type PreferencesInput = RawPreferences | Preferences | null | undefined

export const evaluateDistributorChecklist = (
  candidate: unknown = {}
): Checklist => {
  const source = (candidate ?? {}) as UnknownRecord
  const taxId = toStringValue(source.taxId ?? source.cif).toUpperCase()
  const fiscalName = toStringValue(source.fiscalName ?? source.razonSocial)
  const fiscalAddress = toStringValue(
    source.fiscalAddress ?? source.direccionFiscal
  )
  const email = toStringValue(source.email)
  const phone = sanitisePhone(toStringValue(source.phone))
  const postalCode = toStringValue(source.postalCode)

  return {
    taxId: taxIdPattern.test(taxId),
    fiscalName: Boolean(fiscalName),
    fiscalAddress: Boolean(fiscalAddress),
    email: emailPattern.test(email),
    phone: spanishMobilePattern.test(phone),
    postalCode: postalCodePattern.test(postalCode)
  }
}

export const computeDistributorCompletion = (
  candidate: UnknownRecord = {},
  checklist: Checklist = evaluateDistributorChecklist(candidate)
): number => {
  const checks = [
    Boolean(toStringValue(candidate.name)),
    Boolean(toStringValue(candidate.contactPerson)),
    Boolean(toStringValue(candidate.province)),
    Boolean(toStringValue(candidate.city)),
    checklist.taxId,
    checklist.email,
    checklist.phone,
    checklist.fiscalAddress,
    Array.isArray(candidate.brands) ? candidate.brands.length > 0 : false,
    candidate.status === 'active'
  ]

  const total = checks.length || 1
  const fulfilled = checks.filter(Boolean).length
  return Math.min(1, Math.max(0, Number((fulfilled / total).toFixed(2))))
}

import type { Activity } from '../types'

export const normaliseActivityLog = (items: Array<UnknownRecord> = []): Activity[] =>
  items.filter(Boolean).map((activity, index) => ({
    id: toStringValue(activity.id) || generateId(`activity-${index}`),
    type: (activity.type as Activity['type']) || 'information',
    title: toStringValue(activity.title) || 'Actividad registrada',
    description: toStringValue(activity.detail) || '',
    timestamp: toStringValue(activity.timestamp) || new Date().toISOString(),
    priority: (activity.priority as Activity['priority']) || 'medium',
    metadata: (activity.metadata as Record<string, string | number>) || {}
  }))

export const normaliseUser = (user: UserInput): User | null => {
  if (!user) return null

  const source = user as RawUser

  const fullName = toStringValue(source.fullName ?? source.name)
  const email = toStringValue(source.email ?? source.mail).toLowerCase()
  const role = toStringValue(source.role ?? source.position)
  const region = toStringValue(source.region ?? source.zone)
  const permissions = toStringValue(source.permissions ?? source.permission)
  const phone = toStringValue(source.phone ?? source.mobile)
  const lastLogin = toStringValue(source.lastLogin) || new Date().toISOString()
  const createdAt = toStringValue(source.createdAt) || new Date().toISOString()

  const safeName = fullName || 'Usuario sin nombre'
  const initials =
    toStringValue(
      source.avatarInitials || getInitials(safeName || email)
    ).slice(0, 2) || 'SC'

  return {
    id: source.id ?? generateId('user'),
    fullName: safeName,
    email,
    role,
    region,
    permissions: permissions || 'Supervisor',
    phone,
    avatarInitials: initials,
    lastLogin,
    createdAt,
    activity: normaliseActivityLog(source.activity ?? [])
  }
}

export const normalisePreferences = (prefs: PreferencesInput): Preferences => {
  const source = (prefs ?? DEFAULT_PREFERENCES) as PreferencesInput &
    RawPreferences
  const email = toStringValue(
    source.privacyEmail ?? DEFAULT_PREFERENCES.privacyEmail
  )
  const allowDataExports =
    source.allowDataExports ?? DEFAULT_PREFERENCES.allowDataExports

  return {
    privacyEmail: email || DEFAULT_PREFERENCES.privacyEmail,
    allowDataExports: Boolean(allowDataExports)
  }
}

export const normaliseDistributors = (
  items: Array<DistributorInput> = []
): Distributor[] =>
  items.map((item, index) => {
    const source = item as RawDistributor
    const rawCode = toStringValue(source.code ?? source.external_code)
    const code = rawCode ? rawCode.toUpperCase() : `PVP-${index + 1}`
    const category = resolveCategory(code)

    const rawBrands = Array.isArray(source.brands)
      ? source.brands
      : Array.isArray(source.brands_enabled)
        ? source.brands_enabled
        : []
    const channelType =
      source.channelType ?? 'non_exclusive'
    const brands = deriveBrandsForChannel(rawBrands, channelType, category)

    const taxId = toStringValue(source.taxId ?? source.cif).toUpperCase()
    const fiscalName = toStringValue(source.fiscalName ?? source.razonSocial)
    const fiscalAddress = toStringValue(
      source.fiscalAddress ?? source.direccionFiscal
    )
    const email = toStringValue(source.email)
    const phoneRaw = toStringValue(source.telefono ?? source.phone)
    const postalCode = toStringValue(source.postalCode ?? source.cp)

    const distributorBase = {
      name:
        toStringValue(source.nombre_pdv ?? source.name) ||
        'Distribuidor sin nombre',
      contactPerson: toStringValue(
        source.contactPerson ?? source.responsable ?? source.contact_name
      ),
      contactPersonBackup: toStringValue(
        source.contactPersonBackup ??
          source.responsableSecundario ??
          source.responsable_backup
      ),
      province: toStringValue(source.provincia ?? source.province),
      city: toStringValue(source.poblacion ?? source.city),
      postalCode,
      email,
      phone: phoneRaw,
      brands,
      status: (source.status ?? 'pending') as Distributor['status']
    }

    const checklist = evaluateDistributorChecklist({
      ...distributorBase,
      taxId,
      fiscalName,
      fiscalAddress
    })
    const completion =
      source.completion ??
      computeDistributorCompletion(distributorBase, checklist)

    return {
      id: source.id ?? generateId('dist'),
      code,
      category,
      categoryId: category.id,
      pendingData: category.pendingData || Boolean(source.pendingData),
      brandPolicy: category.brandPolicy,
      name: distributorBase.name,
      contactPerson: distributorBase.contactPerson,
      contactPersonBackup: distributorBase.contactPersonBackup,
      channelType,
      brands,
      status: distributorBase.status,
      province: distributorBase.province,
      city: distributorBase.city,
      postalCode,
      phone: phoneRaw,
      email,
      createdAt: normaliseDate(source.fecha_alta ?? source.createdAt),
      notes: toStringValue(source.notes),
      taxId,
      fiscalName,
      fiscalAddress,
      upgradeRequested: Boolean(source.upgradeRequested ?? false),
      checklist,
      checklistComplete: Object.values(checklist).every(Boolean),
      completion,
      salesYtd: Number(source.salesYtd ?? source.sales ?? 0),
      priorityScore: Number(source.priorityScore ?? 0),
      priorityLevel: (source.priorityLevel as PriorityLevel) ?? 'medium',
      priorityDrivers: {
        traffic: Number(source.priorityDrivers?.traffic ?? 0),
        sales: Number(source.priorityDrivers?.sales ?? 0),
        dataQuality: Number(source.priorityDrivers?.dataQuality ?? 0),
        salesLast90Days: Number(source.priorityDrivers?.salesLast90Days ?? 0),
        lastSaleDays:
          source.priorityDrivers?.lastSaleDays != null
            ? Number(source.priorityDrivers?.lastSaleDays)
            : null,
        lastVisitDays:
          source.priorityDrivers?.lastVisitDays != null
            ? Number(source.priorityDrivers?.lastVisitDays)
            : null,
        updatedAt:
          toStringValue(source.priorityDrivers?.updatedAt) ||
          normaliseDate(new Date())
      }
    }
  })

export const normaliseCandidates = (
  items: Array<CandidateInput> = []
): Candidate[] => {
  const stageGroups = new Map<
    string,
    Array<{
      candidate: Candidate
      rawPosition: number | null
      fallbackOrder: number
    }>
  >()
  const pipelineStageIds = pipelineStages.map((stage) => stage.id)

  items.forEach((item, index) => {
    const source = item as RawCandidate
    const rawCode = toStringValue(
      source.channelCode ?? source.propuesta_nomenclatura
    )
    const channelCode = rawCode ? rawCode.toUpperCase() : ''
    const category = resolveCategory(channelCode)
    const stage = (source.stage ?? 'new') as Candidate['stage']

    const candidate: Candidate = {
      id: source.id ?? generateId('cand'),
      name: toStringValue(source.nombre ?? source.name) || 'Candidato sin nombre',
      taxId: toStringValue(source.taxId ?? ''),
      city: toStringValue(source.poblacion ?? source.city),
      island: toStringValue(source.island),
      channelCode,
      category,
      categoryId: category.id,
      pendingData: category.pendingData || Boolean(source.pendingData),
      brandPolicy: category.brandPolicy,
      contact: {
        name: toStringValue(source.contacto?.nombre ?? source.contact?.name),
        phone: toStringValue(source.contacto?.movil ?? source.contact?.phone),
        email: toStringValue(source.contacto?.email ?? source.contact?.email)
      },
      stage,
      source: toStringValue(source.source) || 'Autoregistro',
      notes: toStringValue(source.notes),
      createdAt: normaliseDate(
        source.created_at ?? source.createdAt ?? new Date()
      ),
      updatedAt: normaliseDate(
        source.updated_at ?? source.updatedAt ?? new Date()
      ),
      position: 0,
      priority: 'medium'
    }

    const rawPosition = Number.isFinite(source.position)
      ? Number(source.position)
      : null
    const entry = {
      candidate,
      rawPosition,
      fallbackOrder: index
    }

    if (!stageGroups.has(stage)) {
      stageGroups.set(stage, [])
    }
    stageGroups.get(stage)?.push(entry)
  })

  const assembleStage = (stageId: string) => {
    const entries = stageGroups.get(stageId)
    if (!entries || !entries.length) return [] as Candidate[]

    const sorted = [...entries].sort((a, b) => {
      if (a.rawPosition != null && b.rawPosition != null) {
        return a.rawPosition - b.rawPosition
      }
      if (a.rawPosition != null) return -1
      if (b.rawPosition != null) return 1
      return a.fallbackOrder - b.fallbackOrder
    })

    return sorted.map((entry, position) => ({
      ...entry.candidate,
      position
    }))
  }

  const result: Candidate[] = []

  pipelineStageIds.forEach((stageId) => {
    result.push(...assembleStage(stageId))
    stageGroups.delete(stageId)
  })

  stageGroups.forEach((_, stageId) => {
    result.push(...assembleStage(stageId))
  })

  return result
}

export const reindexCandidates = (list: Candidate[] = []): Candidate[] => {
  const stageGroups = new Map<
    string,
    Array<{ candidate: Candidate; fallbackOrder: number }>
  >()
  const pipelineStageIds = pipelineStages.map((stage) => stage.id)

  list.forEach((candidate, index) => {
    const stage = candidate.stage ?? 'new'
    if (!stageGroups.has(stage)) {
      stageGroups.set(stage, [])
    }
    stageGroups.get(stage)?.push({ candidate, fallbackOrder: index })
  })

  const assembleStage = (stageId: string) => {
    const entries = stageGroups.get(stageId)
    if (!entries || !entries.length) return [] as Candidate[]

    const sorted = [...entries].sort((a, b) => {
      const aPos = Number.isFinite(a.candidate.position)
        ? Number(a.candidate.position)
        : null
      const bPos = Number.isFinite(b.candidate.position)
        ? Number(b.candidate.position)
        : null

      if (aPos != null && bPos != null) return aPos - bPos
      if (aPos != null) return -1
      if (bPos != null) return 1
      return a.fallbackOrder - b.fallbackOrder
    })

    return sorted.map((entry, position) => ({
      ...entry.candidate,
      stage: stageId as Candidate['stage'],
      position
    }))
  }

  const result: Candidate[] = []

  pipelineStageIds.forEach((stageId) => {
    result.push(...assembleStage(stageId))
    stageGroups.delete(stageId)
  })

  stageGroups.forEach((_, stageId) => {
    result.push(...assembleStage(stageId))
  })

  return result
}

export const insertCandidateIntoStage = (
  list: Candidate[] = [],
  candidate: Candidate,
  stage: Candidate['stage'],
  index = Number.POSITIVE_INFINITY
): Candidate[] => {
  const stageCounters: Record<string, number> = {}
  const output: Candidate[] = []
  let inserted = false

  list.forEach((item) => {
    const itemStage = item.stage ?? 'new'
    const count = stageCounters[itemStage] ?? 0

    if (itemStage === stage && !inserted && count >= index) {
      output.push({ ...candidate, stage })
      inserted = true
    }

    output.push(item)
    stageCounters[itemStage] = count + 1
  })

  if (!inserted) {
    output.push({ ...candidate, stage })
  }

  return output
}

export const normaliseVisits = (items: Array<VisitInput> = []): Visit[] =>
  items.map((visit) => {
    const source = visit as RawVisit
    const visitDate = normaliseDate(source.visit_date ?? source.date)
    const reminderEnabled =
      typeof source.reminder?.enabled === 'string'
        ? source.reminder.enabled === 'true'
        : source.reminder?.enabled
    const rawEnabled =
      reminderEnabled ??
      (typeof source.reminder_enabled === 'string'
        ? source.reminder_enabled === 'true'
        : source.reminder_enabled)
    const rawMinutes =
      source.reminder?.minutesBefore ??
      source.reminder_minutes ??
      source.reminderMinutes
    const rawChannel = source.reminder?.channel ?? source.reminder_channel

    const reminder = resolveReminderWithDefaults(visitDate, {
      ...source.reminder,
      minutesBefore:
        typeof rawMinutes === 'string' ? Number(rawMinutes) : rawMinutes,
      channel: (typeof rawChannel === 'string' ? rawChannel : undefined) as
        | VisitReminder['channel']
        | undefined,
      enabled: rawEnabled != null ? Boolean(rawEnabled) : undefined
    })
    const alignedReminder = shiftReminderForVisitDate(visitDate, reminder)
    return {
      id: source.id ?? generateId('visit'),
      distributorId: source.distributor_id ?? source.distributorId ?? null,
      candidateId: source.candidate_id ?? source.candidateId ?? null,
      date: visitDate,
      type: (source.visit_type ??
        source.type ??
        'presentacion') as Visit['type'],
      objective: toStringValue(source.objetivo ?? source.objective),
      summary: toStringValue(source.resumen ?? source.summary),
      nextSteps: toStringValue(source.proximos_pasos ?? source.nextSteps),
      result: (source.resultado ??
        source.result ??
        'pendiente') as Visit['result'],
      durationMinutes: source.duracion_min ?? source.durationMinutes ?? 30,
      createdAt: normaliseDate(new Date()),
      reminder: alignedReminder
    }
  })

export const normaliseSales = (items: Array<SaleInput> = []): Sale[] =>
  items.map((sale) => {
    const source = sale as RawSale
    return {
      id: source.id ?? generateId('sale'),
      distributorId: source.distributor_id ?? source.distributorId ?? '',
      date: normaliseDate(source.sale_date ?? source.date),
      brand: source.brand ?? 'silbo',
      family: source.family ?? 'convergente',
      operations: source.operaciones ?? source.operations ?? 1,
      notes: toStringValue(source.notes),
      createdAt: normaliseDate(new Date())
    }
  })
