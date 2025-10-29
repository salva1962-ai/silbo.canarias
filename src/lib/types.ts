// Identificadores y enums ligeros
export type EntityId = string | number
export type ChannelType = 'exclusive' | 'non_exclusive' | 'd2d'
export type DistributorStatus = 'active' | 'pending' | 'blocked'
export type PipelineStageId =
  | 'new'
  | 'contacted'
  | 'evaluation'
  | 'approved'
  | 'rejected'
export type CandidatePriority = 'high' | 'medium' | 'low'
export type VisitType =
  | 'presentacion'
  | 'seguimiento'
  | 'formacion'
  | 'incidencias'
  | 'apertura'
export type VisitResult =
  | 'pendiente'
  | 'completada'
  | 'reprogramar'
  | 'cancelada'
export type PriorityLevel = 'high' | 'medium' | 'low'
export type VisitReminderChannel = 'phone' | 'email' | 'whatsapp'

export interface VisitReminder {
  enabled: boolean
  minutesBefore: number
  channel: VisitReminderChannel
  scheduledAt: string | null
  lastTriggeredAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PriorityDrivers {
  traffic: number
  sales: number
  dataQuality: number
  salesLast90Days: number
  lastSaleDays: number | null
  lastVisitDays: number | null
  updatedAt: string
}


// Notificaciones globales
export interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp?: string;
  read?: boolean;
  color?: string;
}

export type ActivityType = 'sale' | 'visit' | 'call' | 'task' | 'information';
export type Priority = 'high' | 'medium' | 'low';
export interface Activity {
  id?: string | number;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  priority?: Priority;
  metadata?: Record<string, string | number>;
}

export type NoteCategory =
  | 'visita'
  | 'llamada'
  | 'email'
  | 'reunion'
  | 'general'

export interface NoteEntry {
  id: string
  content: string
  timestamp: string
  author?: string
  category?: NoteCategory
}

export interface Contact {
  name?: string
  phone?: string
  email?: string
}

export interface Preferences {
  privacyEmail: string
  allowDataExports: boolean
}

export interface BrandPolicy {
  allowed: string[] | null
  blocked: string[]
  conditional: string[]
  note: string
  messages?: Record<string, string>
}

export interface Category {
  id: string
  label: string
  description: string
  badgeClass: string
  tooltip: string
  brandPolicy: BrandPolicy
  pendingData: boolean
}

export interface PipelineStage {
  id: PipelineStageId
  label: string
  description: string
  tone: string
  accent: string
  badge: string
  empty: string
}

export interface Checklist {
  taxId: boolean
  fiscalName: boolean
  fiscalAddress: boolean
  email: boolean
  phone: boolean
  postalCode: boolean
}

export interface Distributor {
  id: EntityId
  code: string
  externalCode?: string // Código externo (ESPSB, LWMY, EXISTENTE_VF, PVPTE, etc.)
  category: Category
  categoryId: string
  pendingData: boolean
  brandPolicy: BrandPolicy
  name: string
  contactPerson: string
  contactPersonBackup: string
  channelType: ChannelType
  brands: string[]
  status: DistributorStatus
  province: string
  city: string
  postalCode: string
  phone: string
  email: string
  address?: string // Dirección física
  createdAt: string
  notes: string
  notesHistory?: NoteEntry[]
  taxId: string
  fiscalName: string
  fiscalAddress: string
  upgradeRequested: boolean
  teamId?: string // ID del equipo D2D (solo para canal d2d)
  checklist: Checklist
  checklistComplete: boolean
  completion: number
  salesYtd: number
  priorityScore: number
  priorityLevel: PriorityLevel
  priorityDrivers: PriorityDrivers
}

export interface User {
  id: EntityId
  fullName: string
  email: string
  role: string
  region: string
  permissions: string
  phone: string
  avatarInitials: string
  lastLogin: string
  createdAt: string
  activity: Activity[]
}

export interface Candidate {
  id: EntityId
  name: string
  taxId: string // CIF/NIF/NIE
  stage: PipelineStageId
  channelCode?: string
  contact?: Contact
  city?: string
  island?: string
  province?: string
  category?: Category
  categoryId?: string
  pendingData?: boolean
  brandPolicy?: BrandPolicy
  priority: CandidatePriority
  score?: number
  notes?: string
  notesHistory?: NoteEntry[]
  createdAt: string
  updatedAt?: string
  lastContactAt?: string
  position?: number
  source?: string
}

export interface Visit {
  id: EntityId
  distributorId: EntityId | null
  candidateId: EntityId | null
  date: string
  type: VisitType
  objective: string
  summary: string
  nextSteps: string
  result: VisitResult
  durationMinutes: number
  createdAt: string
  reminder: VisitReminder
  notes?: string
  notesHistory?: NoteEntry[]
}

export interface Sale {
  id: EntityId
  distributorId: EntityId
  date: string
  brand: string
  family: string
  operations: number
  notes: string
  createdAt: string
}

// Opciones y lookups
export interface LookupOption {
  id: string
  label: string
  value?: unknown
}

export interface Lookups {
  brands: Record<string, LookupOption>
  channels: Record<string, LookupOption>
  statuses: Record<string, LookupOption>
  stages: Record<string, LookupOption>
}

