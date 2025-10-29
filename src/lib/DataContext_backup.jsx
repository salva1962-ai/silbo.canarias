import { useCallback, useEffect, useMemo, useState } from 'react'
import { MOCK } from '../Data/mock'
import { DataContext } from './context.js'
import {
  brandOptions,
  channelOptions,
  pipelineStages,
  statusOptions,
  provinceOptions,
  STORAGE_KEY,
  STORAGE_VERSION
} from './data/config.js'
import { DEFAULT_USERS } from './data/defaults.js'
import { loadStoredState, persistState } from './data/storage.js'
import {
  createLookup,
  generateId,
  normaliseDate,
  formatRelativeTime,
  daysDifference,
  sanitisePhone
} from './data/helpers.js'
import {
  emailPattern,
  spanishMobilePattern,
  postalCodePattern,
  taxIdPattern
} from './data/patterns.js'
import {
  resolveCategory,
  deriveBrandsForChannel,
  taxonomyRules
} from './data/taxonomy.js'
import {
  evaluateDistributorChecklist,
  computeDistributorCompletion,
  normaliseUser,
  normalisePreferences,
  normaliseDistributors,
  normaliseCandidates,
  normaliseVisits,
  normaliseSales,
  reindexCandidates,
  insertCandidateIntoStage
} from './data/normalisers.js'
import { buildStats } from './data/stats.js'
import { buildCallCenter } from './data/callCenter.js'

const brandLookup = createLookup(brandOptions)
const channelLookup = createLookup(channelOptions)
const statusLookup = createLookup(statusOptions)
const stageLookup = createLookup(pipelineStages)

export function DataProvider({ children }) {
  const storedState = useMemo(
    () =>
      loadStoredState({
        storageKey: STORAGE_KEY,
        storageVersion: STORAGE_VERSION
      }),
    []
  )

  const initialUsers = useMemo(() => {
    const source = storedState?.users?.length
      ? storedState.users
      : DEFAULT_USERS
    return source.map((user) => normaliseUser(user)).filter(Boolean)
  }, [storedState])

  const [users, setUsers] = useState(initialUsers)
  const [currentUserId, setCurrentUserId] = useState(() => {
    const storedId = storedState?.currentUserId
    if (storedId && initialUsers.some((user) => user.id === storedId)) {
      return storedId
    }
    return initialUsers[0]?.id ?? null
  })
  const [preferences, setPreferences] = useState(() =>
    normalisePreferences(storedState?.preferences)
  )

  const [distributors, setDistributors] = useState(() =>
    normaliseDistributors(storedState?.distributors ?? MOCK.distributors)
  )
  const [candidates, setCandidates] = useState(() =>
    normaliseCandidates(storedState?.candidates ?? MOCK.candidates)
  )
  const [visits, setVisits] = useState(() =>
    normaliseVisits(storedState?.visits ?? MOCK.visits)
  )
  const [sales, setSales] = useState(() =>
    normaliseSales(storedState?.sales ?? MOCK.sales)
  )

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

  const addUser = useCallback((payload) => {
    const baseActivity = payload?.activity ?? [
      {
        title: 'Perfil creado',
        detail: 'Alta manual desde el panel de perfil',
        timestamp: new Date().toISOString()
      }
    ]

    const newUser = normaliseUser({
      ...payload,
      activity: baseActivity
    })

    setUsers((current) => [newUser, ...current])
    setCurrentUserId(newUser.id)
    return newUser
  }, [])

  const updateUserProfile = useCallback((id, updates) => {
    setUsers((current) =>
      current.map((user) => {
        if (user.id !== id) return user
        return normaliseUser({
          ...user,
          ...updates,
          id,
          activity: updates?.activity ?? user.activity
        })
      })
    )
  }, [])

  const removeUser = useCallback((id) => {
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
    (id) => {
      setCurrentUserId((prev) => {
        if (!id) return prev
        return users.some((user) => user.id === id) ? id : prev
      })
    },
    [users]
  )

  const updatePreferences = useCallback((updates) => {
    setPreferences((current) =>
      normalisePreferences({
        ...current,
        ...updates
      })
    )
  }, [])

  const addDistributor = useCallback((payload) => {
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

    const newDistributor = {
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
      salesYtd: 0
    }
    setDistributors((current) => [newDistributor, ...current])
    return newDistributor
  }, [])

  const updateDistributor = useCallback((id, updates) => {
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
          updates.contactPersonBackup?.trim() ?? item.contactPersonBackup ?? ''
        const province = updates.province ?? item.province ?? ''
        const city = updates.city?.trim() ?? item.city ?? ''
        const postalCode = updates.postalCode?.trim() ?? item.postalCode ?? ''
        const phone = updates.phone?.trim() ?? item.phone ?? ''
        const email = updates.email?.trim() ?? item.email ?? ''
        const brands = deriveBrandsForChannel(
          updates.brands ?? item.brands ?? [],
          channelType,
          category
        )
        const status = updates.status ?? item.status ?? 'pending'
        const taxId = updates.taxId?.trim()?.toUpperCase() ?? item.taxId ?? ''
        const fiscalName = updates.fiscalName?.trim() ?? item.fiscalName ?? ''
        const fiscalAddress =
          updates.fiscalAddress?.trim() ?? item.fiscalAddress ?? ''

        const distributorBase = {
          name:
            (updates.name ?? item.name ?? '').trim() ||
            'Distribuidor sin nombre',
          contactPerson,
          contactPersonBackup,
          province,
          city,
          postalCode,
          email,
          phone,
          brands,
          status
        }

        const checklist = evaluateDistributorChecklist({
          ...distributorBase,
          taxId,
          fiscalName,
          fiscalAddress
        })
        const isChecklistComplete = Object.values(checklist).every(Boolean)
        const completion = computeDistributorCompletion(
          distributorBase,
          checklist
        )
        const pendingData = Boolean(
          updates.pendingData ?? (category.pendingData && !isChecklistComplete)
        )

        return {
          ...item,
          ...updates,
          id: item.id,
          code,
          category,
          categoryId: category.id,
          pendingData,
          brandPolicy: category.brandPolicy,
          channelType,
          name: distributorBase.name,
          contactPerson,
          contactPersonBackup,
          province,
          city,
          postalCode,
          phone,
          email,
          brands,
          status,
          taxId,
          fiscalName,
          fiscalAddress,
          upgradeRequested: Boolean(
            updates.upgradeRequested ?? item.upgradeRequested ?? false
          ),
          checklist,
          checklistComplete: isChecklistComplete,
          completion,
          updatedAt: normaliseDate(new Date())
        }
      })
    )
  }, [])

  const addCandidate = useCallback((payload) => {
    const now = normaliseDate(new Date())
    const channelCode = payload.channelCode?.trim()?.toUpperCase() || ''
    const category = resolveCategory(channelCode)

    const newCandidate = {
      id: generateId('cand'),
      name: payload.name?.trim() || 'Candidato sin nombre',
      city: payload.city?.trim() || '',
      island: payload.island || '',
      channelCode,
      category,
      categoryId: category.id,
      pendingData: category.pendingData || Boolean(payload.pendingData),
      brandPolicy: category.brandPolicy,
      contact: {
        name: payload.contact?.name?.trim() || '',
        phone: payload.contact?.phone?.trim() || '',
        email: payload.contact?.email?.trim() || ''
      },
      stage: payload.stage || 'new',
      position: 0,
      source: payload.source || 'Referido',
      notes: payload.notes || '',
      createdAt: now,
      updatedAt: now
    }
    setCandidates((current) => reindexCandidates([newCandidate, ...current]))
    return newCandidate
  }, [])

  const updateCandidate = useCallback((id, updates) => {
    setCandidates((current) => {
      const index = current.findIndex((candidate) => candidate.id === id)
      if (index === -1) return current

      const existing = current[index]
      const channelCode =
        (updates.channelCode ?? existing.channelCode)?.trim()?.toUpperCase() ||
        ''
      const category = resolveCategory(channelCode)
      const nextStage = updates.stage ?? existing.stage

      const updatedCandidate = {
        ...existing,
        ...updates,
        channelCode,
        category,
        categoryId: category.id,
        pendingData:
          category.pendingData ||
          Boolean(updates.pendingData ?? existing.pendingData),
        brandPolicy: category.brandPolicy,
        stage: nextStage,
        contact: updates.contact
          ? { ...existing.contact, ...updates.contact }
          : existing.contact,
        updatedAt: normaliseDate(new Date())
      }

      if (nextStage !== existing.stage) {
        const remaining = current.filter((candidate) => candidate.id !== id)
        const reordered = insertCandidateIntoStage(
          remaining,
          updatedCandidate,
          nextStage,
          0
        )
        return reindexCandidates(reordered)
      }

      const replaced = current.map((candidate) =>
        candidate.id === id ? updatedCandidate : candidate
      )
      return reindexCandidates(replaced)
    })
  }, [])

  const reorderCandidate = useCallback(
    (id, stage, index = Number.POSITIVE_INFINITY) => {
      setCandidates((current) => {
        const moving = current.find((candidate) => candidate.id === id)
        if (!moving) return current

        const targetStage = stage ?? moving.stage
        const updatedCandidate = {
          ...moving,
          stage: targetStage,
          updatedAt: normaliseDate(new Date())
        }

        const remaining = current.filter((candidate) => candidate.id !== id)
        const reordered = insertCandidateIntoStage(
          remaining,
          updatedCandidate,
          targetStage,
          index
        )
        return reindexCandidates(reordered)
      })
    },
    []
  )

  const moveCandidate = useCallback(
    (id, stage) => {
      reorderCandidate(id, stage, 0)
    },
    [reorderCandidate]
  )

  const removeCandidate = useCallback((id) => {
    setCandidates((current) =>
      reindexCandidates(current.filter((candidate) => candidate.id !== id))
    )
  }, [])

  const addVisit = useCallback((payload) => {
    const newVisit = {
      id: generateId('visit'),
      distributorId: payload.distributorId ?? null,
      candidateId: payload.candidateId ?? null,
      date: normaliseDate(payload.date),
      type: payload.type || 'presentacion',
      objective: payload.objective || '',
      summary: payload.summary || '',
      nextSteps: payload.nextSteps || '',
      result: payload.result || 'pendiente',
      durationMinutes: payload.durationMinutes ?? 30
    }
    setVisits((current) => [newVisit, ...current])
    return newVisit
  }, [])

  const updateVisit = useCallback((id, updates) => {
    if (!id) return null

    let updatedVisit = null
    setVisits((current) =>
      current.map((visit) => {
        if (visit.id !== id) return visit

        const nextVisit = {
          ...visit,
          ...updates,
          distributorId: updates?.distributorId ?? visit.distributorId ?? null,
          candidateId: updates?.candidateId ?? visit.candidateId ?? null,
          date: updates?.date ? normaliseDate(updates.date) : visit.date,
          result: updates?.result ?? visit.result,
          durationMinutes:
            updates?.durationMinutes != null
              ? Number(updates.durationMinutes) || visit.durationMinutes
              : visit.durationMinutes,
          nextSteps: updates?.nextSteps ?? visit.nextSteps,
          summary: updates?.summary ?? visit.summary,
          objective: updates?.objective ?? visit.objective,
          type: updates?.type ?? visit.type
        }

        updatedVisit = nextVisit
        return nextVisit
      })
    )

    return updatedVisit
  }, [])

  const addSale = useCallback((payload) => {
    const newSale = {
      id: generateId('sale'),
      distributorId: payload.distributorId,
      date: normaliseDate(payload.date),
      brand: payload.brand || 'silbo',
      family: payload.family || 'convergente',
      operations: Number(payload.operations) || 1,
      notes: payload.notes || ''
    }
    setSales((current) => [newSale, ...current])
    if (newSale.distributorId) {
      setDistributors((current) =>
        current.map((distributor) =>
          distributor.id === newSale.distributorId
            ? {
                ...distributor,
                salesYtd: (distributor.salesYtd ?? 0) + newSale.operations
              }
            : distributor
        )
      )
    }
    return newSale
  }, [])

  const distributorsLookup = useMemo(
    () => createLookup(distributors),
    [distributors]
  )
  const candidatesLookup = useMemo(() => createLookup(candidates), [candidates])

  const stats = useMemo(
    () =>
      buildStats({
        candidates,
        distributors,
        sales,
        visits,
        lookups: { distributors: distributorsLookup, brand: brandLookup },
        formatters: { daysDifference, formatRelativeTime }
      }),
    [candidates, distributors, sales, visits, distributorsLookup]
  )

  const callCenter = useMemo(
    () =>
      buildCallCenter({
        candidates,
        distributors,
        visits,
        statusLookup,
        distributorsLookup,
        candidatesLookup
      }),
    [candidates, distributors, visits, distributorsLookup, candidatesLookup]
  )

  const contextValue = useMemo(
    () => ({
      users,
      currentUserId,
      currentUser:
        users.find((user) => user.id === currentUserId) ?? users[0] ?? null,
      setCurrentUser,
      addUser,
      updateUser: updateUserProfile,
      removeUser,
      preferences,
      updatePreferences,
      distributors,
      addDistributor,
      updateDistributor,
      candidates,
      addCandidate,
      updateCandidate,
      reorderCandidate,
      moveCandidate,
      removeCandidate,
      visits,
      addVisit,
      updateVisit,
      sales,
      addSale,
      channelOptions,
      statusOptions,
      brandOptions,
      provinceOptions,
      pipelineStages,
      lookups: {
        brands: brandLookup,
        channels: channelLookup,
        statuses: statusLookup,
        stages: stageLookup,
        candidates: candidatesLookup,
        distributors: distributorsLookup
      },
      taxonomy: {
        rules: taxonomyRules,
        resolve: resolveCategory
      },
      stats,
      callCenter,
      formatters: {
        relative: formatRelativeTime,
        daysDifference
      },
      validators: {
        email: (value) => emailPattern.test((value ?? '').toString().trim()),
        phone: (value) =>
          spanishMobilePattern.test(sanitisePhone((value ?? '').toString())),
        postalCode: (value) =>
          postalCodePattern.test((value ?? '').toString().trim()),
        taxId: (value) =>
          taxIdPattern.test((value ?? '').toString().trim().toUpperCase())
      }
    }),
    [
      users,
      currentUserId,
      setCurrentUser,
      addUser,
      updateUserProfile,
      removeUser,
      addCandidate,
      addDistributor,
      addSale,
      addVisit,
      updateVisit,
      candidates,
      preferences,
      distributors,
      reorderCandidate,
      moveCandidate,
      removeCandidate,
      updatePreferences,
      stats,
      callCenter,
      updateCandidate,
      updateDistributor,
      visits,
      sales,
      candidatesLookup,
      distributorsLookup
    ]
  )

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  )
}
