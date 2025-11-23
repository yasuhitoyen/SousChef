import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { saveRecipe, getSavedRecipes, removeRecipe } from '../utils/recipeStorage'


// Use environment variable or default to localhost
const API_BASE_URL = 'http://localhost:3001'


const CookRecipePage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [recipe, setRecipe] = useState(() => {
    const stateRecipe = location.state?.recipe
    if (stateRecipe) {
      localStorage.setItem('currentRecipe', JSON.stringify(stateRecipe))
      return stateRecipe
    }
    const savedRecipe = localStorage.getItem('currentRecipe')
    return savedRecipe ? JSON.parse(savedRecipe) : null
  })
  
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedRecipeId, setSavedRecipeId] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [playingStep, setPlayingStep] = useState(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [availableSpeakers, setAvailableSpeakers] = useState([])
  const [selectedSpeaker, setSelectedSpeaker] = useState('gordon-ramsay')
  const [showSpeakerMenu, setShowSpeakerMenu] = useState(false)
  
  const audioRef = useRef(null)
  const audioCache = useRef({})


  // Fetch available speakers on mount
  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        console.log('Fetching speakers from:', `${API_BASE_URL}/api/speakers`)
        const response = await fetch(`${API_BASE_URL}/api/speakers`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log('Speakers received:', data.speakers)
        setAvailableSpeakers(data.speakers || [])
      } catch (error) {
        console.error('Error fetching speakers:', error)
        // Set default speaker as fallback
        setAvailableSpeakers([{
          key: 'gordon-ramsay',
          name: 'Gordon Ramsay',
          description: 'World-renowned chef and TV personality',
          hasVoice: true
        }])
      }
    }
    fetchSpeakers()
  }, [])


  useEffect(() => {
    if (location.state?.recipe) {
      const newRecipe = location.state.recipe
      setRecipe(newRecipe)
      localStorage.setItem('currentRecipe', JSON.stringify(newRecipe))
    }
  }, [location.state])


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


  // Arrow key navigation and spacebar for audio
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!recipe || !recipe.steps) return
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentStep(prev => Math.max(0, prev - 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setCurrentStep(prev => Math.min(recipe.steps.length - 1, prev + 1))
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        if (!['BUTTON', 'INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
          e.preventDefault()
          handlePlayStepAudio(currentStep)
        }
      }
    }


    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [recipe, currentStep, selectedSpeaker])


  const handleSaveClick = async () => {
    if (!user) {
      navigate('/login')
      return
    }


    if (isSaved && savedRecipeId) {
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
      setSaving(true)
      try {
        await saveRecipe(user.uid, recipe)
        setIsSaved(true)
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


  const handlePlayStepAudio = async (stepIndex) => {
    if (playingStep === stepIndex && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlayingStep(null)
      return
    }


    if (!recipe || !recipe.steps || !recipe.steps[stepIndex]) {
      alert('No step available to play.')
      return
    }


    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }


    setIsGeneratingAudio(true)
    setPlayingStep(stepIndex)


    try {
      const cacheKey = `${selectedSpeaker}-${stepIndex}`
      let audioUrl = audioCache.current[cacheKey]


      // Generate audio if not cached
      if (!audioUrl) {
        const stepText = `Step ${stepIndex + 1}. ${recipe.steps[stepIndex]}`
        console.log("Generating audio for step:", stepText, "with speaker:", selectedSpeaker)
        console.log("API URL:", `${API_BASE_URL}/api/generate-voice`)
        
        const response = await fetch(`${API_BASE_URL}/api/generate-voice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: stepText,
            speaker: selectedSpeaker
          }),
        })


        console.log("Voice generation response status:", response.status)


        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Voice generation failed' }))
          throw new Error(errorData.error || 'Voice generation failed')
        }


        const audioBlob = await response.blob()
        console.log("Audio blob received, size:", audioBlob.size)
        audioUrl = URL.createObjectURL(audioBlob)
        audioCache.current[cacheKey] = audioUrl
      }


      const audio = new Audio(audioUrl)
      audioRef.current = audio


      audio.onended = () => {
        setPlayingStep(null)
      }


      audio.onerror = (error) => {
        console.error('Audio playback error:', error)
        setPlayingStep(null)
        setIsGeneratingAudio(false)
        alert('Failed to play audio. Please try again.')
      }


      await audio.play()
    } catch (error) {
      console.error('Error generating/playing audio:', error)
      setPlayingStep(null)
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
      }
      Object.values(audioCache.current).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [])


  const goToNextStep = () => {
    if (recipe && currentStep < recipe.steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }


  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }


  const handleSpeakerChange = (speakerKey) => {
    setSelectedSpeaker(speakerKey)
    setShowSpeakerMenu(false)
    // Clear audio cache when speaker changes
    Object.values(audioCache.current).forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    })
    audioCache.current = {}
  }


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


  const currentSpeaker = availableSpeakers.find(s => s.key === selectedSpeaker)


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
          {/* Speaker Selection */}
          {availableSpeakers.length > 0 && (
            <div className="mb-8">
              <div className="bg-white rounded-xl p-6 border border-[#E8DDC8]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#2C2416] mb-1">Voice Chef</h3>
                    <p className="text-sm text-[#5A4A3A]">
                      {currentSpeaker ? currentSpeaker.name : 'Select a chef'}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowSpeakerMenu(!showSpeakerMenu)}
                      className="px-4 py-2 bg-[#D4A574] text-white rounded-lg hover:bg-[#C49564] transition-colors font-medium flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                      </svg>
                      <span>Change Chef</span>
                    </button>
                    
                    {showSpeakerMenu && (
                      <>
                        {/* Backdrop to close menu when clicking outside */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowSpeakerMenu(false)}
                        />
                        
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-[#E8DDC8] z-50 max-h-80 overflow-y-auto">
                          <div className="p-2">
                            {availableSpeakers.map((speaker) => (
                              <button
                                key={speaker.key}
                                onClick={() => handleSpeakerChange(speaker.key)}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                                  selectedSpeaker === speaker.key
                                    ? 'bg-[#D4A574] text-white'
                                    : 'hover:bg-[#F7F3E9] text-[#2C2416]'
                                }`}
                              >
                                <div className="font-medium">{speaker.name}</div>
                                <div className={`text-sm ${
                                  selectedSpeaker === speaker.key ? 'text-white/80' : 'text-[#5A4A3A]'
                                }`}>
                                  {speaker.description}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


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


          {/* Current Step Display */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#2C2416]">Instructions</h2>
              <div className="text-sm text-[#5A4A3A] bg-white px-4 py-2 rounded-full border border-[#E8DDC8]">
                Step {currentStep + 1} of {recipe.steps.length}
              </div>
            </div>


            <div className="bg-white rounded-xl p-8 border-2 border-[#D4A574] shadow-lg">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-[#D4A574] text-white rounded-full flex items-center justify-center font-bold text-xl">
                  {currentStep + 1}
                </div>
                <div className="flex-1">
                  <p className="text-[#2C2416] text-xl leading-relaxed mb-4">
                    {recipe.steps[currentStep]}
                  </p>
                  <button
                    onClick={() => handlePlayStepAudio(currentStep)}
                    disabled={isGeneratingAudio && playingStep === currentStep}
                    className="flex items-center gap-2 px-4 py-2 bg-[#D4A574] text-white rounded-lg hover:bg-[#C49564] transition-colors font-medium disabled:opacity-50"
                  >
                    {isGeneratingAudio && playingStep === currentStep ? (
                      <>
                        <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Loading...</span>
                      </>
                    ) : playingStep === currentStep ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                        <span>Stop Audio</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <span>Play Step</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>


            {/* Navigation Controls */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={goToPreviousStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#D4A574] text-[#2C2416] rounded-lg hover:bg-[#F7F3E9] transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
                <span>Previous</span>
              </button>


              <div className="text-sm text-[#5A4A3A] text-center">
                <div>Use ← → arrow keys to navigate</div>
                <div>Press Space to play/stop audio</div>
              </div>


              <button
                onClick={goToNextStep}
                disabled={currentStep === recipe.steps.length - 1}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#D4A574] text-[#2C2416] rounded-lg hover:bg-[#F7F3E9] transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                </svg>
              </button>
            </div>
          </div>


          {/* All Steps Overview */}
          <div>
            <h3 className="text-xl font-bold text-[#2C2416] mb-4">All Steps</h3>
            <div className="space-y-3">
              {recipe.steps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`w-full text-left bg-white rounded-lg p-4 border transition-all ${
                    idx === currentStep
                      ? 'border-[#D4A574] shadow-md'
                      : 'border-[#E8DDC8] hover:border-[#D4A574]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === currentStep
                        ? 'bg-[#D4A574] text-white'
                        : 'bg-[#E8DDC8] text-[#5A4A3A]'
                    }`}>
                      {idx + 1}
                    </div>
                    <p className="flex-1 text-[#2C2416] text-sm line-clamp-1">
                      {step}
                    </p>
                  </div>
                </button>
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