// Estadísticas y call center
export interface PipelineStageCount {
  stageId: PipelineStageId
  count: number
}

export interface BrandPerformance {
  brandId: string
  label: string
  value: number
}

export interface ActivitySummary {
  id: string
  type: 'visit' | 'sale'
  title: string
  description: string
  timestamp: string
  priority: 'low' | 'medium'
  metadata: Record<string, string>
}

export interface StatsSummary {
  activeDistributors: number
  pendingDistributors: number
  totalOperations: number
  visitsLast7Days: number
  candidatesInPipeline: number
  pipelineCounts: PipelineStageCount[]
  operationsByBrand: BrandPerformance[]
  latestActivities: ActivitySummary[]
}

export type CallCenterTaskType =
  | 'first-contact'
  | 'follow-up'
  | 'activation'
  | 'post-visit'
export type CallCenterTaskPriority = 'low' | 'medium' | 'high'

export interface CallCenterTask {
  id: string
  refType: 'candidate' | 'distributor' | 'visit'
  refId: EntityId | null
  visitId?: EntityId | null
  distributorId: EntityId | null
  candidateId: EntityId | null
  name: string
  contact: string
  phone: string
  email: string
  stageId: PipelineStageId | null
  pendingData: boolean
  note: string
  context: string
  location: string
  taskType: CallCenterTaskType
  priority: CallCenterTaskPriority
  dueDate: string | null
  isOverdue: boolean
  channelCode?: string
  meta: string
}

export interface CallCenterSummary {
  tasks: {
    firstContact: CallCenterTask[]
    followUp: CallCenterTask[]
    activation: CallCenterTask[]
    postVisit: CallCenterTask[]
  }
  stats: {
    total: number
    urgent: number
    contactable: number
    missingData: number
    nextTask: CallCenterTask | null
  }
  lookup: {
    byCandidate: Record<EntityId, CallCenterTask[]>
    byDistributor: Record<EntityId, CallCenterTask[]>
    byVisit: Record<EntityId, CallCenterTask>
  }
  helpers: {
    nextCandidateStage: (
      stageId: PipelineStageId | null | undefined
    ) => PipelineStageId | null
    previousCandidateStage: (
      stageId: PipelineStageId | null | undefined
    ) => PipelineStageId | null
  }
}

// Contexto global expuesto por el proveedor
export interface AppContextType {
  users: User[];
  currentUser: User | null;
  currentUserId: EntityId | null;
  preferences: Preferences;
  distributors: Distributor[];
  candidates: Candidate[];
  visits: Visit[];
  sales: Sale[];
  lookups: Lookups;
  formatters: {
    daysDifference: (isoDate: string) => number;
    formatRelativeTime: (isoDate: string) => string;
    relative: (isoDate: string) => string;
  };
  taxonomy: {
    rules: unknown;
    resolveCategory: (code: string | null | undefined) => Category;
    deriveBrandsForChannel: (
      brands: string[],
      channelType: ChannelType,
      category: Category
    ) => string[];
  };
  pipelineStages: PipelineStage[];
  brandOptions: LookupOption[];
  channelOptions: LookupOption[];
  statusOptions: LookupOption[];
  provinceOptions: LookupOption[];
  stats: StatsSummary;
  callCenter: CallCenterSummary;
  validators: Record<string, unknown>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  addUser: (payload: NewUser) => User;
  updateUser: (id: EntityId, updates: UserUpdates) => void;
  removeUser: (id: EntityId) => void;
  setCurrentUser: (id: EntityId) => void;
  updatePreferences: (updates: PreferencesUpdates) => void;
  addDistributor: (payload: NewDistributor) => Distributor;
  updateDistributor: (id: EntityId, updates: DistributorUpdates) => void;
  deleteDistributor: (id: EntityId) => void;
  addCandidate: (payload: NewCandidate) => Candidate;
  updateCandidate: (id: EntityId, updates: CandidateUpdates) => void;
  deleteCandidate: (id: EntityId) => void;
  removeCandidate: (id: EntityId) => void;
  moveCandidate: (id: EntityId, newStage: PipelineStageId) => void;
  reorderCandidate?: (
    id: EntityId,
    newStage: PipelineStageId,
    newPosition: number
  ) => void;
  addVisit: (payload: NewVisit) => Visit;
  updateVisit: (id: EntityId, updates: VisitUpdates) => void;
  deleteVisit: (id: EntityId) => void;
  addSale: (payload: NewSale) => Sale;
  updateSale: (id: EntityId, updates: SaleUpdates) => void;
  deleteSale: (id: EntityId) => void;
}

export type NewUser = Partial<User>
export type UserUpdates = Partial<User>
export type PreferencesUpdates = Partial<Preferences>
export type NewDistributor = Partial<Distributor>
export type DistributorUpdates = Partial<Distributor>
export type NewCandidate = Partial<Candidate>
export type CandidateUpdates = Partial<Candidate>
export type NewVisit = Partial<Visit>
export type VisitUpdates = Partial<Visit>
export type NewSale = Partial<Sale>
export type SaleUpdates = Partial<Sale>
