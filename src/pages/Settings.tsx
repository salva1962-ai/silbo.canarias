import React from 'react'
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

// Interfaces para la página de configuración
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
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
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

  const handleToggle = (): void => {
    onChange(!active)
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/70 p-4 text-sm text-gray-600 dark:text-gray-400">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-5 w-5 text-pastel-indigo" /> : null}
          <p className="text-sm font-semibold text-gray-800">{label}</p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`relative inline-flex h-8 w-16 items-center rounded-full border transition ${
            active
              ? 'border-pastel-indigo bg-gradient-to-r from-pastel-indigo to-pastel-cyan'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
          }`}
          aria-label={`${label}: ${active ? onLabel : offLabel}`}
          {...(active && { 'aria-pressed': 'true' })}
        >
          <span
            className={`absolute left-1 top-1 inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow transition ${
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
  const { isDark, toggle, colorScheme } = useTheme()
  const { preferences, updatePreferences } = useAppData()

  // Mock data para esquemas de colores hasta que esté implementado
  const availableSchemes: Record<string, ColorScheme> = {
    blue: { name: 'Azul', primary: 'azul' },
    green: { name: 'Verde', primary: 'verde' },
    purple: { name: 'Púrpura', primary: 'púrpura' },
    orange: { name: 'Naranja', primary: 'naranja' }
  }

  const handlePrivacyEmailChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    updatePreferences({
      privacyEmail: event.target.value
    })
  }

  const handleDataExportToggle = (value: boolean): void => {
    updatePreferences({ allowDataExports: value })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleColorSchemeChange = (schemeKey: string): void => {
    // setColorScheme(schemeKey); // Deshabilitado hasta implementación completa
  }

  const getSchemeGradient = (key: string): string => {
    switch (key) {
      case 'blue':
        return 'from-blue-400 to-cyan-400'
      case 'green':
        return 'from-emerald-400 to-teal-400'
      case 'purple':
        return 'from-purple-400 to-violet-400'
      default:
        return 'from-orange-400 to-amber-400'
    }
  }

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

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-pastel-indigo/10 to-pastel-cyan/10">
                <SparklesIcon className="h-5 w-5 text-pastel-indigo" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Esquema de colores
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Elige la paleta que mejor se adapte a tu estilo
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(availableSchemes).map(
                ([key, scheme]: [string, ColorScheme]) => (
                  <button
                    key={key}
                    onClick={() => handleColorSchemeChange(key)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                      colorScheme === key
                        ? 'border-pastel-indigo bg-pastel-indigo/10 shadow-lg'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:bg-gray-700'
                    }`}
                    aria-label={`Seleccionar esquema de colores ${scheme.name}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full bg-gradient-to-r ${getSchemeGradient(key)}`}
                      ></div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {scheme.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {scheme.primary}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              )}
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
            onChange={() => {}}
            onLabel="Avisos activos"
            offLabel="Avisos desactivados"
            icon={BellIcon}
          />
          <Toggle
            label="Resumen diario"
            description="Envío diario con el snapshot de visitas, ventas y pendientes. Disponible próximamente."
            active={false}
            onChange={() => {}}
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
            <label className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Correo de privacidad
              </span>
              <input
                type="email"
                value={preferences.privacyEmail}
                onChange={handlePrivacyEmailChange}
                className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 shadow-sm focus:border-pastel-indigo focus:outline-none focus:ring-2 focus:ring-pastel-indigo/30"
                placeholder="dpd@silbocanarias.com"
                aria-label="Correo electrónico de privacidad"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Usaremos este contacto para solicitudes de acceso, rectificación
                o borrado. Debe pertenecer al Delegado de Protección de Datos.
              </span>
            </label>

            <Toggle
              label="Permitir exportación de datos"
              description="Habilita la descarga directa de datos personales desde este panel cuando esté disponible."
              active={preferences.allowDataExports}
              onChange={handleDataExportToggle}
              onLabel="Exportación habilitada"
              offLabel="Exportación deshabilitada"
              icon={ShieldCheckIcon}
            />

            <div className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/80 p-4 text-sm text-gray-600 dark:text-gray-400">
              <p>
                Puedes solicitar una exportación de tus datos o revocar permisos
                de acceso escribiendo a
                <a
                  href={`mailto:${preferences.privacyEmail}`}
                  className="ml-1 font-semibold text-pastel-indigo hover:underline"
                >
                  {preferences.privacyEmail}
                </a>
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
