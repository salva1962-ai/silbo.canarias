import React from 'react';
import { useAppData } from '../lib/useAppData'; // Ajusta la ruta según tu estructura

interface SyncStatusProps {
  className?: string;
}

export function SyncStatus({ className = '' }: SyncStatusProps) {
  const { syncStatus, forceSync, isOnline, isSyncing, pendingSync } = useAppData();

  const handleForceSync = () => {
    forceSync();
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (isSyncing) return 'text-yellow-500';
    if (pendingSync > 0) return 'text-orange-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) return '🔴';
    if (isSyncing) return '🔄';
    if (pendingSync > 0) return '⚠️';
    return '🟢';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Sin conexión';
    if (isSyncing) return 'Sincronizando...';
    if (pendingSync > 0) return `${pendingSync} cambios pendientes`;
    return 'Sincronizado';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Estado visual */}
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        <span className="text-sm">{getStatusIcon()}</span>
        <span className="text-xs font-medium">{getStatusText()}</span>
      </div>

      {/* Botón de sincronización manual */}
      {pendingSync > 0 && (
        <button
          onClick={handleForceSync}
          disabled={isSyncing || !isOnline}
          className={`
            px-2 py-1 text-xs rounded-md font-medium transition-colors
            ${
              isSyncing || !isOnline
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }
          `}
        >
          {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      )}

      {/* Información adicional */}
      {syncStatus.lastSync && (
        <span className="text-xs text-gray-500">
          Última sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

// ✅ EJEMPLO DE USO EN HEADER/NAVBAR
export function AppHeader() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              CRM Silbo Canarias
            </h1>
          </div>
          
          {/* Estado de sincronización en el header */}
          <SyncStatus className="ml-auto" />
        </div>
      </div>
    </header>
  );
}

// ✅ EJEMPLO DE USO EN MODAL DE IMPORTACIÓN
export function ImportModal() {
  const { pendingSync, isOnline } = useAppData();

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Importar datos desde Excel</h2>
        
        {/* Advertencia si hay datos sin sincronizar */}
        {pendingSync > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                ⚠️
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Datos pendientes de sincronización
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Tienes {pendingSync} cambios sin sincronizar. 
                    {isOnline 
                      ? ' Se sincronizarán automáticamente después de la importación.'
                      : ' Se sincronizarán cuando recuperes la conexión.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado de conexión */}
        {!isOnline && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                🔴
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Sin conexión a internet
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Los datos importados se guardarán localmente y se sincronizarán 
                    automáticamente cuando recuperes la conexión.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resto del contenido del modal... */}
      </div>
    </div>
  );
}

// ✅ EJEMPLO DE NOTIFICACIÓN TOAST
export function SyncNotification() {
  const { notifications } = useAppData();
  
  // Filtrar solo notificaciones de sincronización
  const syncNotifications = notifications.filter(n => 
    n.title.includes('Conexión') || 
    n.title.includes('Sincronización') || 
    n.title.includes('offline')
  );

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {syncNotifications.map(notification => (
        <div
          key={notification.id}
          className={`
            max-w-sm p-4 rounded-lg shadow-lg transition-all
            ${notification.type === 'success' ? 'bg-green-500 text-white' : ''}
            ${notification.type === 'warning' ? 'bg-yellow-500 text-white' : ''}
            ${notification.type === 'error' ? 'bg-red-500 text-white' : ''}
            ${notification.type === 'info' ? 'bg-blue-500 text-white' : ''}
          `}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === 'success' && '✅'}
              {notification.type === 'warning' && '⚠️'}
              {notification.type === 'error' && '❌'}
              {notification.type === 'info' && 'ℹ️'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {notification.title}
              </p>
              <p className="text-sm mt-1 opacity-90">
                {notification.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}