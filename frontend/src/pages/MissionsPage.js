import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { toast } from "sonner";
import {
  Target,
  Plus,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";

const categories = [
  { value: "golpe", label: "Golpe" },
  { value: "fraude", label: "Fraude" },
  { value: "phishing", label: "Phishing" },
  { value: "malware", label: "Malware" },
  { value: "grupo_whatsapp", label: "Grupo WhatsApp" },
  { value: "conteudo_ilegal", label: "Conteúdo Ilegal" },
  { value: "trojan", label: "Trojan" },
  { value: "spyware", label: "Spyware" },
  { value: "apk_malicioso", label: "APK Malicioso" },
  { value: "outros", label: "Outros" },
];

const priorities = [
  { value: "low", label: "Baixa", color: "text-secondary" },
  { value: "medium", label: "Média", color: "text-cyber-orange" },
  { value: "high", label: "Alta", color: "text-destructive" },
];

const statusConfig = {
  pending: { label: "PENDENTE", color: "bg-cyber-orange/20 text-cyber-orange border-cyber-orange" },
  in_progress: { label: "EM PROGRESSO", color: "bg-secondary/20 text-secondary border-secondary" },
  completed: { label: "CONCLUÍDA", color: "bg-primary/20 text-primary border-primary" },
  failed: { label: "FALHOU", color: "bg-destructive/20 text-destructive border-destructive" },
};

const MissionCard = ({ mission, onAccept, onComplete, currentUser }) => {
  const isAssigned = mission.assigned_to === currentUser?.id;
  const canAccept = mission.status === "pending" && currentUser?.role !== "externo";
  const canComplete = mission.status === "in_progress" && isAssigned;
  const siteIsDown = mission.site_status === 0 || mission.site_status === 404;

  return (
    <Card className="hud-panel border-white/10 hover:border-primary/30 transition-all animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className={statusConfig[mission.status]?.color}
              >
                {statusConfig[mission.status]?.label}
              </Badge>
              <Badge variant="outline" className="category-badge border-white/20">
                {categories.find((c) => c.value === mission.category)?.label || mission.category}
              </Badge>
            </div>

            <h3 className="font-display text-lg font-bold text-white truncate">
              {mission.title}
            </h3>

            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {mission.description}
            </p>

            <div className="flex items-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                <a
                  href={mission.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary hover:underline truncate max-w-[200px]"
                >
                  {mission.target_url}
                </a>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(mission.created_at).toLocaleDateString("pt-BR")}
              </div>
              {mission.assigned_username && (
                <div>
                  Atribuído a: <span className="text-primary">{mission.assigned_username}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Site Status */}
            <div className="flex items-center gap-2">
              {siteIsDown ? (
                <>
                  <div className="status-offline" />
                  <span className="text-xs text-destructive">OFFLINE</span>
                </>
              ) : mission.site_status === 200 ? (
                <>
                  <div className="status-online" />
                  <span className="text-xs text-primary">ONLINE</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                  <span className="text-xs text-muted-foreground">STATUS {mission.site_status}</span>
                </>
              )}
            </div>

            {/* Priority */}
            <Badge
              variant="outline"
              className={`${priorities.find((p) => p.value === mission.priority)?.color} border-current`}
            >
              {priorities.find((p) => p.value === mission.priority)?.label}
            </Badge>

            {/* Actions */}
            <div className="flex gap-2 mt-2">
              {canAccept && (
                <Button
                  data-testid={`accept-mission-${mission.id}`}
                  onClick={() => onAccept(mission.id)}
                  size="sm"
                  className="btn-cyber rounded-none text-xs"
                >
                  ACEITAR
                </Button>
              )}
              {canComplete && (
                <Button
                  data-testid={`complete-mission-${mission.id}`}
                  onClick={() => onComplete(mission.id)}
                  size="sm"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-black rounded-none text-xs"
                  disabled={!siteIsDown}
                >
                  {siteIsDown ? "CONCLUIR" : "SITE ATIVO"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function MissionsPage() {
  const { user, isAdmin } = useAuth();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_url: "",
    category: "",
    priority: "medium",
    evidence: "",
  });

  const canCreateMission = ["admin", "tenente", "elite"].includes(user?.role);

  const fetchMissions = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const response = await api.getMissions(params);
      setMissions(response.data);
    } catch (error) {
      console.error("Error fetching missions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, [statusFilter, categoryFilter]);

  const handleCreateMission = async (e) => {
    e.preventDefault();
    try {
      await api.createMission(formData);
      toast.success("Missão criada com sucesso!");
      setDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        target_url: "",
        category: "",
        priority: "medium",
        evidence: "",
      });
      fetchMissions();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao criar missão");
    }
  };

  const handleAcceptMission = async (missionId) => {
    try {
      await api.acceptMission(missionId);
      toast.success("Missão aceita! Boa sorte, soldado.");
      fetchMissions();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao aceitar missão");
    }
  };

  const handleCompleteMission = async (missionId) => {
    try {
      await api.completeMission(missionId);
      toast.success("Missão concluída! +100 pontos de ranking.");
      fetchMissions();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao concluir missão");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary glow-text font-display text-xl animate-pulse">
          CARREGANDO MISSÕES...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="missions-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wider flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            MISSÕES
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {missions.length} missões encontradas
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filters */}
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}>
            <SelectTrigger data-testid="status-filter" className="w-[140px] input-terminal rounded-none">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-cyber-surface border-white/10">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val === "all" ? "" : val)}>
            <SelectTrigger data-testid="category-filter" className="w-[140px] input-terminal rounded-none">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-cyber-surface border-white/10">
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canCreateMission && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="create-mission-btn" className="btn-cyber rounded-none">
                  <Plus className="w-4 h-4 mr-2" />
                  NOVA MISSÃO
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-cyber-surface border-white/10 max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl tracking-wider text-primary">
                    CRIAR NOVA MISSÃO
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateMission} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-xs tracking-wider text-muted-foreground">
                      TÍTULO
                    </Label>
                    <Input
                      data-testid="mission-title-input"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="input-terminal rounded-none"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs tracking-wider text-muted-foreground">
                      URL DO ALVO
                    </Label>
                    <Input
                      data-testid="mission-url-input"
                      type="url"
                      value={formData.target_url}
                      onChange={(e) =>
                        setFormData({ ...formData, target_url: e.target.value })
                      }
                      className="input-terminal rounded-none"
                      placeholder="https://..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground">
                        CATEGORIA
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category: value })
                        }
                      >
                        <SelectTrigger data-testid="mission-category-select" className="input-terminal rounded-none">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-cyber-surface border-white/10">
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground">
                        PRIORIDADE
                      </Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) =>
                          setFormData({ ...formData, priority: value })
                        }
                      >
                        <SelectTrigger data-testid="mission-priority-select" className="input-terminal rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-cyber-surface border-white/10">
                          {priorities.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs tracking-wider text-muted-foreground">
                      DESCRIÇÃO
                    </Label>
                    <Textarea
                      data-testid="mission-description-input"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="input-terminal rounded-none min-h-[100px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs tracking-wider text-muted-foreground">
                      EVIDÊNCIAS (OPCIONAL)
                    </Label>
                    <Textarea
                      data-testid="mission-evidence-input"
                      value={formData.evidence}
                      onChange={(e) =>
                        setFormData({ ...formData, evidence: e.target.value })
                      }
                      className="input-terminal rounded-none"
                      placeholder="Links de prints, informações adicionais..."
                    />
                  </div>

                  <Button
                    type="submit"
                    data-testid="submit-mission-btn"
                    className="w-full btn-cyber rounded-none"
                  >
                    CRIAR MISSÃO
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Missions List */}
      {missions.length > 0 ? (
        <div className="grid gap-4">
          {missions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onAccept={handleAcceptMission}
              onComplete={handleCompleteMission}
              currentUser={user}
            />
          ))}
        </div>
      ) : (
        <Card className="hud-panel border-white/10">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma missão encontrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
