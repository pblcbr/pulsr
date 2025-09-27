import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

const Header = () => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          
          {/* Profile */}
          {user && (
            <div className="flex items-center space-x-4 justify-end absolute right-0">
              <div className="hidden sm:block">
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-400 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
