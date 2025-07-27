import { CivicMap } from "@/components/maps/CivicMap";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Civic Mind Intelligence
              </h1>
              <p className="text-sm text-gray-600">
                Real-time civic intelligence and event monitoring
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">Phase 4: Frontend</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Live Civic Intelligence Map
                </h2>
                <p className="text-sm text-gray-600">
                  Real-time alerts and event clusters from your Firebase API
                </p>
              </div>
              <Suspense
                fallback={
                  <div className="h-96 flex items-center justify-center">
                    <div className="animate-pulse text-gray-500">
                      Loading map...
                    </div>
                  </div>
                }
              >
                <CivicMap height="600px" />
              </Suspense>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* System Status */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                System Status
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">API Status</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium">Online</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">WebSocket</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium">Connecting</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">Active Alerts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">Event Clusters</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">1</div>
                  <div className="text-sm text-gray-600">Total Reports</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
