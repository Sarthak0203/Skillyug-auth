import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LogOut, User, Settings, Shield, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react';

const Dashboard = () => {
  const { user, profile, signOut, createProfileForCurrentUser } = useAuth();

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
                
                <h2 className="text-xl font-semibold text-white mb-2">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </h2>
                
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">{user?.email}</span>
                </div>

                {profile ? (
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm ${getUserTypeColor(profile.user_type)}`}>
                    {getUserTypeIcon(profile.user_type)}
                    <span className="capitalize">{profile.user_type}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleCreateProfile}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white text-sm transition-colors"
                  >
                    Create Profile
                  </button>
                )}
              </div>

              {/* Account Status */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Email Verified</span>
                  <div className="flex items-center space-x-1">
                    {user?.email_confirmed_at ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-500 text-sm">Yes</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-500 text-sm">No</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Profile Complete</span>
                  <div className="flex items-center space-x-1">
                    {profile ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-500 text-sm">Yes</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-orange-500 text-sm">No</span>
                      </>
                    )}
                  </div>
                </div>

                {profile && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Member Since</span>
                    <span className="text-gray-300 text-sm">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="lg:col-span-2">
            <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white mb-6">Welcome to Skillyug Dashboard</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white">Quick Actions</h4>
                  
                  <button className="w-full flex items-center space-x-3 p-4 bg-blue-800/30 hover:bg-blue-800/50 rounded-lg border border-blue-700/50 transition-colors">
                    <Settings className="h-5 w-5 text-orange-500" />
                    <span className="text-white">Account Settings</span>
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
    </div>
  );
};

export default Dashboard;
