import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { toast } from "sonner";
import {
  Shield,
  Users,
  UserCog,
  Trash2,
  Edit,
  Save,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

const roles = [
  { value: "admin", label: "Admin", color: "text-accent" },
  { value: "tenente", label: "Tenente", color: "text-destructive" },
  { value: "elite", label: "Elite", color: "text-secondary" },
  { value: "soldado", label: "Soldado", color: "text-primary" },
  { value: "externo", label: "Externo", color: "text-muted-foreground" },
];

const UserRow = ({ userData, onUpdate, onDelete, currentUserId }) => {
  const [editing, setEditing] = useState(false);
  const [newRole, setNewRole] = useState(userData.role);
  const isCurrentUser = userData.id === currentUserId;
  const roleConfig = roles.find((r) => r.value === userData.role);

  const handleSave = async () => {
    try {
      await onUpdate(userData.id, { role: newRole });
      setEditing(false);
    } catch (error) {
      toast.error("Erro ao atualizar usuário");
    }
  };

  return (
    <TableRow className="border-white/10 hover:bg-white/5">
      <TableCell className="font-medium text-white">{userData.username}</TableCell>
      <TableCell className="text-muted-foreground">{userData.email}</TableCell>
      <TableCell>
        {editing ? (
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger className="w-[120px] input-terminal rounded-none h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-cyber-surface border-white/10">
              {roles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge
            variant="outline"
            className={`${roleConfig?.color} border-current`}
          >
            {roleConfig?.label || userData.role}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-center text-primary">{userData.missions_completed}</TableCell>
      <TableCell className="text-center text-secondary">{userData.reports_submitted}</TableCell>
      <TableCell className="text-center text-accent">{userData.rank_points}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {new Date(userData.created_at).toLocaleDateString("pt-BR")}
      </TableCell>
      <TableCell className="text-right">
        {!isCurrentUser && (
          <div className="flex justify-end gap-2">
            {editing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSave}
                  className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/20"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setNewRole(userData.role);
                  }}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  data-testid={`edit-user-${userData.id}`}
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(true)}
                  className="h-8 w-8 p-0 text-secondary hover:text-secondary hover:bg-secondary/20"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  data-testid={`delete-user-${userData.id}`}
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(userData.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.getUsers(),
        api.getStats(),
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateUser = async (userId, data) => {
    await api.updateUser(userId, data);
    toast.success("Usuário atualizado!");
    fetchData();
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      await api.deleteUser(userId);
      toast.success("Usuário excluído!");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao excluir usuário");
    }
  };

  const usersByRole = roles.reduce((acc, role) => {
    acc[role.value] = users.filter((u) => u.role === role.value).length;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary glow-text font-display text-xl animate-pulse">
          CARREGANDO PAINEL ADMIN...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-page">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white tracking-wider flex items-center gap-3">
          <Shield className="w-8 h-8 text-accent" />
          PAINEL ADMINISTRATIVO
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie usuários e configurações do sistema
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {roles.map((role) => (
          <Card key={role.value} className="hud-panel border-white/10">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-display font-bold ${role.color}`}>
                {usersByRole[role.value] || 0}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {role.label}s
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <Card className="hud-panel border-white/10">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="font-display text-lg tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            GERENCIAR USUÁRIOS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">USUÁRIO</TableHead>
                  <TableHead className="text-muted-foreground">EMAIL</TableHead>
                  <TableHead className="text-muted-foreground">CARGO</TableHead>
                  <TableHead className="text-muted-foreground text-center">MISSÕES</TableHead>
                  <TableHead className="text-muted-foreground text-center">DENÚNCIAS</TableHead>
                  <TableHead className="text-muted-foreground text-center">PONTOS</TableHead>
                  <TableHead className="text-muted-foreground">DESDE</TableHead>
                  <TableHead className="text-muted-foreground text-right">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userData) => (
                  <UserRow
                    key={userData.id}
                    userData={userData}
                    onUpdate={handleUpdateUser}
                    onDelete={handleDeleteUser}
                    currentUserId={user?.id}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hud-panel border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              TOTAL DE MISSÕES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold text-primary">
              {stats?.missions?.total || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.missions?.completed || 0} concluídas
            </p>
          </CardContent>
        </Card>

        <Card className="hud-panel border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              DENÚNCIAS PENDENTES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold text-cyber-orange">
              {stats?.reports?.pending || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              aguardando revisão
            </p>
          </CardContent>
        </Card>

        <Card className="hud-panel border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              SITES DERRUBADOS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold text-destructive">
              {stats?.sites_down || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              alvos neutralizados
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
