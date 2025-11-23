import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getSavedRecipes, removeRecipe } from '../utils/recipeStorage'
import Recipe from '../components/Recipe'

const SavedRecipesPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [savedRecipes, setSavedRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      loadSavedRecipes()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadSavedRecipes = async () => {
    if (!user) return

    setLoading(true)
    setError(null)
    try {
      const recipes = await getSavedRecipes(user.uid)
      setSavedRecipes(recipes)
    } catch (err) {
      setError(err.message || 'Failed to load saved recipes')
      console.error('Error loading saved recipes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveRecipe = async (recipeId, e) => {
    e.stopPropagation() // Prevent navigation when clicking remove
    
    if (!user) return

    if (!window.confirm('Are you sure you want to remove this recipe from your saved recipes?')) {
      return
    }

    try {
      await removeRecipe(user.uid, recipeId)
      setSavedRecipes(savedRecipes.filter(recipe => recipe.id !== recipeId))
    } catch (err) {
      setError(err.message || 'Failed to remove recipe')
      console.error('Error removing recipe:', err)
    }
  }

  // Transform saved recipe to match Recipe component format
  const formatRecipeForDisplay = (recipe) => {
    return {
      recipeName: recipe.recipeName || recipe.title || 'Untitled Recipe',
      title: recipe.title || recipe.recipeName || 'Untitled Recipe',
      description: recipe.description || '',
      ingredients: recipe.ingredients || [],
      steps: recipe.steps || [],
      imageUrl: recipe.imageUrl || `https://source.unsplash.com/800x600/?food`,
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#F7F3E9] rounded-2xl shadow-lg p-8 border border-[#E8DDC8] text-center">
          <h2 className="text-2xl font-bold text-[#2C2416] mb-4">Please Login</h2>
          <p className="text-[#5A4A3A] mb-6">You need to be logged in to view your saved recipes.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#C49564] transition-colors font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#F7F3E9] rounded-2xl shadow-lg p-8 border border-[#E8DDC8] text-center">
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-[#D4A574]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="mt-4 text-[#5A4A3A]">Loading saved recipes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#2C2416] mb-2">Saved Recipes</h1>
        <p className="text-[#5A4A3A] text-lg">
          {savedRecipes.length === 0 
            ? "You haven't saved any recipes yet. Start cooking and save your favorites!"
            : `You have ${savedRecipes.length} saved recipe${savedRecipes.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {savedRecipes.length === 0 ? (
        <div className="bg-[#F7F3E9] rounded-2xl shadow-lg p-12 border border-[#E8DDC8] text-center">
          <h2 className="text-2xl font-bold text-[#2C2416] mb-2">No Saved Recipes</h2>
          <p className="text-[#5A4A3A] mb-6">
            Start exploring recipes and save your favorites to access them later!
          </p>
          <button
            onClick={() => navigate('/select')}
            className="px-6 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#C49564] transition-colors font-medium"
          >
            Browse Recipes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedRecipes.map((recipe) => {
            const formattedRecipe = formatRecipeForDisplay(recipe)
            return (
              <div key={recipe.id} className="relative">
                <Recipe recipe={formattedRecipe} />
                <button
                  onClick={(e) => handleRemoveRecipe(recipe.id, e)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg z-10"
                  aria-label="Remove recipe"
                  title="Remove from saved"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SavedRecipesPage

