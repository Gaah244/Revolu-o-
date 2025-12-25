import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { toast } from "sonner";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  Shield,
  Star,
  Sword,
  Users,
  Image,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";

const roleConfig = {
  admin: { label: "ADMIN", color: "bg-accent/20 text-accent border-accent", icon: Shield },
  tenente: { label: "TENENTE", color: "bg-destructive/20 text-destructive border-destructive", icon: Star },
  elite: { label: "ELITE", color: "bg-secondary/20 text-secondary border-secondary", icon: Sword },
  soldado: { label: "SOLDADO", color: "bg-primary/20 text-primary border-primary", icon: User },
  externo: { label: "EXTERNO", color: "bg-muted/20 text-muted-foreground border-muted-foreground", icon: Users },
  ai: { label: "IA", color: "bg-secondary/20 text-secondary border-secondary", icon: Bot },
};

const ChatMessage = ({ message, isOwn }) => {
  const isAi = message.is_ai;
  const role = roleConfig[message.role] || roleConfig.externo;
  const RoleIcon = role.icon;
  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  return (
    <div
      className={`flex gap-3 ${isOwn && !isAi ? "flex-row-reverse" : ""} animate-fade-in`}
    >
      <div
        className={`w-10 h-10 flex-shrink-0 flex items-center justify-center border ${
          isAi
            ? "bg-secondary/20 border-secondary/50"
            : "bg-primary/20 border-primary/50"
        }`}
      >
        {isAi ? (
          <Bot className="w-5 h-5 text-secondary" />
        ) : (
          <RoleIcon className={`w-5 h-5 ${role.color.includes("text-") ? role.color.split(" ").find(c => c.startsWith("text-")) : "text-primary"}`} />
        )}
      </div>
      <div
        className={`flex-1 max-w-[80%] ${isOwn && !isAi ? "text-right" : ""}`}
      >
        <div className={`flex items-center gap-2 mb-1 ${isOwn && !isAi ? "justify-end" : ""}`}>
          <span
            className={`text-xs font-bold ${
              isAi ? "text-secondary" : "text-primary"
            }`}
          >
            {message.username}
          </span>
          {!isAi && (
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${role.color}`}>
              {role.label}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(message.created_at).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div
          className={`p-4 ${
            isAi
              ? "bg-secondary/10 border border-secondary/30"
              : "bg-white/5 border border-white/10"
          }`}
        >
          {message.image_url && (
            <img 
              src={`${API_BASE}${message.image_url}`}
              alt="Imagem enviada"
              className="max-w-full max-h-64 mb-2 border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.open(`${API_BASE}${message.image_url}`, '_blank')}
            />
          )}
          {message.content && (
            <p className="text-sm text-white whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ChatPage() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const response = await api.getChatMessages(100);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Apenas imagens são permitidas");
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || sending) return;

    setSending(true);
    try {
      if (selectedImage) {
        const formData = new FormData();
        formData.append("file", selectedImage);
        await api.uploadChatImage(formData);
        clearImage();
      }
      
      if (newMessage.trim()) {
        await api.sendMessage(newMessage);
      }
      
      setNewMessage("");
      await fetchMessages();
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const handleAskAI = async () => {
    if (!newMessage.trim() || aiLoading) return;

    setAiLoading(true);
    const question = newMessage;
    setNewMessage("");

    try {
      await api.sendAiMessage(question);
      await fetchMessages();
    } catch (error) {
      toast.error("Erro ao obter resposta da IA");
      setNewMessage(question);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary glow-text font-display text-xl animate-pulse">
          CARREGANDO CHAT...
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col" data-testid="chat-page">
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-display text-3xl font-bold text-white tracking-wider flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-secondary" />
          CHAT DA EQUIPE
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Converse com a equipe, envie provas e peça ajuda à IA
        </p>
      </div>

      {/* Chat Container */}
      <Card className="hud-panel border-white/10 flex-1 flex flex-col overflow-hidden min-h-[500px]">
        <CardHeader className="border-b border-white/10 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-sm tracking-wider flex items-center gap-2">
              <div className="status-online" />
              <span className="text-muted-foreground">{messages.length} mensagens</span>
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-secondary">
              <Sparkles className="w-4 h-4" />
              <span>ARIA - IA Assistente</span>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 p-4 min-h-[400px]">
          <div className="space-y-4 pb-4">
            {messages.length > 0 ? (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwn={message.user_id === user?.id}
                />
              ))
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Nenhuma mensagem ainda</p>
                <p className="text-xs mt-1">Seja o primeiro a enviar!</p>
              </div>
            )}

            {aiLoading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center border bg-secondary/20 border-secondary/50">
                  <Bot className="w-5 h-5 text-secondary animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-secondary">ARIA</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-secondary/20 text-secondary border-secondary">
                      IA
                    </Badge>
                  </div>
                  <div className="p-4 bg-secondary/10 border border-secondary/30">
                    <p className="text-sm text-secondary animate-pulse">
                      Processando resposta...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Image Preview */}
        {imagePreview && (
          <div className="px-4 py-2 border-t border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <img src={imagePreview} alt="Preview" className="h-16 w-auto border border-white/20" />
              <button
                onClick={clearImage}
                className="p-1 text-destructive hover:bg-destructive/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground">{selectedImage?.name}</span>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-white/20 hover:border-primary/50 hover:text-primary rounded-none px-3 h-12"
              title="Enviar imagem"
            >
              <Image className="w-5 h-5" />
            </Button>
            <Input
              data-testid="chat-input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 input-terminal rounded-none h-12 text-base"
              disabled={sending || aiLoading}
            />
            <Button
              type="submit"
              data-testid="send-message-btn"
              disabled={(!newMessage.trim() && !selectedImage) || sending || aiLoading}
              className="btn-cyber rounded-none px-6 h-12"
            >
              <Send className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              data-testid="ask-ai-btn"
              onClick={handleAskAI}
              disabled={!newMessage.trim() || aiLoading}
              variant="outline"
              className="border-secondary text-secondary hover:bg-secondary hover:text-black rounded-none px-6 h-12"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {aiLoading ? "..." : "IA"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Clique no ícone de imagem para enviar provas • Pressione Enter para enviar
          </p>
        </div>
      </Card>
    </div>
  );
}
