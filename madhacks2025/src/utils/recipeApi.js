const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const generateRecipes = async (ingredients) => {
  const input = ingredients.join(', ')
  
  const prompt = `Generate 5 recipes based on these ingredients: ${input}.

For each recipe return JSON with:
{
  "title": "",
  "description": "",
  "ingredients": [],
  "steps": []
}

Return a JSON object with a "recipes" key containing an array of 5 recipe objects.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful cooking assistant. Always return valid JSON objects with a "recipes" array containing recipe objects. Each recipe must have title, description, ingredients (array), and steps (array).'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    
    // Parse the JSON response
    let recipes
    try {
      // Remove any markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleanedContent)
      
      // Handle different response formats
      if (Array.isArray(parsed)) {
        recipes = parsed
      } else if (parsed.recipes && Array.isArray(parsed.recipes)) {
        recipes = parsed.recipes
      } else if (parsed.data && Array.isArray(parsed.data)) {
        recipes = parsed.data
      } else {
        // Try to find any array in the object
        const arrayValue = Object.values(parsed).find(val => Array.isArray(val))
        recipes = arrayValue || []
      }
      
      if (!Array.isArray(recipes) || recipes.length === 0) {
        throw new Error('No recipes found in response')
      }
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        recipes = JSON.parse(jsonMatch[0])
      } else {
        console.error('Parse error:', parseError)
        console.error('Content:', content)
        throw new Error('Failed to parse recipe JSON from API response')
      }
    }

    // Transform to match our Recipe component format
    return recipes.map((recipe, index) => ({
      recipeName: recipe.title || recipe.name || `Recipe ${index + 1}`,
      description: recipe.description || '',
      ingredients: recipe.ingredients || [],
      steps: recipe.steps || [],
      imageUrl: `https://source.unsplash.com/800x600/?${encodeURIComponent(recipe.title || 'food')}`
    }))
  } catch (error) {
    console.error('Error generating recipes:', error)
    throw error
  }
}

