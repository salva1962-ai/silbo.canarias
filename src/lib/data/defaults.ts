import type { Preferences, User } from '../types'

export const DEFAULT_USERS: User[] = [
  {
    id: 'user-juan-delgado',
    fullName: 'Juan Delgado',
    email: 'admin@silbocanarias.com',
    role: 'Supervisor comercial',
    region: 'Canarias',
    permissions: 'Supervisor',
    phone: '+34 600 123 456',
    avatarInitials: 'JD',
    lastLogin: '2025-10-07T08:45:00.000Z',
    activity: [
      {
        id: 'activity-login',
        title: 'Inicio de sesión',
        detail: 'Hoy a las 08:45 • IP segura',
        timestamp: new Date().toISOString()
      },
      {
        id: 'activity-distributors',
        title: 'Actualización de distribuidores',
        detail: 'Se editaron 3 fichas • Hace 2 horas',
        timestamp: new Date().toISOString()
      },
      {
        id: 'activity-reports',
        title: 'Exportación de reporte semanal',
        detail: 'Archivo PDF generado • Ayer 19:30',
        timestamp: new Date().toISOString()
      }
    ],
    createdAt: '2025-01-12T09:00:00.000Z'
  }
]

export const DEFAULT_PREFERENCES: Preferences = {
  privacyEmail: 'info@ucoipcanarias.com',
  allowDataExports: true
}
