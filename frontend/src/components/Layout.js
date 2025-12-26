import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
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
  Bell,
  Award,
  Zap,
  CheckCheck,
} from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { toast } from "sonner";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: "all" },
  { path: "/missions", label: "Missões", icon: Target, roles: ["admin", "tenente", "elite", "soldado"] },
  { path: "/reports", label: "Denúncias", icon: AlertTriangle, roles: "all" },
  { path: "/chat", label: "Chat", icon: MessageSquare, roles: "all" },
  { path: "/tools", label: "Ferramentas", icon: Wrench, roles: ["admin", "tenente", "elite", "soldado"] },
  { path: "/admin", label: "Admin", icon: Shield, roles: ["admin", "tenente"] },
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

const NotificationItem = ({ notification, onMarkRead }) => {
  const icons = {
    badge: Award,
    mission: Target,
    info: Bell,
  };
  const Icon = icons[notification.type] || Bell;
  
  return (
    <div
      className={`p-3 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 transition-colors ${
        !notification.read ? "bg-primary/5" : ""
      }`}
      onClick={() => onMarkRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 ${notification.type === "badge" ? "bg-accent/20" : "bg-primary/20"}`}>
          <Icon className={`w-4 h-4 ${notification.type === "badge" ? "text-accent" : "text-primary"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{notification.title}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(notification.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
        {!notification.read && (
          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
        )}
      </div>
    </div>
  );
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, updateUserData } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications and update user data periodically
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.getNotifications();
        setNotifications(response.data);
        setUnreadCount(response.data.filter(n => !n.read).length);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    const refreshUserData = async () => {
      try {
        const response = await api.refreshUser();
        updateUserData(response.data);
      } catch (error) {
        console.error("Error refreshing user data:", error);
      }
    };

    fetchNotifications();
    refreshUserData();

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      refreshUserData();
    }, 10000);

    return () => clearInterval(interval);
  }, [updateUserData]);

  // Show toast for new badge notifications
  useEffect(() => {
    const badgeNotifications = notifications.filter(
      n => n.type === "badge" && !n.read
    );
    badgeNotifications.forEach(n => {
      toast.success(n.title, {
        description: n.message,
        duration: 5000,
      });
    });
  }, [notifications]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await api.markNotificationRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const filteredNavItems = navItems.filter(
    (item) => item.roles === "all" || item.roles.includes(user?.role)
  );

  return (
    <div className="min-h-screen bg-cyber-black flex flex-col">
      <div className="flex flex-1">
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
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-cyber-surface border-r border-white/10 transform transition-transform duration-300 flex flex-col ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex flex-col flex-1">
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
                
                {/* Notifications */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="relative p-2 hover:bg-white/5 transition-colors">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs flex items-center justify-center rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-80 p-0 bg-cyber-surface border-white/10"
                    align="end"
                  >
                    <div className="p-3 border-b border-white/10 flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Notificações</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <CheckCheck className="w-3 h-3" />
                          Marcar todas como lidas
                        </button>
                      )}
                    </div>
                    <ScrollArea className="max-h-80">
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkRead={handleMarkRead}
                          />
                        ))
                      ) : (
                        <div className="p-6 text-center text-muted-foreground">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Nenhuma notificação</p>
                        </div>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Points display with real-time update */}
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">PONTOS</span>
                <span className="text-primary font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {user?.rank_points || 0}
                </span>
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
        <main className="flex-1 overflow-auto flex flex-col">
          <div className="p-6 lg:p-8 flex-1">
            <Outlet />
          </div>
          
          {/* Footer with credits */}
          <footer className="border-t border-white/10 p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Este sistema foi totalmente desenvolvido por um membro interno da{" "}
              <span className="text-primary font-bold">The Admins</span>{" "}
              <span className="text-accent">(Zetsu)</span>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
