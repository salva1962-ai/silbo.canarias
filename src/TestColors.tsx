import React from 'react'

const TestColors: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pastel-indigo/5 to-pastel-cyan/10 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pastel-indigo via-gray-900 to-pastel-cyan bg-clip-text text-transparent mb-8">
          Test de Colores Pastel - AHORA DEBERÍAS VER COLORES
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Indigo */}
          <div className="bg-gradient-to-br from-pastel-indigo/10 via-white to-pastel-indigo/5 border border-pastel-indigo/20 rounded-2xl p-6 shadow-lg shadow-pastel-indigo/10">
            <div className="bg-pastel-indigo/15 p-3 rounded-xl w-fit mb-4">
              <div className="w-6 h-6 bg-pastel-indigo rounded"></div>
            </div>
            <h3 className="text-xl font-bold text-pastel-indigo mb-2">
              Pastel Indigo
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Color principal del sistema
            </p>
          </div>

          {/* Cyan */}
          <div className="bg-gradient-to-br from-pastel-cyan/10 via-white to-pastel-cyan/5 border border-pastel-cyan/20 rounded-2xl p-6 shadow-lg shadow-pastel-cyan/10">
            <div className="bg-pastel-cyan/15 p-3 rounded-xl w-fit mb-4">
              <div className="w-6 h-6 bg-pastel-cyan rounded"></div>
            </div>
            <h3 className="text-xl font-bold text-pastel-cyan mb-2">
              Pastel Cyan
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Color secundario</p>
          </div>

          {/* Yellow */}
          <div className="bg-gradient-to-br from-pastel-yellow/10 via-white to-pastel-yellow/5 border border-pastel-yellow/20 rounded-2xl p-6 shadow-lg shadow-pastel-yellow/10">
            <div className="bg-pastel-yellow/15 p-3 rounded-xl w-fit mb-4">
              <div className="w-6 h-6 bg-pastel-yellow rounded"></div>
            </div>
            <h3 className="text-xl font-bold text-pastel-yellow mb-2">
              Pastel Yellow
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Color de advertencia
            </p>
          </div>

          {/* Green */}
          <div className="bg-gradient-to-br from-pastel-green/10 via-white to-pastel-green/5 border border-pastel-green/20 rounded-2xl p-6 shadow-lg shadow-pastel-green/10">
            <div className="bg-pastel-green/15 p-3 rounded-xl w-fit mb-4">
              <div className="w-6 h-6 bg-pastel-green rounded"></div>
            </div>
            <h3 className="text-xl font-bold text-pastel-green mb-2">
              Pastel Green
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Color de éxito</p>
          </div>

          {/* Red */}
          <div className="bg-gradient-to-br from-pastel-red/10 via-white to-pastel-red/5 border border-pastel-red/20 rounded-2xl p-6 shadow-lg shadow-pastel-red/10">
            <div className="bg-pastel-red/15 p-3 rounded-xl w-fit mb-4">
              <div className="w-6 h-6 bg-pastel-red rounded"></div>
            </div>
            <h3 className="text-xl font-bold text-pastel-red mb-2">
              Pastel Red
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Color de peligro</p>
          </div>

          {/* Gradient Test */}
          <div className="bg-gradient-to-br from-pastel-indigo via-pastel-cyan to-pastel-green rounded-2xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">Gradiente</h3>
            <p className="text-white/90">Todos los colores juntos</p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Estados de Hover
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              className="px-4 py-2 bg-pastel-indigo text-white rounded-lg hover:bg-pastel-indigo-dark transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pastel-indigo/20"
            >
              Indigo Button
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-pastel-cyan text-white rounded-lg hover:bg-pastel-cyan-dark transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pastel-cyan/20"
            >
              Cyan Button
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-pastel-yellow text-white rounded-lg hover:bg-pastel-yellow-dark transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pastel-yellow/20"
            >
              Yellow Button
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-pastel-green text-white rounded-lg hover:bg-pastel-green-dark transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pastel-green/20"
            >
              Green Button
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-pastel-red text-white rounded-lg hover:bg-pastel-red-dark transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pastel-red/20"
            >
              Red Button
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestColors
