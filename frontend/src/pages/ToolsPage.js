import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { toast } from "sonner";
import {
  Wrench,
  Plus,
  Link,
  FileCode,
  Download,
  Trash2,
  Filter,
  ExternalLink,
  Shield,
  Bug,
  Skull,
  Eye,
  Code,
  Terminal,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const toolCategories = [
  { value: "trojan", label: "Trojans", icon: Skull, color: "text-destructive" },
  { value: "spyware", label: "Spywares", icon: Eye, color: "text-cyber-orange" },
  { value: "scanner", label: "Scanners", icon: Shield, color: "text-primary" },
  { value: "exploit", label: "Exploits", icon: Bug, color: "text-accent" },
  { value: "utility", label: "Utilitários", icon: Wrench, color: "text-secondary" },
  { value: "script", label: "Scripts", icon: Code, color: "text-primary" },
  { value: "outros", label: "Outros", icon: Terminal, color: "text-muted-foreground" },
];

const ToolCard = ({ tool, onDelete, isAdmin }) => {
  const category = toolCategories.find((c) => c.value === tool.category);
  const Icon = category?.icon || Wrench;

  return (
    <Card className="hud-panel border-white/10 hover:border-primary/30 transition-all animate-fade-in group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 bg-white/5 border border-white/10 ${category?.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-lg font-bold text-white truncate">
                  {tool.name}
                </h3>
                {tool.is_file && (
                  <Badge variant="outline" className="text-xs border-accent text-accent">
                    ARQUIVO
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {tool.description}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline" className={`category-badge ${category?.color} border-current`}>
                  {category?.label || tool.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(tool.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {tool.url && (
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/5 border border-white/10 hover:border-primary/50 hover:text-primary transition-all"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {tool.is_file && (
              <button className="p-2 bg-white/5 border border-white/10 hover:border-secondary/50 hover:text-secondary transition-all">
                <Download className="w-4 h-4" />
              </button>
            )}
            {isAdmin && (
              <button
                data-testid={`delete-tool-${tool.id}`}
                onClick={() => onDelete(tool.id)}
                className="p-2 bg-white/5 border border-white/10 hover:border-destructive/50 hover:text-destructive transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ToolsPage() {
  const { isAdmin } = useAuth();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isFileUpload, setIsFileUpload] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    url: "",
  });

  const fetchTools = async () => {
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      const response = await api.getTools(params);
      setTools(response.data);
    } catch (error) {
      console.error("Error fetching tools:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, [categoryFilter]);

  const handleCreateTool = async (e) => {
    e.preventDefault();
    try {
      await api.createTool({
        ...formData,
        is_file: false,
      });
      toast.success("Ferramenta adicionada com sucesso!");
      setDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        category: "",
        url: "",
      });
      fetchTools();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao adicionar ferramenta");
    }
  };

  const handleDeleteTool = async (toolId) => {
    if (!window.confirm("Tem certeza que deseja excluir esta ferramenta?")) return;

    try {
      await api.deleteTool(toolId);
      toast.success("Ferramenta excluída!");
      fetchTools();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao excluir ferramenta");
    }
  };

  const groupedTools = toolCategories.reduce((acc, cat) => {
    acc[cat.value] = tools.filter((t) => t.category === cat.value);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary glow-text font-display text-xl animate-pulse">
          CARREGANDO FERRAMENTAS...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tools-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wider flex items-center gap-3">
            <Wrench className="w-8 h-8 text-primary" />
            FERRAMENTAS
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Arsenal de ferramentas para operações
          </p>
        </div>

        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-tool-btn" className="btn-cyber rounded-none">
                <Plus className="w-4 h-4 mr-2" />
                ADICIONAR FERRAMENTA
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-cyber-surface border-white/10 max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display text-xl tracking-wider text-primary">
                  NOVA FERRAMENTA
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="link" className="mt-4">
                <TabsList className="grid w-full grid-cols-2 bg-white/5">
                  <TabsTrigger
                    value="link"
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Via Link
                  </TabsTrigger>
                  <TabsTrigger
                    value="upload"
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                    disabled
                  >
                    <FileCode className="w-4 h-4 mr-2" />
                    Upload
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="link" className="mt-4">
                  <form onSubmit={handleCreateTool} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground">
                        NOME
                      </Label>
                      <Input
                        data-testid="tool-name-input"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="input-terminal rounded-none"
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
                        <SelectTrigger data-testid="tool-category-select" className="input-terminal rounded-none">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-cyber-surface border-white/10">
                          {toolCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <span className="flex items-center gap-2">
                                <cat.icon className={`w-4 h-4 ${cat.color}`} />
                                {cat.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground">
                        URL
                      </Label>
                      <Input
                        data-testid="tool-url-input"
                        type="url"
                        value={formData.url}
                        onChange={(e) =>
                          setFormData({ ...formData, url: e.target.value })
                        }
                        className="input-terminal rounded-none"
                        placeholder="https://..."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground">
                        DESCRIÇÃO
                      </Label>
                      <Textarea
                        data-testid="tool-description-input"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        className="input-terminal rounded-none min-h-[80px]"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      data-testid="submit-tool-btn"
                      className="w-full btn-cyber rounded-none"
                    >
                      ADICIONAR FERRAMENTA
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="flex flex-wrap gap-2 bg-transparent h-auto p-0">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-white/10 rounded-none"
          >
            TODAS ({tools.length})
          </TabsTrigger>
          {toolCategories.map((cat) => (
            <TabsTrigger
              key={cat.value}
              value={cat.value}
              className={`data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-white/10 rounded-none`}
            >
              <cat.icon className={`w-4 h-4 mr-2 ${cat.color}`} />
              {cat.label} ({groupedTools[cat.value]?.length || 0})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {tools.length > 0 ? (
            tools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onDelete={handleDeleteTool}
                isAdmin={isAdmin}
              />
            ))
          ) : (
            <Card className="hud-panel border-white/10">
              <CardContent className="p-12 text-center">
                <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma ferramenta cadastrada</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {toolCategories.map((cat) => (
          <TabsContent key={cat.value} value={cat.value} className="space-y-4">
            {groupedTools[cat.value]?.length > 0 ? (
              groupedTools[cat.value].map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onDelete={handleDeleteTool}
                  isAdmin={isAdmin}
                />
              ))
            ) : (
              <Card className="hud-panel border-white/10">
                <CardContent className="p-12 text-center">
                  <cat.icon className={`w-12 h-12 mx-auto mb-4 ${cat.color} opacity-30`} />
                  <p className="text-muted-foreground">
                    Nenhuma ferramenta em {cat.label}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
