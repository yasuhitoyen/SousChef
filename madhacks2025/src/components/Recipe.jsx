import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { saveRecipe, removeRecipe, getSavedRecipes } from '../utils/recipeStorage'

const Recipe = ({ recipe }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedRecipeId, setSavedRecipeId] = useState(null)

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

  const handleClick = () => {
    navigate('/cook', { state: { recipe } })
  }

  const handleSaveClick = async (e) => {
    e.stopPropagation() // Prevent navigation when clicking bookmark

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


  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer border border-[#E8DDC8] hover:border-[#D4A574] relative"
    >
      <div className="h-48 overflow-hidden relative">
        <img 
          src={recipe.imageUrl} 
          alt={recipe.recipeName}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        {/* Bookmark Button */}
        {user && (
          <button
            onClick={handleSaveClick}
            disabled={saving}
            className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-lg z-10 disabled:opacity-50"
            aria-label={isSaved ? 'Remove from saved' : 'Save recipe'}
            title={isSaved ? 'Remove from saved' : 'Save recipe'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isSaved ? '#FFD700' : 'none'}
              stroke={isSaved ? '#FFD700' : 'currentColor'}
              strokeWidth="2"
              className="w-5 h-5 text-[#2C2416]"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        )}
      </div>
      <div className="p-4 bg-white">
        <h3 className="font-bold text-lg mb-2 text-[#2C2416]">{recipe.recipeName}</h3>
        {recipe.description && (
          <p className="text-sm text-[#5A4A3A] mb-3 line-clamp-2">{recipe.description}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {recipe.ingredients.slice(0, 3).map((ingredient, idx) => (
            <span 
              key={idx}
              className="text-xs bg-[#F0E8D8] text-[#5A4A3A] px-2 py-1 rounded-full border border-[#E8DDC8]"
            >
              {ingredient}
            </span>
          ))}
          {recipe.ingredients.length > 3 && (
            <span className="text-xs text-[#5A4A3A] px-2 py-1">
              +{recipe.ingredients.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default Recipe