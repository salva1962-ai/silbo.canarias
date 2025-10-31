import React from 'react';
import { DataContext } from './context';
import { useSyncQueue } from './hooks/useSyncQueue';
import { useDistributors } from './hooks/useDistributors';
import { useCandidates } from './hooks/useCandidates';
import { useVisits } from './hooks/useVisits';
import { useSales } from './hooks/useSales';
import type { AppContextType, User, Preferences, EntityId, Notification, LookupOption, PipelineStage, CallCenterSummary, StatsSummary } from './types';
import {
  brandOptions,
  channelOptions,
  statusOptions,
  provinceOptions,
  pipelineStages
} from './data/config';

// Valores por defecto mínimos para evitar errores de tipado
const emptyUser: User = {
  id: '', fullName: '', email: '', role: '', region: '', permissions: '', phone: '', avatarInitials: '', lastLogin: '', createdAt: '', activity: []
};
const emptyPreferences: Preferences = { privacyEmail: '', allowDataExports: false };
const emptyStats: StatsSummary = {
  activeDistributors: 0, pendingDistributors: 0, totalOperations: 0, visitsLast7Days: 0, candidatesInPipeline: 0, pipelineCounts: [], operationsByBrand: [], latestActivities: []
};
const emptyCallCenter: CallCenterSummary = {
  tasks: { firstContact: [], followUp: [], activation: [], postVisit: [] },
  stats: { total: 0, urgent: 0, contactable: 0, missingData: 0, nextTask: null },
  lookup: { byCandidate: {}, byDistributor: {}, byVisit: {} },
  helpers: { nextCandidateStage: () => null, previousCandidateStage: () => null }
};
const emptyLookups = { brands: {}, channels: {}, statuses: {}, stages: {} };

export function DataProvider({ children }: { children: React.ReactNode }) {
  const sync = useSyncQueue();
  const { visits, addVisit, updateVisit, deleteVisit } = useVisits();
  const { sales, addSale, updateSale, deleteSale } = useSales();
  const { distributors, addDistributor, updateDistributor, deleteDistributor } = useDistributors({ sales, visits });
  const { candidates, addCandidate, updateCandidate, deleteCandidate } = useCandidates();

  // TODO: Reemplaza los valores mock por hooks reales cuando los tengas
  const contextValue: AppContextType = {
    users: [emptyUser],
    currentUser: emptyUser,
    currentUserId: '',
    preferences: emptyPreferences,
    distributors,
    candidates,
    visits,
    sales,
    lookups: emptyLookups, // Si tienes lookups reales, reemplaza aquí
    formatters: {
      daysDifference: () => 0,
      formatRelativeTime: () => '',
      relative: () => ''
    },
    taxonomy: {
      rules: [],
      resolveCategory: () => ({
        id: '', label: '', description: '', badgeClass: '', tooltip: '', brandPolicy: { allowed: null, blocked: [], conditional: [], note: '' }, pendingData: false
      }),
      deriveBrandsForChannel: () => []
    },
    pipelineStages,
    brandOptions,
    channelOptions,
    statusOptions,
    provinceOptions,
    stats: emptyStats,
    callCenter: emptyCallCenter,
    validators: {},
    notifications: sync.notifications,
    setNotifications: sync.setNotifications,
    syncStatus: sync.syncStatus,
    forceSync: sync.forceSync,
    isOnline: sync.isOnline,
    isSyncing: sync.isSyncing,
    pendingSync: sync.syncQueue.length,
    addUser: () => emptyUser,
    updateUser: () => {},
    removeUser: () => {},
    setCurrentUser: () => {},
    updatePreferences: () => {},
    addDistributor,
    updateDistributor,
    deleteDistributor,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    removeCandidate: () => {},
    moveCandidate: async () => {},
    reorderCandidate: async () => {},
    addVisit,
    updateVisit,
    deleteVisit,
    addSale,
    updateSale,
    deleteSale
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}