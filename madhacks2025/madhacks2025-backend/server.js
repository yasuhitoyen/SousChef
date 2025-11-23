const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3001;


const FISH_API_KEY = process.env.FISH_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;


// Speaker configuration dictionary
const SPEAKERS = {
  'gordon-ramsay': {
    id: 'e605a2a42b0a44ccb7af2e42e1676c92',
    name: 'Gordon Ramsay',
    description: 'World-renowned chef and TV personality',
    personality: `You are Gordon Ramsay, the world-renowned chef and TV personality. You are passionate, direct, and sometimes intense, but always helpful when it comes to cooking. You give excellent cooking advice, critique recipes constructively, and share your culinary expertise. You use your characteristic expressions like "bloody hell," "beautiful," and "come on!" You're demanding but educational. Keep responses concise and engaging with your signature intensity and flair.`,
    voice: true
  },
  'guy-fieri': {
    id: '8bffd5a802ea48df8502e8e30cf48c3a',
    name: 'Guy Fieri',
    description: 'Host of Diners, Drive-Ins and Dives',
    personality: `You are Guy Fieri, the energetic host of Diners, Drive-Ins and Dives. You're enthusiastic, fun-loving, and always ready to take things to "Flavortown!" You use expressions like "that's money," "off the hook," "righteous," and "gangster!" You're all about bold flavors, comfort food, and having a good time. You're supportive, encouraging, and make cooking fun. Keep the energy high and the vibe positive!`,
    voice: true
  },
  'anthony-bourdain': {
    id: '31437b4203d74c9a9b97fffd8bdb9c47',
    name: 'Anthony Bourdain',
    description: 'Chef, author, and travel documentarian',
    personality: `You are Anthony Bourdain, the thoughtful chef, author, and travel documentarian. You're witty, intelligent, and philosophical about food and culture. You appreciate authenticity, street food, and the stories behind dishes. You're sardonic but warm, with a literary quality to your observations. You reference your travels, discuss food in cultural context, and aren't afraid to be honest or critical. You appreciate the simple, the real, and the human element in cooking.`,
    voice: true
  },
  'mario-batali': {
    id: 'dcb361299bf540fe897b57494ed4b26b',
    name: 'Mario',
    description: 'Italian cuisine expert and restaurateur',
    personality: `You are Mario the protagonist in the popular nintendo game Super Mario Galaxy . You are cheerful, optimistic, and always ready for an adventure. You use expressions like "Let's-a go!", "Woohoo!", and "Here we go!" You're all about fun, excitement, and overcoming challenges with a positive attitude. You encourage others to join you on your quests and celebrate victories with enthusiasm. Keep the tone light-hearted, energetic, and full of joy!`,
    voice: true
  },
  'dexter-morgan': {
    id: 'a5971a1fd805441aaf3b0bbe8c9f1ab6',
    name: 'Dexter Morgan',
    description: 'Bay Harbor serial killer with a dark sense of humor',
    personality: `You are Dexter Morgan, the forensic blood spatter analyst with a dark sense of humor. You are calm, methodical, and introspective, often reflecting on the duality of your nature. You have a dry wit and a penchant for irony, frequently making sardonic remarks about human behavior and society. While you maintain a composed exterior, you have an underlying intensity and complexity. You approach conversations with a blend of clinical detachment and dark humor, often revealing your unique perspective on morality and justice.`,
    voice: true
  },
  'walter-white': {
    id: 'f5638a7285a1459c85be7ded9caefaec',
    name: 'Walter White',
    description: 'Chemistry teacher turned methamphetamine manufacturer',
    personality: `You are Walter White, the brilliant chemistry teacher turned methamphetamine manufacturer. You are intelligent, calculating, and often coldly pragmatic. You have a commanding presence and a tendency to assert your authority, frequently using phrases like "I am the one who knocks" and "Say my name." You approach situations with a strategic mindset, valuing logic and efficiency over emotion. While you can be ruthless, you also have moments of vulnerability and complexity. Your tone is serious, intense, and often tinged with a sense of inevitability.`,
    voice: true
  },
  'joker': {
    id: 'fad5a5a6770e47019f566b8f8c0ff609',
    name: 'Joker',
    description: 'Chaotic and unpredictable villain from Gotham City',
    personality: `You are the Joker, the chaotic and unpredictable villain from Gotham City. You are mischievous, darkly humorous, and revel in anarchy. Insert a few twisted jokes inbetween your lines.`,
    voice: true
  },
  'gru': {
    id: 'c910c8c52bba463f82a2a62ba6c7f6e6',
    name: 'Gru',
    description: 'Leader of the Minions and former supervillain',
    personality: `You are Gru, the lovable leader of the Minions and former supervillain. You are clever, resourceful, and have a dry sense of humor. You often use phrases like "Light bulb!" when you have an idea, and you have a soft spot for your family and friends despite your tough exterior. You approach situations with a mix of cunning and warmth, often showing your caring side in unexpected ways. Your tone is witty, slightly sarcastic, but ultimately kind-hearted.`,
    voice: true
  }
};


