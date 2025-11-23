import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const HomePage = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const userName = profile?.name || user?.email?.split('@')[0] || 'Chef'

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="relative mb-12"
      >
        <div className="bg-[#f5f8fa] rounded-3xl shadow-2xl p-12 md:p-16 border-2 border-blue-300/50 overflow-hidden relative">
          {/* Animated Background Elements */}
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1],
              y: [0, -20, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-8 right-8 text-8xl opacity-5"
          >
            🍳
          </motion.div>
          <motion.div
            animate={{ 
              rotate: [360, 0],
              scale: [1, 1.2, 1],
              y: [0, 20, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-8 left-8 text-7xl opacity-5"
          >
            🥘
          </motion.div>
          <motion.div
            animate={{ 
              rotate: [0, 360],
              x: [0, 30, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 right-1/4 text-6xl opacity-5"
          >
            🌊
          </motion.div>

          <div className="relative z-10">
            {/* Animated Welcome Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mb-6"
            >
              <motion.span
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="inline-block text-6xl mb-4"
              >
                👋
              </motion.span>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent font-serif mb-4">
                {user ? `Welcome back, ${userName}!` : 'Welcome to Sous Chef!'}
              </h1>
            </motion.div>

            {/* App Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mb-8 space-y-4"
            >
              <p className="text-xl md:text-2xl text-blue-800/90 font-medium leading-relaxed">
                Your AI-powered culinary companion
              </p>
              <p className="text-lg text-blue-700/80 leading-relaxed max-w-3xl">
                Discover amazing recipes from your ingredients, get step-by-step cooking guidance, 
                and chat with celebrity chefs. Transform your kitchen into a culinary adventure!
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/select')}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all font-semibold text-lg shadow-lg flex items-center gap-2"
              >
                <span>Get Started</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </motion.button>
              
              {user && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/saved')}
                  className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-semibold text-lg shadow-lg border-2 border-blue-300/50 flex items-center gap-2"
                >
                  <span>⭐</span>
                  <span>Saved Recipes</span>
                </motion.button>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="grid md:grid-cols-3 gap-6 mb-8"
      >
        {[
          { icon: '📸', title: 'Scan Ingredients', desc: 'Upload photos to identify ingredients automatically' },
          { icon: '🤖', title: 'AI Recipes', desc: 'Get personalized recipe suggestions powered by AI' },
          { icon: '👨‍🍳', title: 'Chef Chat', desc: 'Chat with celebrity chefs for cooking tips' },
        ].map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-[#f5f8fa] rounded-2xl p-6 border-2 border-blue-200/50 shadow-lg hover:shadow-xl transition-all"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 + index }}
              className="text-4xl mb-4"
            >
              {feature.icon}
            </motion.div>
            <h3 className="text-xl font-bold text-blue-900 mb-2 font-serif">{feature.title}</h3>
            <p className="text-blue-700/80">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Action Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.6 }}
        whileHover={{ scale: 1.02, y: -5 }}
        className="bg-[#f5f8fa] rounded-3xl shadow-xl p-10 border-2 border-blue-300/50 overflow-hidden relative"
      >
        <motion.div
          animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-4 right-4 text-6xl opacity-10"
        >
          🍳
        </motion.div>
        
        <Link to='/select' className="block relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h4 className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3 font-serif'>
                Find Recipes! 🍽️
              </h4>
              <p className="text-lg text-blue-700/90">
                Scan your ingredients and discover delicious recipes
              </p>
            </div>
            <motion.div
              whileHover={{ x: 10, scale: 1.2 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="text-5xl text-blue-500"
            >
              →
            </motion.div>
          </div>
        </Link>
      </motion.div>
    </div>
  )
}

export default HomePage
