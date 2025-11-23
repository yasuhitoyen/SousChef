import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { saveRecipe, getSavedRecipes, removeRecipe } from '../utils/recipeStorage'
import { generateVoice, formatRecipeStepsForAudio } from '../utils/generateVoice'

const CookRecipePage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [recipe, setRecipe] = useState(() => {
    // First try to get from location state, then from localStorage
    const stateRecipe = location.state?.recipe
    if (stateRecipe) {
      // Save to localStorage when navigating from another page
      localStorage.setItem('currentRecipe', JSON.stringify(stateRecipe))
      return stateRecipe
    }
    // Try to load from localStorage
    const savedRecipe = localStorage.getItem('currentRecipe')
    return savedRecipe ? JSON.parse(savedRecipe) : null
  })
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedRecipeId, setSavedRecipeId] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const audioRef = useRef(null)

  // Update localStorage when recipe changes from navigation
  useEffect(() => {
    if (location.state?.recipe) {
      const newRecipe = location.state.recipe
      setRecipe(newRecipe)
      localStorage.setItem('currentRecipe', JSON.stringify(newRecipe))
    }
  }, [location.state])

  // Check if recipe is already saved
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user || !recipe) return

      try {
        const saved = await getSavedRecipes(user.uid)
        const found = saved.find(
          (r) => 
            (r.recipeName === recipe.recipeName || r.title === recipe.recipeName) &&
            JSON.stringify(r.ingredients) === JSON.stringify(recipe.ingredients)
        )
        if (found) {
          setIsSaved(true)
          setSavedRecipeId(found.id)
        }
      } catch (error) {
        console.error('Error checking if recipe is saved:', error)
      }
    }

    checkIfSaved()
  }, [user, recipe])

  const handleSaveClick = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (isSaved && savedRecipeId) {
      // Remove from saved
      setSaving(true)
      try {
        await removeRecipe(user.uid, savedRecipeId)
        setIsSaved(false)
        setSavedRecipeId(null)
      } catch (error) {
        console.error('Error removing recipe:', error)
        alert('Failed to remove recipe. Please try again.')
      } finally {
        setSaving(false)
      }
    } else {
      // Save recipe
      setSaving(true)
      try {
        await saveRecipe(user.uid, recipe)
        setIsSaved(true)
        // Reload to get the ID
        const saved = await getSavedRecipes(user.uid)
        const found = saved.find(
          (r) => 
            (r.recipeName === recipe.recipeName || r.title === recipe.recipeName) &&
            JSON.stringify(r.ingredients) === JSON.stringify(recipe.ingredients)
        )
        if (found) {
          setSavedRecipeId(found.id)
        }
      } catch (error) {
        console.error('Error saving recipe:', error)
        alert('Failed to save recipe. Please try again.')
      } finally {
        setSaving(false)
      }
    }
  }

  const handlePlayAudio = async () => {
    if (isPlaying && audioRef.current) {
      // Stop current audio
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      if (audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src)
      }
      return
    }

    if (!recipe || !recipe.steps || recipe.steps.length === 0) {
      alert('No recipe steps available to play.')
      return
    }

    setIsGeneratingAudio(true)
    try {
      // Format recipe steps for audio
      const audioText = formatRecipeStepsForAudio(recipe)
      console.log("Generating audio for:", audioText)

      // Generate audio
      const audioUrl = await generateVoice(audioText)

      // Create audio element and play
      if (audioRef.current) {
        // Clean up previous audio
        audioRef.current.pause()
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src)
        }
      }

      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }

      audio.onerror = (error) => {
        console.error('Audio playback error:', error)
        setIsPlaying(false)
        setIsGeneratingAudio(false)
        alert('Failed to play audio. Please try again.')
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
      setIsPlaying(true)
    } catch (error) {
      console.error('Error generating/playing audio:', error)
      setIsGeneratingAudio(false)
      alert(`Failed to generate audio: ${error.message || 'Unknown error'}. Please try again.`)
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src)
        }
      }
    }
  }, [])

  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#F7F3E9] rounded-2xl shadow-lg p-8 border border-[#E8DDC8] text-center">
          <h2 className="text-2xl font-bold text-[#2C2416] mb-4">No Recipe Selected</h2>
          <p className="text-[#5A4A3A] mb-6">Please select a recipe from the browse page.</p>
          <button
            onClick={() => navigate('/select')}
            className="px-6 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#C49564] transition-colors font-medium"
          >
            Browse Recipes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-[#F7F3E9] rounded-2xl shadow-lg overflow-hidden border border-[#E8DDC8]">
        {/* Recipe Header */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src={recipe.imageUrl}
            alt={recipe.recipeName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2C2416]/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg flex-1">
                {recipe.recipeName}
              </h1>
              <div className="flex items-center gap-2">
                {/* Play Audio Button */}
                <button
                  onClick={handlePlayAudio}
                  disabled={isGeneratingAudio}
                  className="p-3 bg-white/90 rounded-full hover:bg-white transition-colors shadow-lg z-10 disabled:opacity-50 flex-shrink-0"
                  aria-label={isPlaying ? 'Stop audio' : 'Play recipe steps'}
                  title={isPlaying ? 'Stop audio' : 'Play recipe steps'}
                >
                  {isGeneratingAudio ? (
                    <svg className="animate-spin w-6 h-6 text-[#2C2416]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : isPlaying ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-6 h-6 text-[#2C2416]"
                    >
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-6 h-6 text-[#2C2416]"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                {/* Bookmark Button */}
                {user && (
                  <button
                    onClick={handleSaveClick}
                    disabled={saving}
                    className="p-3 bg-white/90 rounded-full hover:bg-white transition-colors shadow-lg z-10 disabled:opacity-50 flex-shrink-0"
                    aria-label={isSaved ? 'Remove from saved' : 'Save recipe'}
                    title={isSaved ? 'Remove from saved' : 'Save recipe'}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill={isSaved ? '#FFD700' : 'none'}
                      stroke={isSaved ? '#FFD700' : 'currentColor'}
                      strokeWidth="2"
                      className="w-6 h-6 text-[#2C2416]"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Ingredients Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#2C2416] mb-4">Ingredients</h2>
            <div className="bg-white rounded-xl p-6 border border-[#E8DDC8]">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recipe.ingredients.map((ingredient, idx) => (
                  <li key={idx} className="flex items-center text-[#5A4A3A]">
                    <span className="w-2 h-2 bg-[#D4A574] rounded-full mr-3 flex-shrink-0" />
                    <span className="text-lg">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Steps Section */}
          <div>
            <h2 className="text-2xl font-bold text-[#2C2416] mb-4">Instructions</h2>
            <div className="space-y-4">
              {recipe.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-6 border border-[#E8DDC8] hover:border-[#D4A574] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#D4A574] text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {idx + 1}
                    </div>
                    <p className="flex-1 text-[#2C2416] text-lg leading-relaxed pt-1">
                      {step}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate('/select')}
              className="px-8 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#C49564] transition-colors font-medium text-lg"
            >
              Back to Recipes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookRecipePage