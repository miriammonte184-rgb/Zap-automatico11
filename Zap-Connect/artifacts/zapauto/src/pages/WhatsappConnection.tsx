import { useState } from "react"
import { useWhatsAppConnection, useWhitelistManager } from "@/hooks/use-zapauto"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Smartphone, WifiOff, Loader2, CheckCircle2, QrCode, Shield, Plus, Trash2, Users } from "lucide-react"
import { motion } from "framer-motion"

export default function WhatsappConnection() {
  const { status, qrCode, isLoading, isQrLoading, connect, isConnecting, disconnect, isDisconnecting } = useWhatsAppConnection()
  const { whitelist, total, isLoading: isListLoading, add, isAdding, remove } = useWhitelistManager()
  const [newPhone, setNewPhone] = useState("")
  const [addMsg, setAddMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPhone.trim()) return
    try {
      const res = await add(newPhone.trim())
      setAddMsg({ text: res.message ?? "Adicionado!", ok: res.success ?? true })
      if (res.success) setNewPhone("")
    } catch {
      setAddMsg({ text: "Erro ao adicionar número.", ok: false })
    }
    setTimeout(() => setAddMsg(null), 4000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* QR / Connection card */}
      <div className="lg:col-span-3">
        <Card className="border-t-4 border-t-primary shadow-xl h-full">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Conexão WhatsApp</CardTitle>
            <CardDescription className="text-base mt-2">
              Conecte seu aparelho para que o sistema responda automaticamente às consultas.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center py-8 min-h-[280px] justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center text-muted-foreground space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p>Verificando status...</p>
              </div>
            ) : status?.connected ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <div className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center border-8 border-green-500/20">
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Conectado com Sucesso</h3>
                  <p className="text-muted-foreground mt-2 text-lg">{status.phone ? `+${status.phone}` : status.name}</p>
                  {status.name && status.phone && (
                    <p className="text-sm text-muted-foreground">{status.name}</p>
                  )}
                </div>
              </motion.div>
            ) : status?.status === 'qr_ready' ? (
              <div className="flex flex-col items-center space-y-6 w-full">
                <div className="bg-white p-4 rounded-2xl shadow-inner border-2 border-border w-[260px] h-[260px] flex items-center justify-center relative overflow-hidden">
                  {isQrLoading || !qrCode ? (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <span className="text-sm text-gray-500">Gerando QR Code...</span>
                    </div>
                  ) : (
                    <motion.img 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      src={qrCode} 
                      alt="WhatsApp QR Code" 
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div className="text-center max-w-sm">
                  <p className="font-medium text-foreground mb-1">Escaneie o código acima</p>
                  <p className="text-sm text-muted-foreground">
                    Abra o WhatsApp → Menu → Aparelhos Conectados → Conectar Aparelho
                  </p>
                </div>
              </div>
            ) : status?.status === 'connecting' ? (
              <div className="flex flex-col items-center text-center space-y-4">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <div>
                  <h3 className="text-lg font-medium text-foreground">Iniciando conexão...</h3>
                  <p className="text-sm text-muted-foreground mt-1">Aguarde enquanto preparamos o QR code.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                  <WifiOff className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">Desconectado</h3>
                  <p className="text-sm text-muted-foreground mt-1">Clique no botão abaixo para gerar o QR code de conexão.</p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-center bg-muted/30 border-t p-6">
            {status?.connected ? (
              <Button 
                variant="destructive" 
                size="lg" 
                onClick={() => disconnect()}
                disabled={isDisconnecting}
                className="min-w-[200px]"
              >
                {isDisconnecting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <WifiOff className="w-5 h-5 mr-2" />}
                Desconectar Aparelho
              </Button>
            ) : status?.status === 'qr_ready' ? (
              <p className="text-xs text-muted-foreground flex items-center">
                <Loader2 className="w-3 h-3 animate-spin mr-2" />
                Aguardando leitura do código... O QR code expira em alguns minutos.
              </p>
            ) : status?.status === 'connecting' ? (
              <p className="text-xs text-muted-foreground flex items-center">
                <Loader2 className="w-3 h-3 animate-spin mr-2" />
                Carregando...
              </p>
            ) : (
              <Button 
                size="lg" 
                onClick={() => connect()}
                disabled={isConnecting}
                className="min-w-[200px]"
              >
                {isConnecting 
                  ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Iniciando...</>
                  : <><QrCode className="w-5 h-5 mr-2" />Gerar QR Code</>
                }
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Whitelist card */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-t-4 border-t-amber-400">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="w-5 h-5 text-amber-500" />
                Números Autorizados
              </CardTitle>
              <Badge variant="secondary" className="gap-1">
                <Users className="w-3 h-3" />
                {total}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {total === 0
                ? "🔒 Whitelist vazia — o sistema não responde a ninguém."
                : "O sistema responde apenas aos números abaixo."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={handleAdd} className="flex gap-2">
              <Input
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="+55119XXXXXXXX"
                className="h-9 text-sm font-mono"
              />
              <Button type="submit" size="sm" disabled={isAdding || !newPhone.trim()} className="shrink-0">
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </form>

            {addMsg && (
              <p className={`text-xs px-2 py-1 rounded ${addMsg.ok ? 'text-green-700 bg-green-50 border border-green-200' : 'text-red-700 bg-red-50 border border-red-200'}`}>
                {addMsg.text}
              </p>
            )}

            <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
              {isListLoading ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm">Carregando...</span>
                </div>
              ) : whitelist.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Shield className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>Nenhum número cadastrado.</p>
                  <p className="text-xs mt-1">Adicione números acima para restringir o acesso.</p>
                </div>
              ) : (
                whitelist.map((phone, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors group">
                    <span className="font-mono text-sm">+{phone}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => remove(phone)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground text-sm">Como funciona:</p>
            <p>• Mensagens de grupos são sempre ignoradas</p>
            <p>• Se a lista estiver vazia, nenhum número pode consultar</p>
            <p>• Adicione apenas números no formato com DDI (+55...)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
