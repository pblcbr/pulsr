import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

const Dashboard = () => {
  const { user } = useAuth()

  return (
    <div className="w-full">
      {/* Header */}
      <Header />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1">
          <div className="w-full">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h2>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
