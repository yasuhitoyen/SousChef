const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const FISH_API_KEY = process.env.FISH_API_KEY;
const GORDON_MODEL_ID = process.env.GORDON_MODEL_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for videos
});



// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Voice generation service is running' });
});

// Image ingredient detection endpoint
app.post('/api/detect-ingredients', upload.single('file'), async (req, res) => {
  console.log('🟦 [POST /api/detect-ingredients] Request received');
  
  try {
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }

    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    console.log(`📥 File received: ${req.file.originalname} (${mimeType}, ${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Only process images, return empty for videos
    if (!mimeType.startsWith('image/')) {
      console.log('⚠️ Not an image file (it\'s a video), returning empty labels');
      return res.json({ labels: [] });
    }

    // Convert buffer to base64
    const base64Image = fileBuffer.toString('base64');
    
    console.log('🟦 Sending image to OpenAI Vision API...');
    
    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify all food ingredients visible in this image. Return ONLY a comma-separated list of ingredient names, nothing else. Be specific (e.g., "red bell pepper" not just "pepper"). If no food is visible, return "none".'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 300
      }),
    });

    console.log('🟩 OpenAI response status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.log('❌ OpenAI API ERROR:', errText);
      let errorMessage = 'API error';
      try {
        const errorJson = JSON.parse(errText);
        errorMessage = errorJson.error?.message || errorJson.error || errorMessage;
      } catch (e) {
        errorMessage = errText || errorMessage;
      }
      return res.status(response.status).json({ 
        error: `OpenAI API error: ${errorMessage}` 
      });
    }

    const data = await response.json();
    const ingredientsText = data.choices[0]?.message?.content?.trim();

    if (!ingredientsText) {
      console.log('❌ No response from OpenAI');
      return res.status(500).json({ 
        error: 'No response from OpenAI' 
      });
    }

    console.log('🤖 OpenAI response:', ingredientsText);

    // Parse ingredients
    let labels = [];
    if (ingredientsText.toLowerCase() !== 'none') {
      labels = ingredientsText
        .split(',')
        .map(ingredient => ingredient.trim().toLowerCase())
        .filter(ingredient => ingredient.length > 0);
    }

    console.log('✅ Detected ingredients:', labels);
    res.json({ labels });

  } catch (err) {
    console.log('❌ [detect-ingredients] ERROR:', err);
    res.status(500).json({ 
      error: err.message || 'Ingredient detection failed' 
    });
  }
});

// Spoonacular recipe image endpoint (OPTIONAL - if you want to proxy through backend)
app.get('/api/recipe-image', async (req, res) => {
  console.log('🟦 [GET /api/recipe-image] Request received');
  
  const { recipeName } = req.query;

  if (!recipeName) {
    return res.status(400).json({ 
      error: 'Recipe name is required' 
    });
  }

  try {
    console.log(`🟦 Fetching image for recipe: ${recipeName}`);
    const response = await fetch(
      `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(recipeName)}&number=1&apiKey=${SPOONACULAR_API_KEY}`
    );

    if (!response.ok) {
      console.log('⚠️ Spoonacular API error:', response.status);
      return res.json({ 
        imageUrl: 'https://source.unsplash.com/400x300/?food,recipe' 
      });
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0 && data.results[0].image) {
      console.log('✅ Image found:', data.results[0].image);
      res.json({ imageUrl: data.results[0].image });
    } else {
      console.log('⚠️ No image found, using placeholder');
      res.json({ 
        imageUrl: 'https://source.unsplash.com/400x300/?food,recipe' 
      });
    }

  } catch (err) {
    console.log('❌ [recipe-image] ERROR:', err);
    res.json({ 
      imageUrl: 'https://source.unsplash.com/400x300/?food,recipe' 
    });
  }
});

// Voice generation endpoint
app.post('/api/generate-voice', async (req, res) => {
  console.log('🟦 [POST /api/generate-voice] Request received');
  
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    console.log('❌ Missing text parameter');
    return res.status(400).json({ 
      error: 'Text is required for voice generation' 
    });
  }

  try {
    console.log('🟦 Sending request to Fish API...');
    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FISH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        reference_id: GORDON_MODEL_ID,
        format: 'mp3',
      }),
    });

    console.log('🟩 Response status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.log('❌ API ERROR:', errText);
      let errorMessage = 'API error';
      try {
        const errorJson = JSON.parse(errText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch (e) {
        errorMessage = errText || errorMessage;
      }
      return res.status(response.status).json({ 
        error: `API error: ${errorMessage}` 
      });
    }

    const contentType = response.headers.get('content-type');
    console.log('🟩 Content-Type:', contentType);

    if (!contentType || !contentType.includes('audio')) {
      const text = await response.text();
      console.log('❌ Unexpected response type:', text);
      return res.status(500).json({ 
        error: 'Unexpected response format from API' 
      });
    }

    console.log('🟦 Streaming audio response...');
    
    // Set appropriate headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="gordon_voice.mp3"');
    
    // Stream the audio data directly to the response
    response.body.pipe(res);

  } catch (err) {
    console.log('❌ [generateVoice] ERROR:', err);
    res.status(500).json({ 
      error: err.message || 'Voice generation failed' 
    });
  }
});

// Recipe steps formatting endpoint (optional utility)
app.post('/api/format-recipe', (req, res) => {
  const { recipe } = req.body;

  if (!recipe || !recipe.steps || recipe.steps.length === 0) {
    return res.status(400).json({ 
      error: 'Recipe with steps is required',
      formattedText: 'No steps available for this recipe.'
    });
  }

  const recipeName = recipe.recipeName || recipe.title || 'This recipe';
  const stepsText = recipe.steps
    .map((step, index) => `Step ${index + 1}: ${step}`)
    .join('. ');

  const formattedText = `${recipeName}. ${stepsText}`;

  res.json({ formattedText });
});

// Chat endpoint with Gordon Ramsay AI agent
app.post('/api/chat', async (req, res) => {
  console.log('🟦 [POST /api/chat] Request received');
  
  const { message, conversationHistory = [] } = req.body;

  if (!message || message.trim().length === 0) {
    console.log('❌ Missing message parameter');
    return res.status(400).json({ 
      error: 'Message is required for chat' 
    });
  }

  try {
    // Build conversation history with system prompt
    const messages = [
      {
        role: 'system',
        content: `You are Gordon Ramsay, the world-renowned chef and TV personality. You are passionate, direct, and sometimes intense, but always helpful when it comes to cooking. You give excellent cooking advice, critique recipes constructively, and share your culinary expertise. You use your characteristic expressions and energy, but remain professional and educational. Keep responses concise and engaging.`
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message.trim()
      }
    ];

    console.log('🟦 Sending request to OpenAI...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    console.log('🟩 Response status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.log('❌ API ERROR:', errText);
      let errorMessage = 'API error';
      try {
        const errorJson = JSON.parse(errText);
        errorMessage = errorJson.error?.message || errorJson.error || errorMessage;
      } catch (e) {
        errorMessage = errText || errorMessage;
      }
      return res.status(response.status).json({ 
        error: `API error: ${errorMessage}` 
      });
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;

    if (!assistantMessage) {
      console.log('❌ No message in response');
      return res.status(500).json({ 
        error: 'No response from AI' 
      });
    }

    console.log('🟩 Chat response received');
    res.json({ 
      message: assistantMessage,
      role: 'assistant'
    });

  } catch (err) {
    console.log('❌ [chat] ERROR:', err);
    res.status(500).json({ 
      error: err.message || 'Chat request failed' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Detect ingredients: http://localhost:${PORT}/api/detect-ingredients`);
  console.log(`🖼️ Recipe images: http://localhost:${PORT}/api/recipe-image`);
  console.log(`🎤 Voice endpoint: http://localhost:${PORT}/api/generate-voice`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
});