import { useState } from "react"
import { useQueryByOp, useQueryByMaterial } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Package, Layers, AlertTriangle, CheckCircle2, Loader2, Calendar, ShoppingCart, Factory } from "lucide-react"

export default function ManualQuery() {
  const [queryType, setQueryType] = useState<'op' | 'material'>('op')
  const [inputValue, setInputValue] = useState('')
  const [activeQuery, setActiveQuery] = useState('')

  const opQuery = useQueryByOp(queryType === 'op' ? activeQuery : '', { query: { enabled: queryType === 'op' && !!activeQuery, retry: false } })
  const materialQuery = useQueryByMaterial(queryType === 'material' ? activeQuery : '', { query: { enabled: queryType === 'material' && !!activeQuery, retry: false } })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      setActiveQuery(inputValue.trim())
    }
  }

  const isLoading = opQuery.isLoading || materialQuery.isLoading
  const error = opQuery.error || materialQuery.error

  const NUMBER_EMOJIS = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Consulta Manual</CardTitle>
          <CardDescription>Consulte OPs ou materiais diretamente pela interface do painel.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex p-1 bg-muted/50 rounded-xl w-fit mb-6">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${queryType === 'op' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => { setQueryType('op'); setActiveQuery(''); setInputValue(''); }}
            >
              Ordem de Produção (OP)
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${queryType === 'material' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => { setQueryType('material'); setActiveQuery(''); setInputValue(''); }}
            >
              Código do Material
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={queryType === 'op' ? "Ex: 123456" : "Ex: 0000001870"}
                className="pl-10 h-12 text-base font-mono"
              />
            </div>
            <Button type="submit" size="lg" disabled={!inputValue.trim() || isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Consultar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {activeQuery && !isLoading && !error && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">

          {/* OP Result */}
          {queryType === 'op' && opQuery.data && (
            <Card className="border-t-4 border-t-primary">
              <CardHeader className="flex flex-row items-start justify-between pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    OP: <span className="font-mono bg-muted px-2 py-1 rounded-md">{opQuery.data.opCode}</span>
                  </CardTitle>
                </div>
                {opQuery.data.found ? (
                  <Badge variant={opQuery.data.hasMissingMaterials ? "destructive" : "success"} className="text-sm px-3 py-1">
                    {opQuery.data.hasMissingMaterials ? `${opQuery.data.missingMaterials.length} em falta` : "Completa ✓"}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Não Encontrada</Badge>
                )}
              </CardHeader>

              {opQuery.data.found && opQuery.data.hasMissingMaterials && (
                <div className="px-6 pb-6">
                  <div className="bg-destructive/5 border border-destructive/20 rounded-xl overflow-hidden">
                    <div className="bg-destructive/10 px-4 py-3 flex items-center gap-2 border-b border-destructive/20 text-destructive-foreground font-semibold">
                      <AlertTriangle className="w-4 h-4" /> Materiais em Falta ({opQuery.data.missingMaterials.length})
                    </div>
                    <ul className="divide-y divide-destructive/10">
                      {opQuery.data.missingMaterials.map((mat, idx) => (
                        <li key={idx} className="p-4 hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <span className="text-base mt-0.5">{NUMBER_EMOJIS[idx] ?? `${idx+1}.`}</span>
                              <div>
                                <span className="font-mono text-sm font-bold text-foreground">{mat.materialCode}</span>
                                <p className="text-sm text-muted-foreground mt-0.5">{mat.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                              <div className="bg-destructive/10 border border-destructive/20 px-3 py-1.5 rounded-lg text-center min-w-[80px]">
                                <span className="text-[10px] uppercase text-muted-foreground font-semibold block">📦 Falta</span>
                                <span className="font-bold text-destructive">{mat.qtdFalta}</span>
                              </div>
                              <div className="bg-background border px-3 py-1.5 rounded-lg text-center min-w-[80px]">
                                <span className="text-[10px] uppercase text-muted-foreground font-semibold block">🛒 Pedido</span>
                                <span className="font-medium">{mat.purchaseOrderQty || '—'}</span>
                              </div>
                              <div className="bg-background border px-3 py-1.5 rounded-lg text-center min-w-[90px]">
                                <span className="text-[10px] uppercase text-muted-foreground font-semibold block">📅 Previsão</span>
                                <span className="font-medium text-primary">{mat.expectedArrival || '—'}</span>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {opQuery.data.found && !opQuery.data.hasMissingMaterials && (
                <div className="px-6 pb-6">
                  <div className="flex flex-col items-center justify-center py-8 text-success bg-success/5 rounded-xl border border-success/20">
                    <CheckCircle2 className="w-12 h-12 mb-3" />
                    <p className="text-lg font-medium text-success-foreground">Todos os materiais disponíveis!</p>
                    <p className="text-sm text-success-foreground/70 mt-1">Nenhuma falta identificada para esta OP.</p>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Material Result */}
          {queryType === 'material' && materialQuery.data && (
            <Card className="border-t-4 border-t-accent">
              <CardHeader className="flex flex-row items-start justify-between pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-accent" />
                    Material: <span className="font-mono bg-muted px-2 py-1 rounded-md">{materialQuery.data.materialCode}</span>
                  </CardTitle>
                  {materialQuery.data.description && (
                    <CardDescription className="text-base mt-2">{materialQuery.data.description}</CardDescription>
                  )}
                </div>
                {!materialQuery.data.found && <Badge variant="secondary">Não Encontrado</Badge>}
              </CardHeader>

              {materialQuery.data.found && (
                <CardContent className="space-y-6">
                  {/* Stock info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border bg-card flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Estoque Atual</p>
                        <p className="text-xl font-bold">{materialQuery.data.currentStock ?? 0}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border bg-card flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pedido de Compra</p>
                        <p className="text-xl font-bold">{materialQuery.data.purchaseOrderQty || '—'}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border bg-accent/5 border-accent/20 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Previsão Chegada</p>
                        <p className="text-lg font-bold">{materialQuery.data.expectedArrival || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* OPs using this material */}
                  {materialQuery.data.opsUsing && materialQuery.data.opsUsing.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-muted-foreground uppercase tracking-wide">
                        <Factory className="w-4 h-4" /> OPs que utilizam este material
                      </h4>
                      <div className="rounded-xl border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-4 py-2.5 text-left font-semibold text-xs text-muted-foreground uppercase">Código OP</th>
                              <th className="px-4 py-2.5 text-right font-semibold text-xs text-muted-foreground uppercase">Empenho</th>
                              <th className="px-4 py-2.5 text-right font-semibold text-xs text-muted-foreground uppercase">Data Plano</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {materialQuery.data.opsUsing.map((op, idx) => (
                              <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-2.5 font-mono font-medium">{op.opCode}</td>
                                <td className="px-4 py-2.5 text-right">{op.empenhQty}</td>
                                <td className="px-4 py-2.5 text-right text-muted-foreground">{op.planDateStr}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
          <p className="font-medium flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Erro na consulta</p>
          <p className="text-sm mt-1 opacity-90">Não foi possível buscar as informações. Verifique se a planilha está carregada.</p>
        </div>
      )}
    </div>
  )
}
