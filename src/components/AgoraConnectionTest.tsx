import { useState } from 'react'

export const AgoraConnectionTest = () => {
  const [testResult, setTestResult] = useState<string>('')
  const [testing, setTesting] = useState(false)

  const testAgoraConnection = async () => {
    setTesting(true)
    setTestResult('Testing Agora connection...')

    try {
      // Import Agora dynamically to avoid build issues
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      
      console.log('🔍 Testing Agora App ID:', import.meta.env.VITE_AGORA_APP_ID?.slice(0, 8) + '...')
      
      if (!import.meta.env.VITE_AGORA_APP_ID || import.meta.env.VITE_AGORA_APP_ID === 'your-agora-app-id') {
        setTestResult('❌ Agora App ID is missing or invalid')
        return
      }

      // Create a test client
      const testClient = AgoraRTC.createClient({ 
        mode: 'live', 
        codec: 'vp8' 
      })

      // Try to join a test channel
      const testChannelName = 'test-connection-' + Date.now()
      const testUserId = 'test-user-' + Math.random().toString(36).substr(2, 9)

      console.log('🔍 Testing channel join...')
      
      await testClient.join(
        import.meta.env.VITE_AGORA_APP_ID,
        testChannelName,
        null, // No token for testing
        testUserId
      )

      console.log('✅ Successfully joined test channel')
      setTestResult('✅ Agora connection successful! App ID is valid.')

      // Clean up
      await testClient.leave()
      console.log('✅ Left test channel')

    } catch (error: any) {
      console.error('❌ Agora test failed:', error)
      
      if (error.message?.includes('CAN_NOT_GET_GATEWAY_SERVER')) {
        setTestResult('❌ Gateway connection failed. Check App ID or disable App Certificate in Agora Console.')
      } else if (error.message?.includes('dynamic use static key')) {
        setTestResult('❌ Authentication error. App ID may be incorrect or App Certificate needs to be disabled.')
      } else if (error.message?.includes('INVALID_APP_ID')) {
        setTestResult('❌ Invalid App ID format. Please check your App ID.')
      } else {
        setTestResult(`❌ Connection test failed: ${error.message}`)
      }
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-4">
      <h3 className="text-blue-400 font-semibold mb-3">🔧 Agora Connection Test</h3>
      
      <div className="space-y-3">
        <div className="text-sm text-gray-300">
          <div>App ID: <span className="text-white">
            {import.meta.env.VITE_AGORA_APP_ID ? 
              import.meta.env.VITE_AGORA_APP_ID.slice(0, 8) + '...' : 
              '❌ Missing'
            }
          </span></div>
        </div>

        <button
          onClick={testAgoraConnection}
          disabled={testing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm"
        >
          {testing ? '⏳ Testing...' : '🔍 Test Agora Connection'}
        </button>

        {testResult && (
          <div className={`p-3 rounded text-sm ${
            testResult.includes('✅') ? 'bg-green-900/30 text-green-200' : 'bg-red-900/30 text-red-200'
          }`}>
            {testResult}
          </div>
        )}

        <div className="text-xs text-gray-400">
          💡 This test verifies if your Agora App ID can connect to Agora servers
        </div>
      </div>
    </div>
  )
}
