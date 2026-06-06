import { useEffect, useState } from 'react'
import { useCompose } from '../hooks/useCompose'
import { BaseTableSelector } from '../components/compose/BaseTableSelector'
import { FilterBuilder } from '../components/compose/FilterBuilder'
import { TemplateSelector } from '../components/compose/TemplateSelector'
import { MarkdownEditor } from '../components/compose/MarkdownEditor'
import { EmailPreview } from '../components/compose/EmailPreview'
import { SendButton } from '../components/compose/SendButton'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Separator } from '../components/ui/separator'
import { Users, Filter, FileText, Mail, Eye, Megaphone, Save, CheckCheck } from 'lucide-react'
import { Button } from '../components/ui/button'
import { RecipientListDialog } from '../components/compose/RecipientListDialog'
import type { ComposeState, Recipient } from '../../../shared/types'

interface Props {
  initial?: ComposeState | null
  onSent: () => void
}

export function Compose({ initial, onSent }: Props) {
  const { compose, setCompose, bases, tables, recipientCount, loading, selectBase, selectTable } = useCompose(initial)
  const [templateHtml, setTemplateHtml] = useState('')
  const [sampleRecipient, setSampleRecipient] = useState<Recipient | null>(null)
  const [draftSaved, setDraftSaved] = useState(false)

  async function handleSaveDraft() {
    const id = compose.draftId ?? crypto.randomUUID()
    const entry = { id, savedAt: new Date().toISOString(), compose: { ...compose, draftId: id } }
    await window.api.saveDraft(entry)
    setCompose(c => ({ ...c, draftId: id }))
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2000)
  }

  async function handleSent() {
    if (compose.draftId) {
      await window.api.deleteDraft(compose.draftId).catch(() => {})
    }
    onSent()
  }

  useEffect(() => {
    if (!compose.templateName) return
    window.api.getTemplate(compose.templateName).then(setTemplateHtml)
  }, [compose.templateName])

  useEffect(() => {
    if (!compose.baseId || !compose.tableId || !compose.emailField) { setSampleRecipient(null); return }
    window.api.fetchSample(compose.baseId, compose.tableId, compose.emailField).then(setSampleRecipient)
  }, [compose.baseId, compose.tableId, compose.emailField])

  const selectedTable = tables.find(t => t.id === compose.tableId)

  return (
    <div className="p-8 max-w-2xl space-y-5">
      <div className="mb-2">
        <h1 className="text-xl font-semibold text-zinc-100">New Broadcast</h1>
        <p className="text-sm text-zinc-500 mt-1">Compose and send an email broadcast to your Airtable contacts.</p>
      </div>

      {/* Marketing toggle */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-zinc-400" />
          <div>
            <p className="text-sm font-medium text-zinc-200">Marketing email</p>
            <p className="text-xs text-zinc-500">
              {compose.isMarketing
                ? '配信停止リンクを含む・Resend の配信停止フィルターを適用'
                : 'トランザクション送信・配信停止リンクなし'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setCompose(c => ({ ...c, isMarketing: !c.isMarketing }))}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
            compose.isMarketing ? 'bg-violet-600' : 'bg-zinc-700'
          }`}
          role="switch"
          aria-checked={compose.isMarketing}
        >
          <span
            className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
              compose.isMarketing ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Step 1: Source */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center font-bold">1</span>
            Data Source
          </CardTitle>
        </CardHeader>
        <Separator className="bg-zinc-800" />
        <CardContent className="pt-4">
          <BaseTableSelector
            bases={bases}
            tables={tables}
            selectedBaseId={compose.baseId}
            selectedTableId={compose.tableId}
            onSelectBase={selectBase}
            onSelectTable={selectTable}
          />
        </CardContent>
      </Card>

      {/* Step 2: Filters */}
      {selectedTable && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center font-bold">2</span>
                <Filter className="w-3.5 h-3.5" />
                Filters
              </CardTitle>
              <div className="flex items-center gap-2">
                {loading
                  ? <Badge variant="secondary" className="text-xs">Counting…</Badge>
                  : (
                    <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-300 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {recipientCount ?? 0} recipients
                    </Badge>
                  )}
                <RecipientListDialog compose={compose} recipientCount={recipientCount} />
              </div>
            </div>
          </CardHeader>
          <Separator className="bg-zinc-800" />
          <CardContent className="pt-4">
            <p className="text-xs text-zinc-600 mb-3">Conditions are combined with AND logic. Email field is always included.</p>
            <FilterBuilder
              baseId={compose.baseId}
              tableId={compose.tableId}
              fields={selectedTable.fields}
              filters={compose.filters}
              onChange={filters => setCompose(c => ({ ...c, filters }))}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 3: Template & Subject */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center font-bold">3</span>
            <FileText className="w-3.5 h-3.5" />
            Template &amp; Subject
          </CardTitle>
        </CardHeader>
        <Separator className="bg-zinc-800" />
        <CardContent className="pt-4 space-y-4">
          <TemplateSelector
            value={compose.templateName}
            onChange={templateName => setCompose(c => ({ ...c, templateName }))}
          />
          <div className="space-y-2">
            <Label className="text-zinc-400 flex items-center gap-2 text-xs uppercase tracking-wide">
              <Mail className="w-3.5 h-3.5" />
              Subject Line
            </Label>
            <Input
              value={compose.subject}
              onChange={e => setCompose(c => ({ ...c, subject: e.target.value }))}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-500"
              placeholder="Subject line…"
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 4: Body */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center font-bold">4</span>
            Email Body
          </CardTitle>
        </CardHeader>
        <Separator className="bg-zinc-800" />
        <CardContent className="pt-4">
          <MarkdownEditor
            value={compose.body}
            onChange={body => setCompose(c => ({ ...c, body }))}
            fields={selectedTable?.fields}
          />
        </CardContent>
      </Card>

      {/* Step 5: Preview */}
      {compose.templateName && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center font-bold">5</span>
              <Eye className="w-3.5 h-3.5" />
              Preview
            </CardTitle>
          </CardHeader>
          <Separator className="bg-zinc-800" />
          <CardContent className="pt-4">
            <EmailPreview body={compose.body} templateHtml={templateHtml} sample={sampleRecipient} isMarketing={compose.isMarketing} />
          </CardContent>
        </Card>
      )}

      {/* Save Draft + Send */}
      <div className="pb-4 space-y-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveDraft}
          className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 bg-transparent"
        >
          {draftSaved
            ? <><CheckCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />Saved</>
            : <><Save className="w-3.5 h-3.5 mr-1.5" />{compose.draftId ? 'Update Draft' : 'Save Draft'}</>
          }
        </Button>
        <SendButton compose={compose} recipientCount={recipientCount} onSent={handleSent} />
      </div>
    </div>
  )
}
