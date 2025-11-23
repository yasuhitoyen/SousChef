import React, { useState, useRef, useEffect } from 'react'
import DownloadIcon from '../assets/icons/DownloadIcon.png'
import CloseIcon from '../assets/icons/CloseIcon.png'
import Recipe from '../components/Recipe'
import { generateRecipes } from '../utils/recipeApi'

const DETECT_INGREDIENTS_IMAGE_URL = 'http://localhost:3001/api/detect-ingredients' // Node.js for images
const DETECT_INGREDIENTS_VIDEO_URL = 'http://localhost:8000/detect-ingredients' // Flask for videos
const SPOONACULAR_IMAGE_URL = 'http://localhost:3001/api/spoonacular-image'

const SelectIngredientsPage = () => {
  const [mediaFile, setMediaFile] = useState(null)
  const [previewURL, setPreviewURL] = useState(() => {
    const saved = localStorage.getItem('ingredientImageURL')
    return saved || null
  })
  const [ingredients, setIngredients] = useState(() => {
    const saved = localStorage.getItem('ingredients')
    return saved ? JSON.parse(saved) : []
  })
  const [newIngredient, setNewIngredient] = useState('')
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [isDraggingOverTrash, setIsDraggingOverTrash] = useState(false)
  const [generatedRecipes, setGeneratedRecipes] = useState(() => {
    const saved = localStorage.getItem('generatedRecipes')
    return saved ? JSON.parse(saved) : null
  })
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [isIdentifying, setIsIdentifying] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const trashRef = useRef(null)

  // Save ingredients to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ingredients', JSON.stringify(ingredients))
  }, [ingredients])

  // Save generated recipes to localStorage whenever they change
  useEffect(() => {
    if (generatedRecipes) {
      localStorage.setItem('generatedRecipes', JSON.stringify(generatedRecipes))
    } else {
      localStorage.removeItem('generatedRecipes')
    }
  }, [generatedRecipes])

  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setMediaFile(file)
    const url = URL.createObjectURL(file)
    setPreviewURL(url)
    localStorage.setItem('ingredientImageURL', url)
    setError(null)
  }

  const handleIdentifyFoods = async () => {
    setError(null)

    if (!mediaFile) {
      setError('Please upload an image or video first.')
      return
    }

    const isVideo = mediaFile.type.startsWith('video/')
    const isImage = mediaFile.type.startsWith('image/')

    if (!isVideo && !isImage) {
      setError('Please upload a valid image or video file.')
      return
    }

    try {
      setIsIdentifying(true)

      const formData = new FormData()
      
      // Both backends expect "file" field name
      formData.append('file', mediaFile)

      // Route to correct backend based on file type
      const apiUrl = isVideo ? DETECT_INGREDIENTS_VIDEO_URL : DETECT_INGREDIENTS_IMAGE_URL

      console.log('Sending file:', {
        name: mediaFile.name,
        type: mediaFile.type,
        size: mediaFile.size,
        backend: isVideo ? 'Flask (port 8000)' : 'Node.js (port 3001)',
        fieldName: 'file',
        url: apiUrl
      })

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      })

      // Try to get error details from response
      if (!response.ok) {
        let errorMessage = `Backend error: ${response.status} ${response.statusText}`
        try {
          const errorText = await response.text()
          console.error('Backend error response:', errorText)
          
          // Try to parse as JSON
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage
          } catch (e) {
            // If not JSON, use the text directly
            if (errorText) errorMessage = errorText
          }
        } catch (e) {
          console.error('Error reading response:', e)
        }
        throw new Error(errorMessage)
      }

      // Expecting: { labels: ["tomato", "onion", ...] }
      const data = await response.json()
      console.log('Backend response:', data)
      
      const labels = Array.isArray(data.labels) ? data.labels : []

      if (labels.length === 0) {
        setError(`No foods detected in the ${isVideo ? 'video' : 'image'}.`)
        return
      }

      const normalized = labels
        .map((label) => String(label).trim().toLowerCase())
        .filter((label) => label.length > 0)

      setIngredients((prev) => {
        const set = new Set(prev)
        normalized.forEach((ing) => set.add(ing))
        return Array.from(set)
      })
      
      // Success message
      setError(null)
      console.log('Successfully added ingredients:', normalized)
    } catch (err) {
      console.error('Failed to detect ingredients:', err)
      setError(err.message || 'Failed to identify foods. Please try again.')
    } finally {
      setIsIdentifying(false)
    }
  }

  const handleRemove = () => {
    setMediaFile(null)
    setPreviewURL(null)
    localStorage.removeItem('ingredientImageURL')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleAddIngredient = (e) => {
    e.preventDefault()
    const trimmed = newIngredient.trim().toLowerCase()
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed])
      setNewIngredient('')
    }
  }

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target.outerHTML)
  }

  const handleDropOnTrash = (e) => {
    e.preventDefault()
    setIsDraggingOverTrash(false)
    if (draggedIndex !== null) {
      setIngredients(ingredients.filter((_, index) => index !== draggedIndex))
      setDraggedIndex(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setIsDraggingOverTrash(false)
  }

  const handleFindRecipes = async () => {
    if (ingredients.length === 0) {
      setError('Please add at least one ingredient')
      return
    }

    setIsLoadingRecipes(true)
    setError(null)
    setGeneratedRecipes(null)

    try {
      // 1. Get recipes from OpenAI (no images yet / or Unsplash ignored)
      const recipes = await generateRecipes(ingredients)

      // 2. For each recipe, call your Express + Spoonacular backend
      const recipesWithImages = await Promise.all(
        recipes.map(async (recipe) => {
          const title =
            recipe.recipeName ||
            recipe.title ||
            (typeof recipe === 'string' ? recipe : 'Recipe')

          try {
            const res = await fetch(
              `${SPOONACULAR_IMAGE_URL}?title=${encodeURIComponent(title)}`
            )

            if (!res.ok) {
              console.error('Spoonacular backend error:', res.status, res.statusText)
              return { ...recipe } // no image, just return base recipe
            }

            const data = await res.json()
            const imageUrl = data?.image || recipe.imageUrl || null

            return {
              ...recipe,
              recipeName: recipe.recipeName || recipe.title || title,
              imageUrl,
            }
          } catch (err) {
            console.error('Error fetching recipe image:', err)
            return {
              ...recipe,
              recipeName: recipe.recipeName || recipe.title || title,
            }
          }
        })
      )

      setGeneratedRecipes(recipesWithImages)
    } catch (err) {
      setError(err.message || 'Failed to generate recipes. Please try again.')
      console.error('Error:', err)
    } finally {
      setIsLoadingRecipes(false)
    }
  }


  const getMediaType = () => {
    if (!mediaFile) return null
    if (mediaFile.type.startsWith('video/')) return 'video'
    if (mediaFile.type.startsWith('image/')) return 'image'
    return null
  }

  const mediaType = getMediaType()

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-[#F7F3E9]">
      <div className="w-full md:w-1/2 p-4 md:p-6 space-y-4">
        {/* Upload & Preview */}
        <div className="select-ingredients w-full bg-white h-[400px] flex items-center justify-center flex-col rounded-2xl relative border-2 border-dashed border-[#E8DDC8] hover:border-[#D4A574] transition-colors">
          {previewURL ? (
            <>
              <img 
                src={CloseIcon}
                alt="close"
                onClick={handleRemove}
                className="w-6 h-6 absolute top-4 right-4 cursor-pointer z-10 bg-white/80 rounded-full p-1 hover:bg-white transition-colors"
              />
              {mediaFile && mediaFile.type.startsWith('video/') ? (
                <video
                  src={previewURL}
                  controls
                  className="h-full w-auto object-contain rounded-xl"
                />
              ) : (
                <img
                  src={previewURL}
                  alt="preview"
                  className="h-full w-auto object-contain rounded-xl cursor-pointer"
                  onClick={handleImageClick}
                />
              )}
            </>
          ) : (
            <div className="text-center">
              <img 
                src={DownloadIcon}
                alt="select"
                onClick={handleImageClick}
                className="w-10 h-10 cursor-pointer mx-auto mb-3 opacity-60 hover:opacity-100 transition-opacity"
              />
              <p className="text-[#5A4A3A] text-sm">
                Click to upload an image or video of your ingredients
              </p>
              <p className="text-[#8A7A66] text-xs mt-1">
                Upload media to automatically identify foods
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        {/* Identify Foods Button */}
        <div className="w-full">
          <button
            onClick={handleIdentifyFoods}
            disabled={!mediaFile || isIdentifying}
            className="w-full py-3 mt-2 bg-[#5A7A3A] text-white rounded-lg hover:bg-[#4F6B33] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isIdentifying ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Identifying foods...
              </>
            ) : (
              `Identify foods in ${mediaType === 'video' ? 'video' : mediaType === 'image' ? 'image' : 'media'}`
            )}
          </button>
        </div>

        {/* Ingredients Section */}
        <div className="bg-white rounded-2xl p-4 border border-[#E8DDC8]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#2C2416]">Ingredients</h3>
            {ingredients.length > 0 && (
              <button
                onClick={() => setIngredients([])}
                className="text-sm text-red-600 hover:text-red-800 transition-colors font-medium"
              >
                Clear All
              </button>
            )}
          </div>
          
          {/* Manual Input */}
          <form onSubmit={handleAddIngredient} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="Add ingredient..."
                className="flex-1 px-4 py-2 border border-[#E8DDC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#D4A574] text-white rounded-lg hover:bg-[#C49564] transition-colors font-medium"
              >
                Add
              </button>
            </div>
          </form>

          {/* Ingredients List */}
          {ingredients.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    className="px-4 py-2 bg-[#F0E8D8] text-[#2C2416] rounded-full border border-[#E8DDC8] cursor-move hover:bg-[#E8DDC8] transition-colors flex items-center gap-2"
                  >
                    <span>{ingredient}</span>
                    <button
                      onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))}
                      className="text-[#5A4A3A] hover:text-red-600 transition-colors"
                      aria-label="Remove ingredient"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Find Recipe Button */}
              <button
                onClick={handleFindRecipes}
                disabled={isLoadingRecipes}
                className="w-full py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#C49564] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoadingRecipes ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Recipes...
                  </>
                ) : (
                  'Find Recipes'
                )}
              </button>
            </div>
          )}

          {/* Trash Can Drop Zone */}
          <div
            ref={trashRef}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDraggingOverTrash(true)
            }}
            onDragLeave={() => setIsDraggingOverTrash(false)}
            onDrop={handleDropOnTrash}
            className={`mt-4 p-4 border-2 border-dashed rounded-lg text-center transition-colors ${
              isDraggingOverTrash
                ? 'border-red-500 bg-red-50'
                : 'border-[#E8DDC8] bg-[#F7F3E9]'
            }`}
          >
            <p className="text-sm text-[#5A4A3A]">
              {isDraggingOverTrash ? 'Drop to remove' : 'Drag ingredient here to remove'}
            </p>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Recipes Panel */}
      <div className="w-full md:w-1/2 p-4 md:p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-[#2C2416]">
            {generatedRecipes ? 'Generated Recipes' : 'Recipes'}
          </h2>
          {generatedRecipes && (
            <button
              onClick={() => {
                setGeneratedRecipes(null)
                localStorage.removeItem('generatedRecipes')
              }}
              className="text-sm text-[#5A4A3A] hover:text-[#2C2416] transition-colors"
            >
              Clear Results
            </button>
          )}
        </div>
        
        {generatedRecipes && generatedRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedRecipes.map((recipe, index) => (
              <Recipe key={index} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="bg-[#F7F3E9] rounded-2xl shadow-lg p-12 border border-[#E8DDC8] text-center">
            <h3 className="text-2xl font-bold text-[#2C2416] mb-2">No Recipes Yet</h3>
            <p className="text-[#5A4A3A] mb-6">
              Add ingredients or identify foods from an image or video, then click "Find Recipes" to generate suggestions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SelectIngredientsPage