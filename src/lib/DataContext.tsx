import React, { useCallback, useEffect, useMemo, useState, ReactNode } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { DataContext } from './context';
import type { AppContextType, PipelineStageId, Candidate, EntityId, Distributor, Preferences, Sale, NewCandidate, NewDistributor, NewSale, NewUser, NewVisit, PreferencesUpdates, SaleUpdates, UserUpdates, VisitUpdates, DistributorUpdates, CandidateUpdates, User, Visit, PriorityDrivers } from './types';
import {
  brandOptions,
  channelOptions,
  pipelineStages,
  statusOptions,
  provinceOptions,
  STORAGE_KEY,
  STORAGE_VERSION
} from './data/config'
// import { getSyncQueue, removeFirstSyncAction } from './syncQueue'; // Eliminado porque no se usan aquí
import { DEFAULT_USERS } from './data/defaults'
import { loadStoredState, persistState } from './data/storage'
import {
  createLookup,
  generateId,
  normaliseDate,
  sanitisePhone,
  daysDifference,
  formatRelativeTime
} from './data/helpers'
import {
  resolveCategory,
  deriveBrandsForChannel,
  taxonomyRules
} from './data/taxonomy'
import {
  evaluateDistributorChecklist,
  computeDistributorCompletion,
  normaliseUser,
  normalisePreferences,
  normaliseDistributors,
  normaliseCandidates,
  normaliseVisits,
  normaliseSales,
  insertCandidateIntoStage
} from './data/normalisers'
import type { RawUser } from './data/normalisers'
import { buildStats } from './data/stats'
import { buildCallCenter } from './data/callCenter'
import { calculateDistributorPriority } from './data/priority'
import {
  resolveReminderWithDefaults,
  shiftReminderForVisitDate
} from './data/reminders'
// ...resto del código y lógica de DataProvider...

// Eliminado duplicado de DataProvider. La implementación principal está más abajo.

// Eliminado duplicado de DataProviderProps.

interface StoredState {
  users?: User[]
  currentUserId?: EntityId | null
  preferences?: Preferences
  distributors?: Distributor[]
  candidates?: Candidate[]
  visits?: Visit[]
  sales?: Sale[]
}

// Crear lookups
const brandLookup = createLookup(brandOptions)
const channelLookup = createLookup(channelOptions)
const statusLookup = createLookup(statusOptions)
const stageLookup = createLookup(pipelineStages)

const createDefaultPriorityDrivers = (): PriorityDrivers => ({
  traffic: 0,
  sales: 0,
  dataQuality: 0,
  salesLast90Days: 0,
  lastSaleDays: null,
  lastVisitDays: null,
  updatedAt: normaliseDate(new Date())
})

const areDriversEqual = (a?: PriorityDrivers, b?: PriorityDrivers): boolean => {
  if (!a && !b) return true
  if (!a || !b) return false
  return (
    a.traffic === b.traffic &&
    a.sales === b.sales &&
    a.dataQuality === b.dataQuality &&
    a.salesLast90Days === b.salesLast90Days &&
    a.lastSaleDays === b.lastSaleDays &&
    a.lastVisitDays === b.lastVisitDays &&
    a.updatedAt === b.updatedAt
  )
}

interface DataProviderProps {
  children: React.ReactNode
}

export function DataProvider({ children }: DataProviderProps) {
  // Reordenar candidato en el pipeline (drag & drop Kanban) con validaciones robustas
  const reorderCandidate = useCallback(
    (id: EntityId, newStage: PipelineStageId, newPosition: number) => {
      setCandidates((current: Candidate[]) => {
        const target = current.find((item) => item.id === id)
        if (!target) return current

        // Filtrar el candidato de la lista
        const remaining = current.filter((item) => item.id !== id)
        // Candidatos en el stage destino
        const stageCandidates = remaining.filter((item) => item.stage === newStage)

        // Validar newPosition
        let safePosition = Number.isFinite(newPosition) ? newPosition : 0;
        if (safePosition < 0) safePosition = 0;
        if (safePosition > stageCandidates.length) safePosition = stageCandidates.length;

        // Actualizar stage y posición
        const updatedCandidate = { ...target, stage: newStage, position: safePosition }
        const before = stageCandidates.slice(0, safePosition)
        const after = stageCandidates.slice(safePosition)
        // Insertar el candidato en la posición deseada
        const reordered = [...before, updatedCandidate, ...after]
        // El resto de candidatos (otros stages)
        const other = remaining.filter((item) => item.stage !== newStage)
        // Reasignar posiciones para mantener consistencia absoluta
        const finalStage = reordered.map((c, i) => ({ ...c, position: i }))
        // Unir y ordenar por stage y posición para evitar estados corruptos
        return [...other, ...finalStage].sort((a, b) => {
          if (a.stage === b.stage) return (a.position ?? 0) - (b.position ?? 0);
          return a.stage.localeCompare(b.stage);
        });
      })
    },
    []
  )
  const navigate = useNavigate()
  const storedState = useMemo<StoredState | null>(
    () =>
      loadStoredState<StoredState>({
        storageKey: STORAGE_KEY,
        storageVersion: STORAGE_VERSION
      }),
    []
  )

  // Normalizar usuarios iniciales
  const initialUsers = useMemo<User[]>(() => {
    const source =
      storedState?.users && storedState.users.length > 0
        ? storedState.users
        : DEFAULT_USERS
    return source
      .map((user) => normaliseUser(user))
      .filter((user): user is User => Boolean(user))
  }, [storedState])

  // Estados principales
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [currentUserId, setCurrentUserId] = useState<EntityId | null>(() => {
    const storedId = storedState?.currentUserId ?? null
    if (storedId && initialUsers.some((user) => user.id === storedId)) {
      return storedId
    }
    return initialUsers[0]?.id ?? null
  })

  const [preferences, setPreferences] = useState<Preferences>(() =>
    normalisePreferences(storedState?.preferences)
  )

  const [distributors, setDistributors] = useState<Distributor[]>(() =>
    normaliseDistributors(storedState?.distributors ?? [])
  )
  const [candidates, setCandidates] = useState<Candidate[]>(() =>
    normaliseCandidates(storedState?.candidates ?? [])
  )
  const [visits, setVisits] = useState<Visit[]>(() =>
    normaliseVisits(storedState?.visits ?? [])
  )
  const [sales, setSales] = useState<Sale[]>(() =>
    normaliseSales(storedState?.sales ?? [])
  )

  useEffect(() => {
    setDistributors((current) => {
      if (!current.length) return current
      let changed = false
      const recalculated = current.map((item) => {
        const priority = calculateDistributorPriority(item, { sales, visits })
        if (
          item.priorityScore === priority.score &&
          item.priorityLevel === priority.level &&
          areDriversEqual(item.priorityDrivers, priority.drivers)
        ) {
          return item
        }
        changed = true
        return {
          ...item,
          priorityScore: priority.score,
          priorityLevel: priority.level,
          priorityDrivers: priority.drivers
        }
      })

      return changed ? recalculated : current
    })
  }, [sales, visits])

  // Persistir cambios
  useEffect(() => {
    persistState({
      storageKey: STORAGE_KEY,
      storageVersion: STORAGE_VERSION,
      payload: {
        distributors,
        candidates,
        visits,
        sales,
        users,
        currentUserId,
        preferences
      }
    })
  }, [
    distributors,
    candidates,
    visits,
    sales,
    users,
    currentUserId,
    preferences
  ])

  // Listener de sesión Supabase
  useEffect(() => {
    if (!supabase || !supabase.auth) return
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Buscar usuario local por email
          const email = session.user.email
          if (email) {
            setUsers((current) => {
              let user = current.find((u) => u.email === email)
              if (!user) {
                // Crear usuario local si no existe
                user = {
                  id: session.user.id,
                  fullName:
                    session.user.user_metadata?.full_name ||
                    email.split('@')[0],
                  email,
                  role: 'Usuario',
                  region: '',
                  permissions: '',
                  phone: '',
                  avatarInitials: email.slice(0, 2).toUpperCase(),
                  lastLogin: new Date().toISOString(),
                  activity: [
                    {
                      id: 'activity-login',
                      type: 'information',
                      title: 'Inicio de sesión',
                      description: 'Acceso con Supabase',
                      timestamp: new Date().toISOString()
                    }
                  ],
                  createdAt: new Date().toISOString()
                }
                // Persistir el usuario en localStorage junto con el resto del estado
                try {
                  const raw = window.localStorage.getItem(STORAGE_KEY)
                  const parsed = raw
                    ? JSON.parse(raw)
                    : { version: STORAGE_VERSION, payload: {} }
                  const payload = parsed.payload || {}
                  const usersArr = Array.isArray(payload.users)
                    ? payload.users.filter(Boolean)
                    : []
                  if (user) usersArr.unshift(user)
                  payload.users = usersArr
                  payload.currentUserId = user.id
                  window.localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({ version: STORAGE_VERSION, payload })
                  )
                } catch (e) {
                  // eslint-disable-next-line no-console
                  console.warn(
                    'No se pudo persistir el usuario en localStorage',
                    e
                  )
                }
                return [user, ...current]
              }
              return current
            })
            // Establecer como usuario activo
            setTimeout(() => {
              setCurrentUserId((prev) => {
                const found = users.find((u) => u.email === email)
                return found ? found.id : prev
              })
            }, 0)
          }
          navigate('/')
        }
        if (event === 'SIGNED_OUT') {
          setCurrentUserId(null)
          navigate('/login')
        }
      }
    )
    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [navigate, users])

  // Función de logout global
  const logout = useCallback(async () => {
    if (supabase && supabase.auth) {
      await supabase.auth.signOut()
    }
    setCurrentUserId(null)
    navigate('/login')
  }, [navigate])
  const addUser = useCallback((payload: NewUser) => {
    const baseActivity = (payload?.activity as
      | Array<Record<string, unknown>>
      | undefined) ?? [
      {
        title: 'Perfil creado',
        detail: 'Alta manual desde el panel de perfil',
        timestamp: new Date().toISOString()
      }
    ]

    const newUser = normaliseUser({
      ...payload,
      id: payload?.id != null ? String(payload.id) : undefined,
      activity: baseActivity
    } as RawUser)

    if (!newUser) {
      throw new Error('Error al crear usuario')
    }

    setUsers((current) => [newUser, ...current])
    setCurrentUserId(newUser.id)
    return newUser
  }, [])

  const updateUserProfile = useCallback(
    (id: EntityId, updates: UserUpdates) => {
      setUsers((current) =>
        current.map((user) => {
          if (user.id !== id) return user
          const updatedUser = normaliseUser({
            ...user,
            ...updates,
            id,
            activity: updates?.activity ?? user.activity
          })
          return updatedUser || user
        })
      )
    },
    []
  )

  const removeUser = useCallback((id: EntityId) => {
    setUsers((current) => {
      if (current.length <= 1) {
        return current
      }
      const filtered = current.filter((user) => user.id !== id)
      if (filtered.length === current.length) {
        return current
      }
      setCurrentUserId((prev) => {
        if (prev === id) {
          return filtered[0]?.id ?? null
        }
        return prev
      })
      return filtered
    })
  }, [])

  const setCurrentUser = useCallback(
    (id: EntityId) => {
      setCurrentUserId((prev) => {
        if (!id) return prev
        return users.some((user) => user.id === id) ? id : prev
      })
    },
    [users]
  )

  const updatePreferences = useCallback((updates: PreferencesUpdates) => {
    setPreferences((current) =>
      normalisePreferences({
        ...current,
        ...updates
      })
    )
  }, [])

  // Acciones de distribuidor
  const addDistributor = useCallback(
    (payload: NewDistributor) => {
      const fallbackCode = generateId(
        payload.channelType === 'd2d' ? 'D2D' : 'PVP'
      ).toUpperCase()
      const code = payload.code?.trim()?.toUpperCase() || fallbackCode
      const category = resolveCategory(code)
      const channelType = payload.channelType || 'non_exclusive'
      const brands = deriveBrandsForChannel(
        payload.brands ?? [],
        channelType,
        category
      )

      const taxId = payload.taxId?.trim()?.toUpperCase() || ''
      const fiscalName = payload.fiscalName?.trim() || ''
      const fiscalAddress = payload.fiscalAddress?.trim() || ''
      const contactPerson = payload.contactPerson?.trim() || ''
      const contactPersonBackup = payload.contactPersonBackup?.trim() || ''
      const phone = payload.phone?.trim() || ''
      const email = payload.email?.trim() || ''
      const province = payload.province || ''
      const city = payload.city?.trim() || ''
      const postalCode = payload.postalCode?.trim() || ''

      const distributorBase = {
        name: payload.name?.trim() || 'Distribuidor sin nombre',
        contactPerson,
        contactPersonBackup,
        province,
        city,
        postalCode,
        email,
        phone,
        brands,
        status: payload.status || 'pending'
      }

      const checklist = evaluateDistributorChecklist({
        ...distributorBase,
        taxId,
        fiscalName,
        fiscalAddress
      })
      const isChecklistComplete = Object.values(checklist).every(Boolean)
      const completion =
        payload.completion ??
        computeDistributorCompletion(distributorBase, checklist)
      const pendingData = Boolean(
        payload.pendingData ?? (category.pendingData && !isChecklistComplete)
      )

      const baseDistributor: Distributor = {
        id: generateId('dist'),
        code,
        category,
        categoryId: category.id,
        pendingData,
        brandPolicy: category.brandPolicy,
        name: distributorBase.name,
        contactPerson,
        contactPersonBackup,
        channelType,
        brands,
        status: distributorBase.status,
        province,
        city,
        postalCode,
        phone,
        email,
        createdAt: normaliseDate(payload.createdAt),
        notes: payload.notes || '',
        taxId,
        fiscalName,
        fiscalAddress,
        upgradeRequested: Boolean(payload.upgradeRequested ?? false),
        checklist,
        checklistComplete: isChecklistComplete,
        completion,
        salesYtd: 0,
        priorityScore: 0,
        priorityLevel: 'medium',
        priorityDrivers: createDefaultPriorityDrivers()
      }
      const priority = calculateDistributorPriority(baseDistributor, {
        sales,
        visits
      })
      const newDistributor: Distributor = {
        ...baseDistributor,
        priorityScore: priority.score,
        priorityLevel: priority.level,
        priorityDrivers: priority.drivers
      }
      setDistributors((current) => [newDistributor, ...current])
      return newDistributor
    },
    [sales, visits]
  )

  const updateDistributor = useCallback(
    (id: EntityId, updates: DistributorUpdates) => {
      setDistributors((current) =>
        current.map((item) => {
          if (item.id !== id) return item

          const code = (updates.code ?? item.code)
            ?.toString()
            .trim()
            .toUpperCase()
          const category = resolveCategory(code)
          const channelType =
            updates.channelType ?? item.channelType ?? 'non_exclusive'
          const contactPerson =
            updates.contactPerson?.trim() ?? item.contactPerson ?? ''
          const contactPersonBackup =
            updates.contactPersonBackup?.trim() ??
            item.contactPersonBackup ??
            ''
          const province = updates.province ?? item.province ?? ''
          const city = updates.city?.trim() ?? item.city ?? ''
          const postalCode = updates.postalCode?.trim() ?? item.postalCode ?? ''
          const phone = sanitisePhone(updates.phone ?? item.phone ?? '')
          const email = updates.email?.trim()?.toLowerCase() ?? item.email ?? ''
          const taxId = updates.taxId?.trim()?.toUpperCase() ?? item.taxId ?? ''
          const fiscalName = updates.fiscalName?.trim() ?? item.fiscalName ?? ''
          const fiscalAddress =
            updates.fiscalAddress?.trim() ?? item.fiscalAddress ?? ''
          const brands = deriveBrandsForChannel(
            updates.brands ?? item.brands ?? [],
            channelType,
            category
          )

          const distributorBase = {
            name: updates.name?.trim() ?? item.name,
            contactPerson,
            contactPersonBackup,
            province,
            city,
            postalCode,
            email,
            phone,
            brands,
            status: updates.status ?? item.status
          }

          const checklist = evaluateDistributorChecklist({
            ...distributorBase,
            taxId,
            fiscalName,
            fiscalAddress
          })
          const isChecklistComplete = Object.values(checklist).every(Boolean)
          const completion =
            updates.completion ??
            computeDistributorCompletion(distributorBase, checklist)
          const pendingData = Boolean(
            updates.pendingData ??
              (category.pendingData && !isChecklistComplete)
          )

          const updatedDistributor: Distributor = {
            ...item,
            code,
            category,
            categoryId: category.id,
            pendingData,
            brandPolicy: category.brandPolicy,
            name: distributorBase.name,
            contactPerson,
            contactPersonBackup,
            channelType,
            brands,
            status: distributorBase.status,
            province,
            city,
            postalCode,
            phone,
            email,
            taxId,
            fiscalName,
            fiscalAddress,
            notes: updates.notes ?? item.notes,
            upgradeRequested: updates.upgradeRequested ?? item.upgradeRequested,
            checklist,
            checklistComplete: isChecklistComplete,
            completion,
            priorityScore: item.priorityScore ?? 0,
            priorityLevel: item.priorityLevel ?? 'medium',
            priorityDrivers:
              item.priorityDrivers ?? createDefaultPriorityDrivers()
          }

          const priority = calculateDistributorPriority(updatedDistributor, {
            sales,
            visits
          })

          return {
            ...updatedDistributor,
            priorityScore: priority.score,
            priorityLevel: priority.level,
            priorityDrivers: priority.drivers
          }
        })
      )
    },
    [sales, visits]
  )

  const deleteDistributor = useCallback((id: EntityId) => {
    setDistributors((current) => current.filter((item) => item.id !== id))
    setVisits((current) =>
      current.filter((visit) => visit.distributorId !== id)
    )
    setSales((current) => current.filter((sale) => sale.distributorId !== id))
  }, [])

  // Acciones de candidato
  const addCandidate = useCallback((payload: NewCandidate) => {
    const stage: Candidate['stage'] = payload.stage ?? 'new'
    const newCandidate: Candidate = {
      id: generateId('cand'),
      name: payload.name?.trim() || 'Candidato sin nombre',
      stage,
      channelCode: payload.channelCode,
      contact: payload.contact,
      city: payload.city?.trim(),
      island: payload.island?.trim(),
      province: payload.province,
      priority: payload.priority || 'medium',
      score: payload.score,
      notes: payload.notes?.trim() || '',
      createdAt: normaliseDate(payload.createdAt),
      lastContactAt: payload.lastContactAt,
      taxId: payload.taxId?.trim()?.toUpperCase() || '' // Asegura taxId
    }
    setCandidates((current) =>
      insertCandidateIntoStage(current, newCandidate, stage)
    )
    return newCandidate
  }, [])

  const updateCandidate = useCallback(
    (id: EntityId, updates: CandidateUpdates) => {
      setCandidates((current) =>
        current.map((item) => (item.id === id ? { ...item, ...updates } : item))
      )
    },
    []
  )

  const deleteCandidate = useCallback((id: EntityId) => {
    setCandidates((current) => current.filter((item) => item.id !== id))
    setVisits((current) => current.filter((visit) => visit.candidateId !== id))
  }, [])

  const removeCandidate = useCallback(
    (id: EntityId) => {
      deleteCandidate(id)
    },
    [deleteCandidate]
  )

  const moveCandidate = useCallback(
    (id: EntityId, newStage: Candidate['stage']) => {
      setCandidates((current) => {
        const target = current.find((item) => item.id === id)
        if (!target) {
          return current
        }

        const updatedCandidate = { ...target, stage: newStage }
        const remaining = current.filter((item) => item.id !== id)
        const newList = insertCandidateIntoStage(
          remaining,
          updatedCandidate,
          newStage
        )
        return newList
      })
    },
    []
  )

  // Acciones de visita
  const addVisit = useCallback((payload: NewVisit) => {
    const visitDate = payload.date ?? new Date().toISOString().slice(0, 10)
    const normalisedVisitDate = normaliseDate(visitDate)
    const reminder = shiftReminderForVisitDate(
      normalisedVisitDate,
      resolveReminderWithDefaults(normalisedVisitDate, payload.reminder)
    )

    const newVisit = {
      id: generateId('visit'),
      distributorId: payload.distributorId || null,
      candidateId: payload.candidateId || null,
      date: normalisedVisitDate,
      type: payload.type || 'presentacion',
      objective: payload.objective?.trim() || '',
      summary: payload.summary?.trim() || '',
      nextSteps: payload.nextSteps?.trim() || '',
      result: payload.result || 'pendiente',
      durationMinutes: payload.durationMinutes || 30,
      createdAt: normaliseDate(payload.createdAt),
      reminder
    }

    setVisits((current) => [newVisit, ...current])
    return newVisit
  }, [])

  const updateVisit = useCallback((id: EntityId, updates: VisitUpdates) => {
    setVisits((current) =>
      current.map((item) => {
        if (item.id !== id) return item

        const nextDate = updates.date ? normaliseDate(updates.date) : item.date
        const reminderWasUpdated =
          Boolean(updates.reminder) || Boolean(updates.date)
        const mergedReminder = updates.reminder
          ? resolveReminderWithDefaults(nextDate, {
              ...item.reminder,
              ...updates.reminder
            })
          : item.reminder

        const adjustedReminder = reminderWasUpdated
          ? shiftReminderForVisitDate(nextDate, mergedReminder)
          : mergedReminder

        return {
          ...item,
          ...updates,
          date: nextDate,
          reminder: adjustedReminder
        }
      })
    )
  }, [])

  const deleteVisit = useCallback((id: EntityId) => {
    setVisits((current) => current.filter((item) => item.id !== id))
  }, [])

  // Acciones de venta
  const addSale = useCallback((payload: NewSale) => {
    const newSale = {
      id: generateId('sale'),
      distributorId: payload.distributorId || '',
      date: payload.date || new Date().toISOString().slice(0, 10),
      brand: payload.brand || '',
      family: payload.family || '',
      operations: payload.operations || 0,
      notes: payload.notes?.trim() || '',
      createdAt: normaliseDate(payload.createdAt)
    }

    setSales((current) => [newSale, ...current])
    return newSale
  }, [])

  const updateSale = useCallback((id: EntityId, updates: SaleUpdates) => {
    setSales((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }, [])

  const deleteSale = useCallback((id: EntityId) => {
    setSales((current) => current.filter((item) => item.id !== id))
  }, [])

  // Lookups y cálculos
  const lookups = useMemo(
    () => ({
      brands: brandLookup,
      channels: channelLookup,
      statuses: statusLookup,
      stages: stageLookup
    }),
    []
  )

  const stats = useMemo(
    () => buildStats({ distributors, visits, sales }),
    [distributors, visits, sales]
  )
  const followUp = useMemo(
    () => buildCallCenter({ distributors, candidates, visits }),
    [distributors, candidates, visits]
  )

  // Formatters helper functions
  const formatters = useMemo(
    () => ({
      daysDifference,
      formatRelativeTime,
      relative: formatRelativeTime
    }),
    []
  )

  // Taxonomy rules
  const taxonomy = useMemo(
    () => ({
      rules: taxonomyRules,
      resolveCategory,
      deriveBrandsForChannel
    }),
    []
  )

  // Valor del contexto
  const contextValue = {
    users,
    currentUser: users.find((u) => u.id === currentUserId) || null,
    currentUserId,
    preferences,
    distributors,
    candidates,
    visits,
    sales,
    lookups,
    formatters,
    taxonomy,
    pipelineStages,
    brandOptions,
    channelOptions,
    statusOptions,
    provinceOptions,
    stats,
    callCenter: followUp,
  validators: {},
    addUser,
    updateUser: updateUserProfile,
  removeUser,
  setCurrentUser,
  updatePreferences,
  addDistributor,
  updateDistributor,
  deleteDistributor,
  addCandidate,
  updateCandidate,
  deleteCandidate,
  removeCandidate,
  moveCandidate,
  reorderCandidate,
  addVisit,
  updateVisit,
  deleteVisit,
  addSale,
  updateSale,
  deleteSale,
  logout // <--- Añadido logout global
  }

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  )
}
