import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";
import {
  Target,
  AlertTriangle,
  Trophy,
  Activity,
  Globe,
  TrendingUp,
  Shield,
  MessageSquare,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Button } from "../components/ui/button";

const StatCard = ({ title, value, subtitle, icon: Icon, color, glow }) => (
  <Card className="hud-panel border-white/10 hover:border-primary/30 transition-all">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase mb-2">
            {title}
          </p>
          <p className={`text-3xl font-display font-bold ${color} ${glow ? "glow-text" : ""}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 bg-white/5 border border-white/10`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const RankingItem = ({ user, rank, isCurrentUser }) => {
  const roleColors = {
    admin: "text-accent",
    tenente: "text-destructive",
    elite: "text-secondary",
    soldado: "text-primary",
  };

  return (
    <div
      className={`flex items-center gap-4 p-4 border-b border-white/5 last:border-0 ${
        isCurrentUser ? "bg-primary/5" : ""
      }`}
    >
      <div
        className={`w-8 h-8 flex items-center justify-center font-display font-bold ${
          rank <= 3 ? "text-primary" : "text-muted-foreground"
        }`}
      >
        #{rank}
      </div>
      <div className="flex-1">
        <p className="text-sm text-white font-medium">{user.username}</p>
        <p className={`text-xs ${roleColors[user.role]}`}>
          {user.role.toUpperCase()}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm text-primary font-bold">{user.rank_points}</p>
        <p className="text-xs text-muted-foreground">pontos</p>
      </div>
    </div>
  );
};

// Restricted page for external users
const ExternalUserView = ({ user, navigate }) => (
  <div className="space-y-8 animate-fade-in" data-testid="dashboard-page">
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="p-6 bg-white/5 border border-white/10 mb-6">
        <Lock className="w-16 h-16 text-muted-foreground" />
      </div>
      <h1 className="font-display text-3xl font-bold text-white tracking-wider mb-4">
        ACESSO RESTRITO
      </h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Como usuário externo, você tem acesso apenas às funcionalidades de denúncia e chat.
        O dashboard completo é exclusivo para membros internos da The Admins.
      </p>
      <div className="flex gap-4">
        <Button
          onClick={() => navigate("/reports")}
          className="btn-cyber rounded-none"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          FAZER DENÚNCIA
        </Button>
        <Button
          onClick={() => navigate("/chat")}
          variant="outline"
          className="border-secondary text-secondary hover:bg-secondary hover:text-black rounded-none"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          ACESSAR CHAT
        </Button>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, rankingRes] = await Promise.all([
          api.getStats(),
          api.getRanking(),
        ]);
        setStats(statsRes.data);
        setRanking(rankingRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary glow-text font-display text-xl animate-pulse">
          CARREGANDO DADOS...
        </div>
      </div>
    );
  }

  // Show restricted view for external users
  if (user?.role === "externo") {
    return <ExternalUserView user={user} navigate={navigate} />;
  }

  const completionRate = stats?.missions?.total
    ? Math.round((stats.missions.completed / stats.missions.total) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wider">
            PAINEL DE CONTROLE
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bem-vindo de volta, <span className="text-primary">{user?.username}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="status-online" />
          <span className="text-primary tracking-wider">SISTEMA ONLINE</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Missões Ativas"
          value={stats?.missions?.in_progress || 0}
          subtitle={`${stats?.missions?.pending || 0} pendentes`}
          icon={Target}
          color="text-primary"
          glow
        />
        <StatCard
          title="Missões Concluídas"
          value={stats?.missions?.completed || 0}
          subtitle={`${completionRate}% taxa de sucesso`}
          icon={Trophy}
          color="text-secondary"
        />
        <StatCard
          title="Denúncias Pendentes"
          value={stats?.reports?.pending || 0}
          subtitle={`${stats?.reports?.total || 0} total`}
          icon={AlertTriangle}
          color="text-cyber-orange"
        />
        <StatCard
          title="Sites Derrubados"
          value={stats?.sites_down || 0}
          subtitle="alvos neutralizados"
          icon={Globe}
          color="text-destructive"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Card */}
        <Card className="hud-panel border-white/10 lg:col-span-2">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="font-display text-lg tracking-wider flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              PROGRESSO DA OPERAÇÃO
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Taxa de Conclusão</span>
                <span className="text-primary font-bold">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2 bg-white/10" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground mb-1">PENDENTES</p>
                <p className="text-2xl font-display font-bold text-cyber-orange">
                  {stats?.missions?.pending || 0}
                </p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground mb-1">EM PROGRESSO</p>
                <p className="text-2xl font-display font-bold text-secondary">
                  {stats?.missions?.in_progress || 0}
                </p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground mb-1">CONCLUÍDAS</p>
                <p className="text-2xl font-display font-bold text-primary">
                  {stats?.missions?.completed || 0}
                </p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground mb-1">MEMBROS</p>
                <p className="text-2xl font-display font-bold text-accent">
                  {stats?.users?.active_members || 0}
                </p>
              </div>
            </div>

            {/* User Stats */}
            {user?.role !== "externo" && (
              <div className="p-4 bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">SUAS ESTATÍSTICAS</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <p className="text-2xl font-display font-bold text-primary">
                          {user?.missions_completed || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Missões</p>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div>
                        <p className="text-2xl font-display font-bold text-secondary">
                          {user?.reports_submitted || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Denúncias</p>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div>
                        <p className="text-2xl font-display font-bold text-accent">
                          {user?.rank_points || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Pontos</p>
                      </div>
                    </div>
                  </div>
                  <Shield className="w-12 h-12 text-primary/30" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking Card */}
        <Card className="hud-panel border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="font-display text-lg tracking-wider flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              RANKING
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ranking.length > 0 ? (
              <div className="divide-y divide-white/5">
                {ranking.slice(0, 10).map((rankedUser, index) => (
                  <RankingItem
                    key={rankedUser.id}
                    user={rankedUser}
                    rank={index + 1}
                    isCurrentUser={rankedUser.id === user?.id}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                Nenhum membro no ranking ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
