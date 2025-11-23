import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PreferencesPage from './pages/PreferencesPage'
import CookRecipePage from './pages/CookRecipePage'
import SelectIngredientsPage from './pages/SelectIngredientsPage'
import SavedRecipesPage from './pages/SavedRecipesPage'
import ChatPage from './pages/ChatPage'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Layout />}> 
        <Route index element={<HomePage />} />
        <Route path="preferences" element={<PreferencesPage />} />
        <Route path="select" element={<SelectIngredientsPage />} />
        <Route path="cook" element={<CookRecipePage />} />
        <Route path="saved" element={<SavedRecipesPage />} />
        <Route path="chat" element={<ChatPage />} />
      </Route>
    </Routes>
  )
}

export default App
