import { useGetQueryHistory } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2 } from "lucide-react"

export default function HistoryLog() {
  const { data, isLoading } = useGetQueryHistory({ limit: 50 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Histórico do Sistema</h1>
        <p className="text-muted-foreground mt-1">Registro de todas as consultas realizadas via WhatsApp ou Painel.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
               <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Data/Hora</th>
                    <th className="px-6 py-4 font-semibold">Tipo</th>
                    <th className="px-6 py-4 font-semibold">Código Pesquisado</th>
                    <th className="px-6 py-4 font-semibold">Telefone Solicitante</th>
                    <th className="px-6 py-4 font-semibold">Resultado Sintético</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data?.items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 text-muted-foreground">
                        {format(new Date(item.createdAt), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={item.queryType === 'op' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                          {item.queryType}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium">{item.queryValue}</td>
                      <td className="px-6 py-4">{item.phoneNumber || 'Painel Web'}</td>
                      <td className="px-6 py-4">
                        <div className="max-w-[350px] truncate" title={item.result}>
                           {item.result}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!data?.items || data.items.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        Nenhum registro encontrado no banco de dados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
