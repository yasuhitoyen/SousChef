import React, { useState, useEffect } from 'react'

const PreferencesPage = () => {
  const [preferences, setPreferences] = useState({
    vegetarian: false,
    vegan: false,
    halal: false,
    glutenFree: false,
    dairyFree: false,
    nutFree: false,
    kosher: false,
    lowCarb: false,
    lowSodium: false,
  })

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recipePreferences')
    if (saved) {
      setPreferences(JSON.parse(saved))
    }
  }, [])

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('recipePreferences', JSON.stringify(preferences))
  }, [preferences])

  const togglePreference = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const preferenceLabels = {
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    halal: 'Halal',
    glutenFree: 'Gluten-Free',
    dairyFree: 'Dairy-Free',
    nutFree: 'Nut-Free',
    kosher: 'Kosher',
    lowCarb: 'Low-Carb',
    lowSodium: 'Low-Sodium',
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-[#F7F3E9] rounded-2xl shadow-lg p-8 border border-[#E8DDC8]">
        <h1 className="text-4xl font-bold mb-2 text-[#2C2416]">Dietary Preferences</h1>
        <p className="text-[#5A4A3A] mb-8 text-lg">
          Select your dietary preferences to filter recipes that match your needs
        </p>

        <div className="space-y-4">
          {Object.entries(preferenceLabels).map(([key, label]) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E8DDC8] hover:border-[#D4C4A8] transition-colors"
            >
              <label
                htmlFor={key}
                className="flex-1 cursor-pointer"
              >
                <span className="text-lg font-medium text-[#2C2416]">{label}</span>
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={preferences[key]}
                onClick={() => togglePreference(key)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:ring-offset-2 ${
                  preferences[key]
                    ? 'bg-[#D4A574]'
                    : 'bg-[#E8DDC8]'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    preferences[key] ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-[#F0E8D8] rounded-xl border border-[#E8DDC8]">
          <p className="text-sm text-[#5A4A3A]">
            <strong className="text-[#2C2416]">Note:</strong> Your preferences are automatically saved and will be used to filter recipes.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PreferencesPage
