import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { toast } from "sonner";
import {
  AlertTriangle,
  Plus,
  Globe,
  Clock,
  Check,
  X,
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
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

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

const statusConfig = {
  pending: { label: "PENDENTE", color: "bg-cyber-orange/20 text-cyber-orange border-cyber-orange" },
  accepted: { label: "ACEITA", color: "bg-primary/20 text-primary border-primary" },
  rejected: { label: "REJEITADA", color: "bg-destructive/20 text-destructive border-destructive" },
};

const ReportCard = ({ report, onAccept, onReject, canReview }) => {
  return (
    <Card className="hud-panel border-white/10 hover:border-primary/30 transition-all animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className={statusConfig[report.status]?.color}
              >
                {statusConfig[report.status]?.label}
              </Badge>
              <Badge variant="outline" className="category-badge border-white/20">
                {categories.find((c) => c.value === report.category)?.label || report.category}
              </Badge>
            </div>

            <h3 className="font-display text-lg font-bold text-white truncate">
              {report.title}
            </h3>

            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {report.description}
            </p>

            <div className="flex items-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                <a
                  href={report.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary hover:underline truncate max-w-[200px]"
                >
                  {report.target_url}
                </a>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(report.created_at).toLocaleDateString("pt-BR")}
              </div>
              <div>
                Por: <span className="text-primary">{report.submitted_username}</span>
              </div>
            </div>

            {report.evidence && (
              <div className="mt-3 p-3 bg-white/5 border border-white/10 text-xs">
                <p className="text-muted-foreground mb-1">EVIDÊNCIAS:</p>
                <p className="text-white">{report.evidence}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {canReview && report.status === "pending" && (
            <div className="flex flex-col gap-2">
              <Button
                data-testid={`accept-report-${report.id}`}
                onClick={() => onAccept(report.id)}
                size="sm"
                className="btn-cyber rounded-none text-xs"
              >
                <Check className="w-4 h-4 mr-1" />
                ACEITAR
              </Button>
              <Button
                data-testid={`reject-report-${report.id}`}
                onClick={() => onReject(report.id)}
                size="sm"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-white rounded-none text-xs"
              >
                <X className="w-4 h-4 mr-1" />
                REJEITAR
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_url: "",
    category: "",
    evidence: "",
  });

  const canReview = ["admin", "tenente", "elite"].includes(user?.role);

  const fetchReports = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const response = await api.getReports(params);
      setReports(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleCreateReport = async (e) => {
    e.preventDefault();
    try {
      await api.createReport(formData);
      toast.success("Denúncia enviada com sucesso! +10 pontos de ranking.");
      setDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        target_url: "",
        category: "",
        evidence: "",
      });
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao enviar denúncia");
    }
  };

  const handleAcceptReport = async (reportId) => {
    try {
      await api.acceptReport(reportId);
      toast.success("Denúncia aceita! Missão criada automaticamente.");
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao aceitar denúncia");
    }
  };

  const handleRejectReport = async (reportId) => {
    try {
      await api.rejectReport(reportId);
      toast.success("Denúncia rejeitada.");
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao rejeitar denúncia");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary glow-text font-display text-xl animate-pulse">
          CARREGANDO DENÚNCIAS...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wider flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-cyber-orange" />
            DENÚNCIAS
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {reports.length} denúncias encontradas
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter */}
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}>
            <SelectTrigger data-testid="report-status-filter" className="w-[140px] input-terminal rounded-none">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-cyber-surface border-white/10">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="accepted">Aceita</SelectItem>
              <SelectItem value="rejected">Rejeitada</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-report-btn" className="btn-cyber rounded-none">
                <Plus className="w-4 h-4 mr-2" />
                NOVA DENÚNCIA
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-cyber-surface border-white/10 max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display text-xl tracking-wider text-cyber-orange">
                  CRIAR NOVA DENÚNCIA
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateReport} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs tracking-wider text-muted-foreground">
                    TÍTULO
                  </Label>
                  <Input
                    data-testid="report-title-input"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="input-terminal rounded-none"
                    placeholder="Ex: Site de phishing simulando banco"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs tracking-wider text-muted-foreground">
                    URL DO ALVO
                  </Label>
                  <Input
                    data-testid="report-url-input"
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
                    <SelectTrigger data-testid="report-category-select" className="input-terminal rounded-none">
                      <SelectValue placeholder="Selecione a categoria" />
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
                    DESCRIÇÃO
                  </Label>
                  <Textarea
                    data-testid="report-description-input"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="input-terminal rounded-none min-h-[100px]"
                    placeholder="Descreva o que encontrou..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs tracking-wider text-muted-foreground">
                    EVIDÊNCIAS (OPCIONAL)
                  </Label>
                  <Textarea
                    data-testid="report-evidence-input"
                    value={formData.evidence}
                    onChange={(e) =>
                      setFormData({ ...formData, evidence: e.target.value })
                    }
                    className="input-terminal rounded-none"
                    placeholder="Links de prints, screenshots, informações adicionais..."
                  />
                </div>

                <Button
                  type="submit"
                  data-testid="submit-report-btn"
                  className="w-full btn-cyber rounded-none"
                >
                  ENVIAR DENÚNCIA
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Reports List */}
      {reports.length > 0 ? (
        <div className="grid gap-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onAccept={handleAcceptReport}
              onReject={handleRejectReport}
              canReview={canReview}
            />
          ))}
        </div>
      ) : (
        <Card className="hud-panel border-white/10">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma denúncia encontrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
