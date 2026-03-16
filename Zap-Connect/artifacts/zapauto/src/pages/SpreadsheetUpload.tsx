import { useState, useRef } from "react"
import { useSpreadsheetManager } from "@/hooks/use-zapauto"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UploadCloud, FileType, CheckCircle, AlertCircle, Loader2, FileSpreadsheet, Package, Factory, Table2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function SpreadsheetUpload() {
  const { status, stats, isLoading, upload, isUploading, uploadError } = useSpreadsheetManager()
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  const handleFile = (file: File) => {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      setSelectedFile(file)
    } else {
      alert("Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV.")
    }
  }

  const handleUpload = () => {
    if (selectedFile) {
      upload(selectedFile)
      setSelectedFile(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top row: upload + status */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Atualizar Base de Dados</CardTitle>
              <CardDescription>Faça upload da planilha SD4 atualizada para o sistema consultar.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-200 ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input ref={inputRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleChange} />
                <div className="w-16 h-16 bg-background rounded-full shadow-sm flex items-center justify-center mb-4">
                  <UploadCloud className={`w-8 h-8 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">
                  {selectedFile ? selectedFile.name : "Arraste o arquivo ou clique"}
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
                  {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "Suporta apenas arquivos Excel (.xlsx, .xls)"}
                </p>
                {selectedFile ? (
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setSelectedFile(null)} disabled={isUploading}>Cancelar</Button>
                    <Button onClick={handleUpload} disabled={isUploading} className="min-w-[120px]">
                      {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {isUploading ? "Enviando..." : "Fazer Upload"}
                    </Button>
                  </div>
                ) : (
                  <Button variant="secondary" onClick={() => inputRef.current?.click()}>
                    Selecionar Arquivo
                  </Button>
                )}
              </div>

              {uploadError && (
                <div className="mt-4 p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>Erro ao processar arquivo. Verifique se o formato está correto (Aba SD4).</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Status da Planilha</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Carregando status...</span>
                </div>
              ) : status?.loaded ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-4 bg-success/10 p-4 rounded-xl border border-success/20">
                    <CheckCircle className="w-8 h-8 text-success" />
                    <div>
                      <h4 className="font-semibold text-success-foreground">Banco Carregado</h4>
                      <p className="text-sm text-success-foreground/80">Sistema pronto para consultas</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground text-sm flex items-center gap-2">
                        <FileType className="w-4 h-4" /> Arquivo
                      </span>
                      <span className="font-medium text-sm truncate max-w-[150px]" title={status.fileName || ''}>
                        {status.fileName || 'Dados internos'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground text-sm flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" /> Total de Linhas
                      </span>
                      <Badge variant="secondary">{status.rowCount.toLocaleString('pt-BR')}</Badge>
                    </div>
                    {stats && (
                      <>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-muted-foreground text-sm flex items-center gap-2">
                            <Package className="w-4 h-4" /> Materiais Distintos
                          </span>
                          <Badge variant="outline">{stats.totalMaterials.toLocaleString('pt-BR')}</Badge>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-muted-foreground text-sm flex items-center gap-2">
                            <Factory className="w-4 h-4" /> OPs na Base
                          </span>
                          <Badge variant="outline">{stats.totalOps.toLocaleString('pt-BR')}</Badge>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground text-sm">Última Atualização</span>
                      <span className="font-medium text-sm">
                        {status.lastUpdated ? format(new Date(status.lastUpdated), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhuma base de dados carregada.</p>
                  <p className="text-sm mt-1">O sistema não poderá responder consultas.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview table */}
      {stats?.previewRows && stats.previewRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table2 className="w-5 h-5" /> Prévia dos Dados (primeiras {stats.previewRows.length} linhas após filtro)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Código Material</th>
                    <th className="px-4 py-3 font-semibold">Descrição</th>
                    <th className="px-4 py-3 font-semibold">OP</th>
                    <th className="px-4 py-3 font-semibold text-right">Empenho</th>
                    <th className="px-4 py-3 font-semibold text-right">Estoque</th>
                    <th className="px-4 py-3 font-semibold">Data Plano</th>
                    <th className="px-4 py-3 font-semibold">Pedido</th>
                    <th className="px-4 py-3 font-semibold">Previsão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {stats.previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-mono font-medium">{row.materialCode}</td>
                      <td className="px-4 py-2.5 max-w-[180px] truncate" title={row.description}>{row.description}</td>
                      <td className="px-4 py-2.5 font-mono">{row.opCode}</td>
                      <td className="px-4 py-2.5 text-right">{row.empenhQty}</td>
                      <td className="px-4 py-2.5 text-right">
                        <Badge variant={row.currentStock > 0 ? "success" : "destructive"} className="text-xs">
                          {row.currentStock}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.planDateStr}</td>
                      <td className="px-4 py-2.5">{row.purchaseOrderQty}</td>
                      <td className="px-4 py-2.5 text-primary">{row.expectedArrival}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
