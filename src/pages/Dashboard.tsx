import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LogOut, User, Settings, Shield, Mail, Calendar, CheckCircle, Key, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, profile, signOut, createProfileForCurrentUser, updatePassword } = useAuth();
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
    }
  };

  const handleCreateProfile = async () => {
    await createProfileForCurrentUser();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(passwordForm.newPassword);
      toast.success('Password updated successfully');
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to update password');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-blue-800 pt-20">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-orange-500" />
                </div>
                
                <h2 className="text-xl font-bold text-white mb-2">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </h2>
                
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">{user?.email}</span>
                </div>

                {profile?.user_type && (
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getUserTypeColor(profile.user_type)}`}>
                    {getUserTypeIcon(profile.user_type)}
                    <span className="capitalize">{profile.user_type}</span>
                  </div>
                )}

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

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-6">Welcome to Skillyug!</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white">Quick Actions</h4>
                  
                  <button className="w-full flex items-center space-x-3 p-4 bg-blue-800/30 hover:bg-blue-800/50 rounded-lg border border-blue-700/50 transition-colors">
                    <Settings className="h-5 w-5 text-orange-500" />
                    <span className="text-white">Account Settings</span>
                  </button>

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
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
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
        </div>
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-blue-900/90 border border-blue-800/50 rounded-xl p-6 w-full max-w-md backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Change Password</h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-blue-800/30 border border-blue-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-blue-800/30 border border-blue-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-blue-800/30 border border-blue-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
    </div>
  );
};

export default Dashboard;
