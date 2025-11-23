const API_BASE_URL = "http://localhost:3001"

export async function generateVoice(text) {
  console.log("🟦 [generateVoice] Called with text:", text)

  if (!text || text.trim().length === 0) {
    throw new Error("Text is required for voice generation")
  }

  try {
    console.log("🟦 Sending request to Express server...")
    const response = await fetch(`${API_BASE_URL}/api/generate-voice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.trim(),
      }),
    })

    console.log("🟩 Response status:", response.status)

    if (!response.ok) {
      let errorMessage = "API error"
      try {
        const errorJson = await response.json()
        errorMessage = errorJson.error || errorMessage
      } catch {
        const errText = await response.text()
        errorMessage = errText || errorMessage
      }
      console.log("❌ API ERROR:", errorMessage)
      throw new Error(errorMessage)
    }

    const contentType = response.headers.get("content-type")
    console.log("🟩 Content-Type:", contentType)

    if (!contentType || !contentType.includes("audio")) {
      const text = await response.text()
      console.log("❌ Unexpected response type:", text)
      throw new Error("Unexpected response format from API")
    }

    console.log("🟦 Converting response to Blob...")
    const blob = await response.blob()
    console.log("🟩 blob size:", blob.size)

    if (blob.size === 0) {
      throw new Error("Received empty audio file")
    }

    // Create a blob URL for web playback
    const blobUrl = URL.createObjectURL(blob)
    console.log("🟩 Blob URL created:", blobUrl)

    return blobUrl
  } catch (err) {
    console.log("❌ [generateVoice] ERROR:", err)
    if (err instanceof Error) {
      // Check if it's a network error (server not running)
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        throw new Error("Cannot connect to voice server. Make sure the Express server is running on port 3001.")
      }
      throw err
    }
    throw new Error(`Voice generation failed: ${err.message || 'Unknown error'}`)
  }
}

// Format recipe steps into a readable text string
export function formatRecipeStepsForAudio(recipe) {
  if (!recipe || !recipe.steps || recipe.steps.length === 0) {
    return "No steps available for this recipe."
  }

  const recipeName = recipe.recipeName || recipe.title || "This recipe"
  const stepsText = recipe.steps
    .map((step, index) => `Step ${index + 1}: ${step}`)
    .join(". ")

  return `${recipeName}. ${stepsText}`
}

