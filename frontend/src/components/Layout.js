import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Target,
  AlertTriangle,
  MessageSquare,
  Wrench,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: "all" },
  { path: "/missions", label: "Missões", icon: Target, roles: ["admin", "tenente", "elite", "soldado"] },
  { path: "/reports", label: "Denúncias", icon: AlertTriangle, roles: "all" },
  { path: "/chat", label: "Chat", icon: MessageSquare, roles: "all" },
  { path: "/tools", label: "Ferramentas", icon: Wrench, roles: ["admin", "tenente", "elite", "soldado"] },
  { path: "/admin", label: "Admin", icon: Shield, roles: ["admin"] },
  { path: "/profile", label: "Perfil", icon: User, roles: "all" },
];

const roleLabels = {
  admin: "ADMIN",
  tenente: "TENENTE",
  elite: "ELITE",
  soldado: "SOLDADO",
  externo: "EXTERNO",
};

const roleColors = {
  admin: "text-accent",
  tenente: "text-destructive",
  elite: "text-secondary",
  soldado: "text-primary",
  externo: "text-muted-foreground",
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredNavItems = navItems.filter(
    (item) => item.roles === "all" || item.roles.includes(user?.role)
  );

  return (
    <div className="min-h-screen bg-cyber-black flex">
      {/* Mobile menu button */}
      <button
        data-testid="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-cyber-surface border border-white/10 text-primary"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-cyber-surface border-r border-white/10 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <h1 className="font-display text-2xl font-bold text-primary glow-text tracking-widest">
              THE ADMINS
            </h1>
            <p className="text-xs text-muted-foreground mt-1 tracking-wider">
              CYBERSECURITY UNIT
            </p>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 border border-primary/50 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate font-medium">
                  {user?.username}
                </p>
                <p className={`text-xs font-bold ${roleColors[user?.role]}`}>
                  {roleLabels[user?.role]}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">PONTOS</span>
              <span className="text-primary font-bold">{user?.rank_points || 0}</span>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.path.slice(1)}`}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all group ${
                      isActive
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="tracking-wide">{item.label}</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </NavLink>
              ))}
            </nav>
          </ScrollArea>

          {/* Logout */}
          <div className="p-4 border-t border-white/10">
            <Button
              data-testid="logout-btn"
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5" />
              <span className="tracking-wide">Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
