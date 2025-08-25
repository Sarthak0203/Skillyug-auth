import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LogOut, User, Settings, Shield, Mail, Calendar, CheckCircle, Key, X, Radio, Home, XCircle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { LiveStreamSection } from '../components/LiveStreamSection';
import { LiveStreamDebugPanel } from '../components/LiveStreamDebugPanel';
import { StreamStatusDebugger } from '../components/StreamStatusDebugger';
import { AgoraConnectionTest } from '../components/AgoraConnectionTest';
import { StreamDiagnostic } from '../components/StreamDiagnostic';

const Dashboard = () => {
  const { user, profile, signOut, createProfileForCurrentUser, updatePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleCreateProfile = async () => {
    await createProfileForCurrentUser();
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await updatePassword(passwordForm.newPassword);
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'admin': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'instructor': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'student': return 'text-green-500 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'instructor': return <BookOpen className="h-4 w-4" />;
      case 'student': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const tabs = [
    { 
      id: 'overview', 
      name: 'Overview', 
      icon: Home,
      available: true 
    },
    { 
      id: 'livestream', 
      name: 'Live Stream', 
      icon: Radio,
      available: true 
    },
    { 
      id: 'courses', 
      name: 'Courses', 
      icon: BookOpen,
      available: true 
    },
    { 
      id: 'settings', 
      name: 'Settings', 
      icon: Settings,
      available: true 
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-6 backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-10 w-10 text-orange-500" />
                  </div>
                  
                  <h2 className="text-xl font-semibold text-white mb-2">
                    {profile?.full_name || user?.email || 'User'}
                  </h2>
                  
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm ${
                    profile ? getUserTypeColor(profile.user_type) : 'text-gray-500 bg-gray-500/10 border-gray-500/20'
                  }`}>
                    {profile ? getUserTypeIcon(profile.user_type) : <User className="h-4 w-4" />}
                    <span className="capitalize">{profile?.user_type || 'Unknown'}</span>
                  </div>

                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex items-center justify-between p-3 bg-blue-800/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-orange-500" />
                        <span className="text-gray-300">Email</span>
                      </div>
                      <span className="text-white text-xs">{user?.email}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-800/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span className="text-gray-300">Joined</span>
                      </div>
                      <span className="text-white text-xs">
                        {profile ? new Date(profile.created_at).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-800/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {user?.email_confirmed_at ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-gray-300">Email Status</span>
                      </div>
                      <span className={`text-xs ${user?.email_confirmed_at ? 'text-green-400' : 'text-red-400'}`}>
                        {user?.email_confirmed_at ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>

                  {!profile && (
                    <div className="mt-4 p-3 bg-orange-900/30 border border-orange-800/50 rounded-lg">
                      <p className="text-orange-300 text-sm mb-3">Profile not found. Create one to get started!</p>
                      <button
                        onClick={handleCreateProfile}
                        className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                      >
                        Create Profile
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-2 border border-red-600 text-red-400 rounded-lg hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Dashboard Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Welcome Section */}
              <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
                </h3>
                <p className="text-gray-300 mb-6">
                  {profile?.user_type === 'admin' 
                    ? 'Manage your platform and oversee all activities.' 
                    : profile?.user_type === 'instructor' 
                    ? 'Create and manage your courses.' 
                    : 'Continue your learning journey.'}
                </p>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white">Quick Actions</h4>
                  
                  <button 
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="w-full flex items-center space-x-3 p-4 bg-blue-800/30 hover:bg-blue-800/50 rounded-lg border border-blue-700/50 transition-colors"
                  >
                    <Key className="h-5 w-5 text-orange-500" />
                    <span className="text-white">Change Password</span>
                  </button>

                  {profile?.user_type === 'student' && (
                    <button className="w-full flex items-center space-x-3 p-4 bg-blue-800/30 hover:bg-blue-800/50 rounded-lg border border-blue-700/50 transition-colors">
                      <BookOpen className="h-5 w-5 text-orange-500" />
                      <span className="text-white">Browse Courses</span>
                    </button>
                  )}

                  {profile?.user_type === 'instructor' && (
                    <button className="w-full flex items-center space-x-3 p-4 bg-blue-800/30 hover:bg-blue-800/50 rounded-lg border border-blue-700/50 transition-colors">
                      <BookOpen className="h-5 w-5 text-orange-500" />
                      <span className="text-white">Manage Courses</span>
                    </button>
                  )}

                  {(profile?.user_type === 'admin' || profile?.user_type === 'instructor') && (
                    <button 
                      onClick={() => setActiveTab('livestream')}
                      className="w-full flex items-center space-x-3 p-4 bg-orange-800/30 hover:bg-orange-800/50 rounded-lg border border-orange-700/50 transition-colors"
                    >
                      <Radio className="h-5 w-5 text-orange-500" />
                      <span className="text-white">Start Live Stream</span>
                    </button>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="space-y-4 mt-8">
                  <h4 className="text-lg font-medium text-white">Recent Activity</h4>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-800/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span className="text-gray-300 text-sm">Account created</span>
                      </div>
                      <span className="text-gray-400 text-xs">
                        {profile ? new Date(profile.created_at).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>

                    {user?.email_confirmed_at && (
                      <div className="p-3 bg-blue-800/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-gray-300 text-sm">Email verified</span>
                        </div>
                        <span className="text-gray-400 text-xs">
                          {new Date(user.email_confirmed_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'livestream':
        return (
          <div className="space-y-4">
            <AgoraConnectionTest />
            <StreamStatusDebugger />
            <LiveStreamSection />
          </div>
        );
        
      case 'courses':
        return (
          <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-8 backdrop-blur-sm text-center">
            <BookOpen className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Courses</h3>
            <p className="text-gray-400">Course management features coming soon!</p>
          </div>
        );
        
      case 'settings':
        return (
          <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-8 backdrop-blur-sm text-center">
            <Settings className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Settings</h3>
            <p className="text-gray-400">Advanced settings coming soon!</p>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-blue-800">
      {/* Header */}
      <div className="border-b border-blue-800/50 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-orange-500" />
              <span className="text-2xl font-bold text-white">Skillyug</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-blue-800/50 bg-black/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-blue-900/90 border border-blue-800/50 rounded-xl p-6 w-full max-w-md backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Change Password</h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 bg-blue-800/30 border border-blue-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 bg-blue-800/30 border border-blue-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Debug Panel */}
      <LiveStreamDebugPanel />
      
      {/* Stream Diagnostic - Temporary for troubleshooting */}
      <StreamDiagnostic />
    </div>
  );
};

export default Dashboard;
