import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAppData } from './lib/useAppData'

/**
 * Protege rutas: si no hay usuario autenticado, redirige a /login
 */
const ProtectedRoute: React.FC = () => {
  const { currentUser } = useAppData()
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

export default ProtectedRoute
