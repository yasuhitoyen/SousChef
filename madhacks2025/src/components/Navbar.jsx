import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Navbar = () => {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()

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

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 z-50 h-20 bg-[#2C2416] text-white shadow-lg border-b border-[#3D3324]"
    >
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-2xl font-extrabold tracking-tight hover:opacity-90 transition-opacity">
          <span className="inline-block bg-[#D4A574]/20 rounded-md p-2"></span>
          <span className="ml-1">Recipe AI</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-[#D4A574] transition-colors">Home</Link>
          <Link to="/preferences" className="text-sm font-medium hover:text-[#D4A574] transition-colors">Preferences</Link>
          <Link to="/select" className="text-sm font-medium hover:text-[#D4A574] transition-colors">Select Ingredients</Link>
          <Link to="/cook" className="text-sm font-medium hover:text-[#D4A574] transition-colors">Cook</Link>
          <Link to="/chat" className="text-sm font-medium hover:text-[#D4A574] transition-colors">Chat</Link>
          {user && (
            <Link to="/saved" className="text-sm font-medium hover:text-[#D4A574] transition-colors">Saved</Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative group">
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#3D3324] transition-colors"
              >
                <div className="w-8 h-8 bg-[#D4A574] rounded-full flex items-center justify-center text-[#2C2416] font-bold">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {profile?.name || user.email?.split('@')[0] || 'User'}
                </span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[#E8DDC8] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="p-2">
                  <div className="px-3 py-2 text-[#2C2416] text-sm border-b border-[#E8DDC8]">
                    <p className="font-medium">{profile?.name || 'User'}</p>
                    <p className="text-[#5A4A3A] text-xs">{user.email}</p>
                  </div>
                  <Link
                    to="/saved"
                    className="block px-3 py-2 text-sm text-[#2C2416] hover:bg-[#F0E8D8] rounded transition-colors"
                  >
                    Saved Recipes
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-[#D4A574] text-white rounded-lg hover:bg-[#C49564] transition-colors font-medium text-sm"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar