// Funciones para mapear datos entre el modelo de la app y Supabase
import type { Distributor, Candidate, Visit } from '../types'

export function prepareDistributorForSupabase(distributor: Distributor) {
  const { priorityScore, priorityLevel, priorityDrivers, ...dbData } = distributor
  return {
    ...dbData,
    brands: JSON.stringify(dbData.brands || []),
    checklist: JSON.stringify(dbData.checklist || {}),
    category: JSON.stringify(dbData.category || {}),
  }
}

export function processDistributorFromSupabase(dbData: any): Distributor {
  // ...implementación igual que en DataContext...
  // Debes importar calculateDistributorPriority y createDefaultPriorityDrivers
  return {
    ...dbData,
    brands: typeof dbData.brands === 'string' ? JSON.parse(dbData.brands) : (dbData.brands || []),
    checklist: typeof dbData.checklist === 'string' ? JSON.parse(dbData.checklist) : (dbData.checklist || {}),
    category: typeof dbData.category === 'string' ? JSON.parse(dbData.category) : (dbData.category || {}),
    priorityScore: 0,
    priorityLevel: 'medium',
    priorityDrivers: { traffic: 0, sales: 0, dataQuality: 0, salesLast90Days: 0, lastSaleDays: null, lastVisitDays: null, updatedAt: '' }
  }
}

export function prepareCandidateForSupabase(candidate: Candidate) {
  return {
    ...candidate,
    taxId: candidate.taxId || '',
    city: candidate.city || '',
    island: candidate.island || '',
    contact: candidate.contact || '',
    notes: candidate.notes || '',
  }
}

export function processCandidateFromSupabase(dbData: any): Candidate {
  return {
    ...dbData,
    taxId: dbData.taxId || '',
    city: dbData.city || '',
    island: dbData.island || '',
    contact: dbData.contact || '',
    notes: dbData.notes || '',
  }
}

export function prepareVisitForSupabase(visit: Visit) {
  return {
    ...visit,
    reminder: JSON.stringify(visit.reminder || {}),
  }
}

export function processVisitFromSupabase(dbData: any): Visit {
  return {
    ...dbData,
    reminder: typeof dbData.reminder === 'string' ? JSON.parse(dbData.reminder) : (dbData.reminder || {}),
  }
}
