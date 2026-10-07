import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminRoute() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-900 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Checking admin authorization...</p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to dedicated admin login
  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  // If authenticated but not staff/admin, deny access and redirect to homepage
  if (!user.is_staff) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
