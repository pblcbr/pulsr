import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

const Dashboard = () => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h2>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
