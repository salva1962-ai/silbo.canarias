import React, { useCallback, useState } from 'react'
import {
  SunIcon,
  MoonIcon,
  BellIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { useTheme } from '../lib/useTheme'
import { useAppData } from '../lib/useAppData'

interface ColorScheme {
  name: string
  primary: string
}

interface SectionProps {
  title: string
  description?: string
  children: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}

interface ToggleProps {
  label: string
  description?: string
  active: boolean
  onChange: (value: boolean) => void
  onLabel?: string
  offLabel?: string
  icon?: React.ComponentType<{ className?: string }>
}

const COLOR_SCHEME_GRADIENTS = {
  blue: 'from-blue-400 to-cyan-400',
  green: 'from-emerald-400 to-teal-400',
  purple: 'from-purple-400 to-violet-400',
  orange: 'from-orange-400 to-amber-400'
} as const

const getSchemeGradient = (key: string): string => {
  return COLOR_SCHEME_GRADIENTS[key as keyof typeof COLOR_SCHEME_GRADIENTS] || COLOR_SCHEME_GRADIENTS.orange
}

const validateEmail = (email: string): boolean => {
  if (!email) return true
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const Section: React.FC<SectionProps> = ({
  title,
  description,
  children,
  icon: Icon
}) => (
  <section className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/90 dark:bg-gray-800/90 p-6 shadow-xl backdrop-blur">
    <header className="flex items-start gap-3">
      {Icon ? (
        <span className="rounded-2xl bg-pastel-indigo/15 p-3 text-pastel-indigo">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        ) : null}
      </div>
    </header>
    <div className="mt-6 space-y-5">{children}</div>
  </section>
)

const Toggle: React.FC<ToggleProps> = ({
  label,
  description,
  active,
  onChange,
  onLabel = 'Activado',
  offLabel = 'Desactivado',
  icon
}) => {
  const Icon = icon

  const handleToggle = useCallback((): void => {
    onChange(!active)
  }, [active, onChange])

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/70 p-4 text-sm text-gray-600 dark:text-gray-400">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-5 w-5 text-pastel-indigo" /> : null}
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`relative inline-flex h-8 w-16 items-center rounded-full border transition-all duration-300 ${
            active
              ? 'border-pastel-indigo bg-gradient-to-r from-pastel-indigo to-pastel-cyan'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
          }`}
          aria-label={`${label}: ${active ? onLabel : offLabel}`}
          aria-pressed={!!active}
        >
          <span
            className={`absolute left-1 top-1 inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow transition-transform duration-300 ${
              active ? 'translate-x-8' : 'translate-x-0'
            }`}
          >
            {active ? (
              <SunIcon className="h-4 w-4 text-pastel-indigo" />
            ) : (
              <MoonIcon className="h-4 w-4 text-gray-400" />
            )}
          </span>
          <span className="sr-only">Cambiar preferencia</span>
        </button>
      </div>
      {description ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      ) : null}
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        {active ? onLabel : offLabel}
      </p>
    </div>
  )
}

