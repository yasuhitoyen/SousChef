import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'

const Navbar = () => {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleProfileClick = () => {
    if (user) {
      // Could navigate to a profile page or show dropdown
      // For now, just show logout option
    } else {
      navigate('/login')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/preferences', label: 'Preferences' },
    { path: '/select', label: 'Ingredients' },
    { path: '/cook', label: 'Cook' },
    { path: '/chat', label: 'Chat' },
  ]

  if (user) {
    navLinks.push({ path: '/saved', label: 'Saved' })
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      role="navigation"
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 z-50 h-20 bg-white/90 backdrop-blur-xl border-b border-blue-200/30 shadow-lg"
    >
      <div className="max-w-7xl mx-auto h-full px-8 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="relative"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5zM9 21h6v-2H9v2z"/>
                </svg>
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-blue-400 rounded-2xl blur-xl -z-10"
              />
            </motion.div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent font-serif">
                Sous Chef
              </span>
              <p className="text-xs text-blue-500/70 -mt-1">Recipe AI</p>
            </div>
          </Link>
        </motion.div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link, index) => {
            const isActive = location.pathname === link.path
            return (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={link.path}
                  className="relative px-4 py-2 rounded-xl transition-all duration-300 group"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl shadow-md border border-blue-200/50"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className={`relative text-sm font-medium transition-colors ${
                    isActive ? 'text-blue-900' : 'text-blue-700 group-hover:text-blue-900'
                  }`}>
                    {link.label}
                  </span>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* User Section */}
        <div className="flex items-center gap-4">
          {user ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="relative group"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleProfileClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all shadow-md border border-blue-200/50"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                >
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                </motion.div>
                <span className="hidden md:block text-sm font-medium text-blue-900">
                  {profile?.name || user.email?.split('@')[0] || 'User'}
                </span>
              </motion.button>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-blue-100/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 overflow-hidden backdrop-blur-xl"
              >
                <div className="p-2">
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100/50">
                    <p className="font-semibold text-blue-900">{profile?.name || 'User'}</p>
                    <p className="text-xs text-blue-600/70">{user.email}</p>
                  </div>
                  <Link
                    to="/saved"
                    className="block px-4 py-3 text-sm text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Saved Recipes
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all font-medium text-sm shadow-lg"
            >
              Login
            </motion.button>
          )}
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar
