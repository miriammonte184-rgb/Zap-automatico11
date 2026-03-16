import { useDashboardData, useWhatsAppConnection, useSpreadsheetManager, useWhitelistManager } from "@/hooks/use-zapauto"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, FileSpreadsheet, Activity, Users, ArrowUpRight, Package, Factory, Shield } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function Dashboard() {
  const { stats, history, isLoading } = useDashboardData()
  const { status: waStatus } = useWhatsAppConnection()
  const { status: sheetStatus, stats: sheetStats } = useSpreadsheetManager()
  const { total: whitelistTotal } = useWhitelistManager()

  const mockTrendData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const base = stats ? Math.max(2, Math.floor(stats.queriesLast24h / 2)) : 5;
    return {
      date: format(d, 'dd/MM', { locale: ptBR }),
      consultas: base + Math.floor(Math.random() * base)
    };
  });

  const pieData = [
    { name: 'Ordens de Produção', value: stats?.opQueries || 0, color: 'hsl(var(--primary))' },
    { name: 'Materiais', value: stats?.materialQueries || 0, color: 'hsl(var(--accent))' },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
  }

  return (
    <>
      {/* Row 1 — Activity Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Consultas (24h)</p>
                <p className="text-3xl font-display font-bold">{stats?.queriesLast24h ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-muted-foreground">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              <span>Total: {stats?.totalQueries ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Usuários Únicos</p>
                <p className="text-3xl font-display font-bold">{stats?.uniqueUsers ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/50 flex items-center justify-center text-accent-foreground">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-3.5 h-3.5" />
              <span>{whitelistTotal > 0 ? `${whitelistTotal} autorizados` : "Ninguém autorizado"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
                <p className="text-xl font-display font-semibold">
                  {waStatus?.connected ? 'Conectado' : 'Desconectado'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${waStatus?.connected ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <Badge variant={waStatus?.connected ? "success" : "destructive"}>
                {waStatus?.connected ? waStatus.phone ? `+${waStatus.phone}` : 'Ativo' : 'Requer ação'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Planilha BD</p>
                <p className="text-xl font-display font-semibold">
                  {sheetStatus?.loaded ? `${sheetStatus.rowCount.toLocaleString('pt-BR')} linhas` : 'Vazia'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center text-warning-foreground">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground truncate">
              {sheetStatus?.fileName || 'Nenhum arquivo carregado'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 — Planilha Stats */}
      {sheetStats?.loaded && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/60 dark:border-blue-800/40">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Materiais distintos</p>
                <p className="text-2xl font-bold">{sheetStats.totalMaterials.toLocaleString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/60 dark:border-purple-800/40">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <Factory className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">OPs na base</p>
                <p className="text-2xl font-bold">{sheetStats.totalOps.toLocaleString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200/60 dark:border-green-800/40">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Linhas após filtro</p>
                <p className="text-2xl font-bold">{sheetStats.totalRows.toLocaleString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Row 3 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Volume de Consultas (últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="consultas" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorConsultas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipos de Consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4 — Recent History */}
      <Card>
        <CardHeader>
          <CardTitle>Consultas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-6 py-4 font-semibold rounded-tl-lg">Data/Hora</th>
                  <th className="px-6 py-4 font-semibold">Tipo</th>
                  <th className="px-6 py-4 font-semibold">Código</th>
                  <th className="px-6 py-4 font-semibold">Telefone</th>
                  <th className="px-6 py-4 font-semibold rounded-tr-lg">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {history?.items.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{format(new Date(item.createdAt), "dd/MM HH:mm")}</td>
                    <td className="px-6 py-4">
                      <Badge variant={item.queryType === 'op' ? 'default' : 'secondary'}>
                        {item.queryType.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono">{item.queryValue}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.phoneNumber?.replace('@c.us', '') || 'Painel'}</td>
                    <td className="px-6 py-4">
                      <span className="truncate block max-w-[250px]">{item.result}</span>
                    </td>
                  </tr>
                ))}
                {(!history?.items || history.items.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      Nenhuma consulta registrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