const Settings: React.FC = () => {
  const { isDark, toggle, colorScheme, setColorScheme, availableSchemes } = useTheme()
  const { preferences, updatePreferences } = useAppData()
  const [emailError, setEmailError] = useState<string>('')

  const handlePrivacyEmailChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const email = event.target.value.trim()
    if (email && !validateEmail(email)) {
      setEmailError('Formato de email inválido')
    } else {
      setEmailError('')
    }
    updatePreferences({
      privacyEmail: email
    })
  }, [updatePreferences])

  const handleDataExportToggle = useCallback((value: boolean): void => {
    updatePreferences({ allowDataExports: value })
  }, [updatePreferences])

  const handleColorSchemeChange = useCallback((schemeKey: string): void => {
    const scheme = (availableSchemes as Record<string, typeof colorScheme>)[schemeKey];
    if (scheme) setColorScheme(scheme);
  }, [setColorScheme, availableSchemes, colorScheme])

  const handleCriticalAlertsToggle = useCallback((value: boolean): void => {
    console.log('Critical alerts:', value)
  }, [])

  const handleDailySummaryToggle = useCallback((value: boolean): void => {
    console.log('Daily summary:', value)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pastel-indigo/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <header className="rounded-4xl border border-white/40 dark:border-gray-700/40 bg-gradient-to-r from-white/95 via-white/80 to-pastel-indigo/20 dark:from-gray-800/95 dark:via-gray-800/80 dark:to-pastel-indigo/10 p-8 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-pastel-indigo">
                Centro de control
              </p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                Configuración
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
                Ajusta la experiencia de Silbö Canarias: apariencia,
                notificaciones y preferencias operativas.
              </p>
            </div>
          </div>
        </header>

        <Section
          title="Apariencia"
          description="Personaliza la interfaz según tus condiciones de trabajo."
          icon={SunIcon}
        >
          <Toggle
            label="Modo oscuro"
            description="Activa una paleta adaptada a entornos con poca luz. Tus preferencias se recordarán para futuras sesiones."
            active={isDark}
            onChange={toggle}
            onLabel="Tema oscuro"
            offLabel="Tema claro"
            icon={MoonIcon}
          />

          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-pastel-indigo" />
              Esquema de colores
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(availableSchemes).map(([key, scheme]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleColorSchemeChange(key)}
                  className={`group flex flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-pastel-indigo/50 relative overflow-hidden
                    ${colorScheme === key 
                      ? 'border-pastel-indigo bg-pastel-indigo/10 scale-105' 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pastel-indigo/50'}`}
                  aria-pressed={!!(colorScheme === key)}
                  aria-label={`Seleccionar esquema de color ${scheme.name}`}
                >
                  <span className={`w-8 h-8 rounded-full mb-2 border-2 flex items-center justify-center transition-all duration-300 bg-gradient-to-r ${getSchemeGradient(key)}
                    ${colorScheme === key ? 'border-pastel-indigo scale-110' : 'border-gray-300 dark:border-gray-600 group-hover:border-pastel-indigo/50'}`}>
                    {colorScheme === key && (
                      <svg className="w-4 h-4 text-white animate-fade-in" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-xs font-semibold transition-colors ${colorScheme === key ? 'text-pastel-indigo' : 'text-gray-700 dark:text-gray-200'}`}>
                    {scheme.name}
                  </span>
                  {colorScheme === key && (
                    <div className="absolute inset-0 bg-gradient-to-r from-pastel-indigo/5 to-pastel-cyan/5 rounded-2xl" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section
          title="Notificaciones"
          description="Configura cómo deseas recibir avisos operativos y comerciales."
          icon={BellIcon}
        >
          <Toggle
            label="Alertas críticas"
            description="Recibe avisos instantáneos cuando haya tareas críticas pendientes o incidencias en checklists."
            active={true}
            onChange={handleCriticalAlertsToggle}
            onLabel="Avisos activos"
            offLabel="Avisos desactivados"
            icon={BellIcon}
          />
          <Toggle
            label="Resumen diario"
            description="Envío diario con el snapshot de visitas, ventas y pendientes. Disponible próximamente."
            active={false}
            onChange={handleDailySummaryToggle}
            onLabel="Programado"
            offLabel="No programado"
            icon={ArrowPathIcon}
          />
        </Section>

        <Section
          title="Privacidad y datos"
          description="Gestiona tus datos personales y las políticas de la plataforma."
          icon={ShieldCheckIcon}
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Correo de privacidad
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={preferences.privacyEmail}
                  onChange={handlePrivacyEmailChange}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pastel-indigo/50 ${
                    emailError
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 focus:border-red-500'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:border-pastel-indigo'
                  }`}
                  placeholder="dpd@silbocanarias.com"
                  aria-label="Correo electrónico de privacidad"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : 'email-help'}
                />
                {emailError && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>
              {emailError ? (
                <span id="email-error" className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {emailError}
                </span>
              ) : (
                <span id="email-help" className="text-xs text-gray-500 dark:text-gray-400">
                  Usaremos este contacto para solicitudes de acceso, rectificación
                  o borrado. Debe pertenecer al Delegado de Protección de Datos.
                </span>
              )}
            </div>

            <Toggle
              label="Permitir exportación de datos"
              description="Habilita la descarga directa de datos personales desde este panel cuando esté disponible."
              active={preferences.allowDataExports}
              onChange={handleDataExportToggle}
              onLabel="Exportación habilitada"
              offLabel="Exportación deshabilitada"
              icon={ShieldCheckIcon}
            />

            <div className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-gray-700/80 dark:to-blue-900/20 p-4 text-sm text-gray-600 dark:text-gray-400">
              <p>
                Puedes solicitar una exportación de tus datos o revocar permisos
                de acceso escribiendo a
                {preferences.privacyEmail ? (
                  <a
                    href={`mailto:${preferences.privacyEmail}`}
                    className="ml-1 font-semibold text-pastel-indigo hover:text-pastel-indigo/80 transition-colors duration-200 underline decoration-dotted underline-offset-2"
                  >
                    {preferences.privacyEmail}
                  </a>
                ) : (
                  <span className="ml-1 font-semibold text-gray-400">
                    [configurar email arriba]
                  </span>
                )}
                .
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Próximamente podrás descargar tus datos directamente desde este
                panel. Mientras tanto, utiliza el correo indicado.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}

export default Settings