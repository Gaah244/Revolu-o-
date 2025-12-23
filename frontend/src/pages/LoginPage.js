import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { Shield, Lock, Mail, User, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    role: "externo",
  });

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success("Login realizado com sucesso!");
      } else {
        await register(
          formData.email,
          formData.password,
          formData.username,
          formData.role
        );
        toast.success("Conta criada com sucesso!");
      }
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Erro ao processar solicitação"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cyber-black flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(3, 3, 3, 0.95), rgba(3, 3, 3, 0.95)), url('https://images.pexels.com/photos/3825302/pexels-photo-3825302.jpeg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 border border-primary/50 mb-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold text-primary glow-text tracking-widest">
            THE ADMINS
          </h1>
          <p className="text-muted-foreground text-sm mt-2 tracking-wider">
            CYBERSECURITY MISSION SYSTEM
          </p>
        </div>

        {/* Form Card */}
        <div className="hud-panel p-8">
          <div className="flex mb-6">
            <button
              data-testid="login-tab"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-bold tracking-widest transition-all ${
                isLogin
                  ? "bg-primary/10 text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              LOGIN
            </button>
            <button
              data-testid="register-tab"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-bold tracking-widest transition-all ${
                !isLogin
                  ? "bg-primary/10 text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              REGISTRO
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs tracking-wider text-muted-foreground">
                  NOME DE USUÁRIO
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    data-testid="username-input"
                    type="text"
                    placeholder="seu_username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="pl-10 input-terminal rounded-none"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs tracking-wider text-muted-foreground">
                EMAIL
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  data-testid="email-input"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="pl-10 input-terminal rounded-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs tracking-wider text-muted-foreground">
                SENHA
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  data-testid="password-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10 pr-10 input-terminal rounded-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs tracking-wider text-muted-foreground">
                  TIPO DE CONTA
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger data-testid="role-select" className="input-terminal rounded-none">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-surface border-white/10">
                    <SelectItem value="externo">Usuário Externo (Denúncias)</SelectItem>
                    <SelectItem value="soldado">Soldado (Membro)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Contas de membros requerem aprovação do admin
                </p>
              </div>
            )}

            <Button
              type="submit"
              data-testid="submit-btn"
              disabled={loading}
              className="w-full btn-cyber py-6 rounded-none"
            >
              {loading ? (
                <span className="animate-pulse">PROCESSANDO...</span>
              ) : isLogin ? (
                "ACESSAR SISTEMA"
              ) : (
                "CRIAR CONTA"
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 tracking-wider">
          SISTEMA SEGURO • CRIPTOGRAFIA AES-256
        </p>
      </div>
    </div>
  );
}
