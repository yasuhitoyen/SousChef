import { collection, doc, getDocs, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * Save a recipe to the user's saved recipes collection
 */
export const saveRecipe = async (userId, recipe) => {
  if (!userId) {
    throw new Error('User must be logged in to save recipes')
  }

  // Create a unique ID from the recipe title
  const id = recipe.recipeName?.replace(/\s+/g, '_').toLowerCase() || 
             recipe.title?.replace(/\s+/g, '_').toLowerCase() || 
             `recipe_${Date.now()}`

  const ref = doc(collection(db, 'users', userId, 'recipes'), id)

  try {
    // Transform recipe to match our format
    const recipeData = {
      recipeName: recipe.recipeName || recipe.title || 'Untitled Recipe',
      title: recipe.title || recipe.recipeName || 'Untitled Recipe',
      description: recipe.description || '',
      ingredients: recipe.ingredients || [],
      steps: recipe.steps || [],
      imageUrl: recipe.imageUrl || `https://source.unsplash.com/800x600/?food`,
      createdAt: serverTimestamp(),
    }

    await setDoc(ref, recipeData)
    return { success: true, id }
  } catch (error) {
    console.error('Error saving recipe:', error)
    throw error
  }
}

/**
 * Remove a recipe from the user's saved recipes collection
 */
export const removeRecipe = async (userId, recipeId) => {
  if (!userId) {
    throw new Error('User must be logged in to remove recipes')
  }

  const ref = doc(collection(db, 'users', userId, 'recipes'), recipeId)

  try {
    await deleteDoc(ref)
    return { success: true }
  } catch (error) {
    console.error('Error removing recipe:', error)
    throw error
  }
}

/**
 * Get all saved recipes for a user
 */
export const getSavedRecipes = async (userId) => {
  if (!userId) {
    return []
  }

  try {
    const ref = collection(db, 'users', userId, 'recipes')
    const snap = await getDocs(ref)
    
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error loading saved recipes:', error)
    throw error
  }
}