// Middleware
app.use(cors());
app.use(express.json());


// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for videos
});


// GET /api/spoonacular-image?title=Chicken Alfredo
app.get("/api/spoonacular-image", async (req, res) => {
  try {
    const { title } = req.query;


    if (!title) {
      return res.status(400).json({ error: "Missing 'title' query parameter" });
    }


    const query = encodeURIComponent(title);


    const url = `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=1&apiKey=${SPOONACULAR_API_KEY}`;


    const response = await fetch(url);
    const data = await response.json();


    if (data?.results?.length > 0) {
      return res.json({ image: data.results[0].image });
    }


    return res.json({ image: null });
  } catch (err) {
    console.error("Spoonacular ERROR:", err);
    return res.status(500).json({ error: "Failed to fetch image" });
  }
});


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Voice generation service is running' });
});


// Endpoint to get available speakers - MUST be before other routes
app.get('/api/speakers', (req, res) => {
  console.log('🟦 [GET /api/speakers] Request received');
  try {
    const speakerList = Object.entries(SPEAKERS).map(([key, speaker]) => ({
      key,
      name: speaker.name,
      description: speaker.description,
      hasVoice: speaker.voice
    }));
    
    console.log('✅ Returning speakers:', speakerList);
    res.json({ speakers: speakerList });
  } catch (error) {
    console.error('❌ Error in /api/speakers:', error);
    res.status(500).json({ error: 'Failed to fetch speakers' });
  }
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


// Spoonacular recipe image endpoint
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


// Voice generation endpoint with dynamic speaker
app.post('/api/generate-voice', async (req, res) => {
  console.log('🟦 [POST /api/generate-voice] Request received');
  const { text, speaker = 'gordon-ramsay' } = req.body;


  if (!text || text.trim().length === 0) {
    console.log('❌ Missing text parameter');
    return res.status(400).json({
      error: 'Text is required for voice generation'
    });
  }


  // Get speaker configuration
  const speakerConfig = SPEAKERS[speaker];
  if (!speakerConfig) {
    return res.status(400).json({
      error: `Invalid speaker: ${speaker}`
    });
  }


  if (!speakerConfig.voice) {
    return res.status(400).json({
      error: `Voice not available for speaker: ${speakerConfig.name}`
    });
  }


  try {
    console.log(`🟦 Sending request to Fish API for ${speakerConfig.name}...`);
    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FISH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        reference_id: speakerConfig.id,
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
    res.setHeader('Content-Disposition', `attachment; filename="${speaker}_voice.mp3"`);
  
    // Stream the audio data directly to the response
    response.body.pipe(res);


  } catch (err) {
    console.log('❌ [generateVoice] ERROR:', err);
    res.status(500).json({
      error: err.message || 'Voice generation failed'
    });
  }
});


// Recipe steps formatting endpoint
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


// Chat endpoint with dynamic speaker selection
app.post('/api/chat', async (req, res) => {
  console.log('🟦 [POST /api/chat] Request received');
  const { message, conversationHistory = [], speaker = 'gordon-ramsay' } = req.body;


  if (!message || message.trim().length === 0) {
    console.log('❌ Missing message parameter');
    return res.status(400).json({
      error: 'Message is required for chat'
    });
  }


  // Get speaker configuration
  const speakerConfig = SPEAKERS[speaker];
  if (!speakerConfig) {
    return res.status(400).json({
      error: `Invalid speaker: ${speaker}`
    });
  }


  try {
    // Build conversation history with system prompt
    const messages = [
      {
        role: 'system',
        content: speakerConfig.personality
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message.trim()
      }
    ];


    console.log(`🟦 Sending request to OpenAI as ${speakerConfig.name}...`);
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
      role: 'assistant',
      speaker: speaker
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
  console.log(`👨‍🍳 Speakers endpoint: http://localhost:${PORT}/api/speakers`);
});



