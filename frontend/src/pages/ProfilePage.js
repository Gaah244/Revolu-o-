import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import {
  User,
  Mail,
  Shield,
  Target,
  AlertTriangle,
  Trophy,
  Calendar,
  Award,
  Crosshair,
  Crown,
  Eye,
  Zap,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";

const roles = {
  admin: { label: "ADMINISTRADOR", color: "text-accent", bg: "bg-accent/20 border-accent" },
  tenente: { label: "TENENTE", color: "text-destructive", bg: "bg-destructive/20 border-destructive" },
  elite: { label: "ELITE", color: "text-secondary", bg: "bg-secondary/20 border-secondary" },
  soldado: { label: "SOLDADO", color: "text-primary", bg: "bg-primary/20 border-primary" },
  externo: { label: "EXTERNO", color: "text-muted-foreground", bg: "bg-muted/20 border-muted-foreground" },
};

const rankTiers = [
  { name: "NOVATO", min: 0, max: 100, color: "text-muted-foreground" },
  { name: "APRENDIZ", min: 100, max: 500, color: "text-primary" },
  { name: "OPERADOR", min: 500, max: 1000, color: "text-secondary" },
  { name: "ESPECIALISTA", min: 1000, max: 2500, color: "text-cyber-orange" },
  { name: "VETERANO", min: 2500, max: 5000, color: "text-destructive" },
  { name: "LENDA", min: 5000, max: Infinity, color: "text-accent" },
];

const badgeIcons = {
  target: Target,
  crosshair: Crosshair,
  award: Award,
  crown: Crown,
  "alert-triangle": AlertTriangle,
  eye: Eye,
  zap: Zap,
  shield: Shield,
  star: Star,
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loadingBadges, setLoadingBadges] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [allBadgesRes, userBadgesRes] = await Promise.all([
          api.getBadges(),
          api.getUserBadges(user.id),
        ]);
        setBadges(allBadgesRes.data);
        setUserBadges(userBadgesRes.data);
      } catch (error) {
        console.error("Error fetching badges:", error);
      } finally {
        setLoadingBadges(false);
      }
    };

    if (user?.id) {
      fetchBadges();
    }
  }, [user?.id]);

  const currentRank = rankTiers.find(
    (tier) => user.rank_points >= tier.min && user.rank_points < tier.max
  ) || rankTiers[0];

  const nextRank = rankTiers.find((tier) => tier.min > user.rank_points);
  const progressToNext = nextRank
    ? ((user.rank_points - currentRank.min) / (nextRank.min - currentRank.min)) * 100
    : 100;

  const roleConfig = roles[user?.role] || roles.externo;

  const earnedBadgeIds = userBadges.map(b => b.id);

  return (
    <div className="space-y-6" data-testid="profile-page">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white tracking-wider flex items-center gap-3">
          <User className="w-8 h-8 text-primary" />
          MEU PERFIL
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Suas informações e estatísticas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="hud-panel border-white/10 lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-primary/20 border-2 border-primary flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white">
                {user?.username}
              </h2>
              <Badge
                variant="outline"
                className={`mt-2 ${roleConfig.bg} ${roleConfig.color}`}
              >
                {roleConfig.label}
              </Badge>

              <div className="w-full mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Membro desde {new Date(user?.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Rank */}
        <Card className="hud-panel border-white/10 lg:col-span-2">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="font-display text-lg tracking-wider flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              RANKING & ESTATÍSTICAS
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Rank Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs text-muted-foreground">RANK ATUAL</span>
                  <p className={`font-display text-2xl font-bold ${currentRank.color}`}>
                    {currentRank.name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">PONTOS</span>
                  <p className="font-display text-2xl font-bold text-primary">
                    {user?.rank_points || 0}
                  </p>
                </div>
              </div>

              {nextRank && (
                <div className="space-y-2">
                  <Progress value={progressToNext} className="h-3 bg-white/10" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{currentRank.name}</span>
                    <span>
                      {nextRank.min - user.rank_points} pontos para {nextRank.name}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="text-xs text-muted-foreground">MISSÕES</span>
                </div>
                <p className="text-3xl font-display font-bold text-primary">
                  {user?.missions_completed || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">concluídas</p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-cyber-orange" />
                  <span className="text-xs text-muted-foreground">DENÚNCIAS</span>
                </div>
                <p className="text-3xl font-display font-bold text-cyber-orange">
                  {user?.reports_submitted || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">enviadas</p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-accent" />
                  <span className="text-xs text-muted-foreground">BADGES</span>
                </div>
                <p className="text-3xl font-display font-bold text-accent">
                  {userBadges.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">conquistados</p>
              </div>
            </div>

            {/* Rank Tiers */}
            <div className="mt-8">
              <p className="text-xs text-muted-foreground mb-4 tracking-wider">
                NÍVEIS DE RANKING
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {rankTiers.map((tier) => (
                  <div
                    key={tier.name}
                    className={`p-3 border text-center ${
                      tier.name === currentRank.name
                        ? "border-primary bg-primary/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <p className={`text-xs font-bold ${tier.color}`}>{tier.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tier.min}+ pts
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges Section */}
      <Card className="hud-panel border-white/10">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="font-display text-lg tracking-wider flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            CONQUISTAS & BADGES
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loadingBadges ? (
            <div className="text-center text-muted-foreground py-8">
              Carregando badges...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {badges.map((badge) => {
                const isEarned = earnedBadgeIds.includes(badge.id);
                const IconComponent = badgeIcons[badge.icon] || Award;
                
                return (
                  <div
                    key={badge.id}
                    className={`p-4 border text-center transition-all ${
                      isEarned
                        ? "border-accent bg-accent/10"
                        : "border-white/10 bg-white/5 opacity-40"
                    }`}
                  >
                    <IconComponent
                      className={`w-8 h-8 mx-auto mb-2 ${
                        isEarned ? "text-accent" : "text-muted-foreground"
                      }`}
                    />
                    <p className={`text-sm font-bold ${isEarned ? "text-white" : "text-muted-foreground"}`}>
                      {badge.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {badge.description}
                    </p>
                    {!isEarned && (
                      <p className="text-xs text-accent mt-2">
                        {badge.requirement_value} {badge.requirement_type}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points Guide */}
      <Card className="hud-panel border-white/10">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="font-display text-lg tracking-wider">
            COMO GANHAR PONTOS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/20 border border-primary/50">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-white">Completar Missão</p>
                <p className="text-primary font-display text-xl">+100 pontos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Por cada missão concluída com sucesso
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-cyber-orange/20 border border-cyber-orange/50">
                <AlertTriangle className="w-6 h-6 text-cyber-orange" />
              </div>
              <div>
                <p className="font-bold text-white">Enviar Denúncia</p>
                <p className="text-cyber-orange font-display text-xl">+10 pontos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Por cada denúncia enviada
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-secondary/20 border border-secondary/50">
                <Trophy className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="font-bold text-white">Bônus de Rank</p>
                <p className="text-secondary font-display text-xl">Variável</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Bônus especiais por conquistas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
