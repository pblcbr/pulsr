import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation } from 'react-router-dom'

const Sidebar = () => {
  const { user } = useAuth()
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        {/* User Profile */}
        <div className="mb-8">
          <Link to="/profile" className="block">
            <div
              className={`flex items-center space-x-3 p-2 rounded-md transition-colors ${
                isActive('/profile') ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
            >
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    isActive('/profile') ? 'text-blue-700' : 'text-gray-900'
                  }`}
                >
                  {user?.email?.split('@')[0]}
                </p>
                <p
                  className={`text-xs ${
                    isActive('/profile') ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  User
                </p>
              </div>
            </div>
          </Link>
        </div>


        {/* Navigation */}
        <nav className="space-y-2">
          <Link 
            to="/dashboard"
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive('/dashboard') 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            Dashboard
          </Link>

          {/* <Link 
            to="/profile"
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive('/profile') 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            My Profile
          </Link> */}
          
          <Link 
            to="/content-calendar"
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive('/content-calendar') 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Content Calendar
          </Link>
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
