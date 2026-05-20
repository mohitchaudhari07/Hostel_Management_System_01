import { LogOut, User } from "lucide-react";
import { logoutUser, getCurrentUser } from "../utils/authUtils";

export default function DashboardHeader({ title }) {
  const user = getCurrentUser();
  const roleName = user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logoutUser();
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        </div>

        <div className="flex items-center gap-6">
          {/* User Info */}
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-full">
              <User size={16} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{roleName}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors font-medium text-sm"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
