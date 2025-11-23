import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getSavedRecipes, removeRecipe } from '../utils/recipeStorage'
import Recipe from '../components/Recipe'
import { motion } from 'framer-motion'

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#f5f8fa] rounded-3xl shadow-xl p-10 border-2 border-blue-300/50 text-center"
        >
          <h2 className="text-3xl font-bold text-blue-900 mb-4 font-serif">Please Login</h2>
          <p className="text-blue-700/80 mb-6 text-lg">You need to be logged in to view your saved recipes.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all font-semibold shadow-lg"
          >
            Go to Login
          </motion.button>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#f5f8fa] rounded-3xl shadow-xl p-12 border-2 border-blue-300/50 text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="flex items-center justify-center mb-4"
          >
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full"></div>
          </motion.div>
          <p className="text-blue-700/80 text-lg font-medium">Loading saved recipes...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="flex items-center gap-4 mb-4">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <span className="text-3xl">⭐</span>
          </motion.div>
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-serif mb-2">
              Saved Recipes
            </h1>
            <p className="text-blue-700/80 text-lg">
              {savedRecipes.length === 0 
                ? "Your favorite recipes will appear here"
                : `You have ${savedRecipes.length} saved recipe${savedRecipes.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700"
        >
          {error}
        </motion.div>
      )}

      {savedRecipes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#f5f8fa] rounded-3xl shadow-xl p-16 border-2 border-blue-300/50 text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-8xl mb-6"
          >
            ⭐
          </motion.div>
          <h2 className="text-3xl font-bold text-blue-900 mb-4 font-serif">No Saved Recipes Yet</h2>
          <p className="text-blue-700/80 mb-8 text-lg max-w-md mx-auto">
            Start exploring recipes and save your favorites to access them later!
          </p>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/select')}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all font-semibold text-lg shadow-lg"
          >
            Browse Recipes
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedRecipes.map((recipe, index) => {
            const formattedRecipe = formatRecipeForDisplay(recipe)
            return (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <Recipe recipe={formattedRecipe} />
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => handleRemoveRecipe(recipe.id, e)}
                  className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-xl z-20 backdrop-blur-sm"
                  aria-label="Remove recipe"
                  title="Remove from saved"
                >
                  ×
                </motion.button>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute top-4 left-4 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg z-20"
                >
                  <span className="text-xs">⭐</span>
                  <span className="text-xs font-semibold">Saved</span>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SavedRecipesPage
