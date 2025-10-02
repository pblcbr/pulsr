import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation } from 'react-router-dom'

const Sidebar = () => {
  const { user } = useAuth()
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 flex-1">

        {/* Logo */}
        <div className="mb-8 flex justify-center items-center">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <img src="public/pulsr-logo.ico" alt="Pulsr Logo" className="w-12 h-12" /> 
            <h1 className="text-2xl font-bold text-orange-500">Pulsr</h1>
          </Link>
        </div>


       


        {/* Navigation */}
        <nav className="space-y-2">
          <Link 
            to="/dashboard"
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive('/dashboard') 
                ? 'bg-orange-100 text-orange-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Content Calendar
          </Link>


          
          <Link 
            to="/content-calendar"
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive('/content-calendar') 
                ? 'bg-orange-100 text-orange-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
            Content Generator
          </Link>


        </nav>
      </div>

      {/* User Profile - Outside the padded container */}
      <div className="mt-auto">
        <Link to="/profile" className="block">
          <div
            className={`flex items-center space-x-3 py-3 px-6 transition-colors ${
              isActive('/profile') ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
            }`}
          >
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">
                My Profile
              </p>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  )
}

export default Sidebar
