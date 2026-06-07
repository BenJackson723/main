'use client'
import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Phone, MessageSquare, FileText, ChevronRight, Loader2, Trash2 } from 'lucide-react'

const STAGES = [
  { key: 'prospecting', label: 'Prospecting', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  { key: 'qualified', label: 'Qualified', color: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  { key: 'proposal', label: 'Proposal Sent', color: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  { key: 'won', label: 'Closed Won', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  { key: 'lost', label: 'Closed Lost', color: 'bg-red-50 text-red-700', dot: 'bg-red-400' },
]

const ACTIVITY_TYPES = [
  { key: 'call', label: 'Call', icon: Phone },
  { key: 'note', label: 'Note', icon: FileText },
  { key: 'message', label: 'Message', icon: MessageSquare },
]

type Deal = {
  id: number
  title: string
  contact_name: string | null
  contact_company: string | null
  contact_email: string | null
  contact_phone: string | null
  stage: string
  value: string
  leads_count: number
  package_name: string | null
  assigned_to: string | null
  notes: string | null
  created_at: string
  activities?: Activity[]
}

type Activity = {
  id: number
  type: string
  content: string
  created_by: string
  created_at: string
}

type Contact = { id: number; name: string; company: string | null }

function fmt(v: string | number) {
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '$0'
  return '$' + n.toLocaleString('en-AU', { maximumFractionDigits: 0 })
}

function timeAgo(date: string) {
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function PipelineClient() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selected, setSelected] = useState<Deal | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activityText, setActivityText] = useState('')
  const [activityType, setActivityType] = useState('call')
  const [activityBy, setActivityBy] = useState('')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Deal>>({})
  const [showLost, setShowLost] = useState(false)

  const loadDeals = useCallback(async () => {
    const res = await fetch('/api/crm/deals')
    if (res.ok) setDeals(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    loadDeals()
    fetch('/api/crm/contacts').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setContacts(d)
    })
  }, [loadDeals])

  async function openDeal(deal: Deal) {
    const res = await fetch(`/api/crm/deals/${deal.id}`)
    if (res.ok) {
      const data = await res.json()
      setSelected(data)
      setEditing(false)
      setActivityText('')
    }
  }

  async function logActivity() {
    if (!activityText.trim() || !selected) return
    setSaving(true)
    await fetch('/api/crm/activities', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        deal_id: selected.id,
        type: activityType,
        content: activityText,
        created_by: activityBy || 'Team',
      }),
    })
    setActivityText('')
    const res = await fetch(`/api/crm/deals/${selected.id}`)
    if (res.ok) setSelected(await res.json())
    setSaving(false)
  }

  async function updateStage(dealId: number, stage: string) {
    const deal = deals.find(d => d.id === dealId)!
    await fetch(`/api/crm/deals/${dealId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...deal, stage }),
    })
    await loadDeals()
    if (selected?.id === dealId) setSelected(prev => prev ? { ...prev, stage } : null)
  }

  async function saveEdit() {
    if (!selected) return
    setSaving(true)
    await fetch(`/api/crm/deals/${selected.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...selected, ...editForm }),
    })
    await loadDeals()
    const res = await fetch(`/api/crm/deals/${selected.id}`)
    if (res.ok) setSelected(await res.json())
    setEditing(false)
    setSaving(false)
  }

  async function deleteDeal() {
    if (!selected || !confirm('Delete this deal?')) return
    await fetch(`/api/crm/deals/${selected.id}`, { method: 'DELETE' })
    setSelected(null)
    await loadDeals()
  }

  const visibleStages = showLost ? STAGES : STAGES.filter(s => s.key !== 'lost')
  const activeDeals = deals.filter(d => d.stage !== 'lost')
  const totalPipeline = activeDeals.reduce((s, d) => s + parseFloat(d.value || '0'), 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading pipeline...
    </div>
  )

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pipeline</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {activeDeals.length} active deals · {fmt(totalPipeline)} total value
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLost(!showLost)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showLost ? 'Hide lost' : 'Show lost'}
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 bg-gray-900 text-white text-sm px-3.5 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Deal
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
        {visibleStages.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.key)
          const stageTotal = stageDeals.reduce((s, d) => s + parseFloat(d.value || '0'), 0)
          return (
            <div key={stage.key} className="flex-shrink-0 w-64">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${stage.dot}`} />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{stage.label}</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">{stageDeals.length}</span>
              </div>
              {/* Value total */}
              <div className="text-sm font-semibold text-gray-800 mb-3">{fmt(stageTotal)}</div>
              {/* Cards */}
              <div className="space-y-2">
                {stageDeals.map(deal => (
                  <button
                    key={deal.id}
                    onClick={() => openDeal(deal)}
                    className="w-full text-left bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="font-medium text-sm text-gray-900 leading-snug">{deal.title}</div>
                    {deal.contact_name && (
                      <div className="text-xs text-gray-400 mt-1">{deal.contact_name}</div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-semibold text-gray-800">{fmt(deal.value)}</span>
                      {deal.leads_count > 0 && (
                        <span className="text-xs text-gray-400">{deal.leads_count} leads</span>
                      )}
                    </div>
                    {deal.assigned_to && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                          {deal.assigned_to[0].toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-400">{deal.assigned_to}</span>
                      </div>
                    )}
                  </button>
                ))}
                {stageDeals.length === 0 && (
                  <div className="border-2 border-dashed border-gray-100 rounded-xl p-4 text-center">
                    <span className="text-xs text-gray-300">No deals</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Deal Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20" onClick={() => setSelected(null)} />
          <div className="w-[480px] bg-white h-full shadow-2xl flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex-1 min-w-0">
                {editing ? (
                  <input
                    className="text-base font-semibold text-gray-900 border-b border-gray-300 w-full outline-none bg-transparent"
                    value={editForm.title ?? selected.title}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  />
                ) : (
                  <h2 className="text-base font-semibold text-gray-900 truncate">{selected.title}</h2>
                )}
                {selected.contact_name && (
                  <p className="text-xs text-gray-400 mt-0.5">{selected.contact_name}{selected.contact_company ? ` · ${selected.contact_company}` : ''}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                {!editing && (
                  <button onClick={() => { setEditing(true); setEditForm(selected) }} className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors">Edit</button>
                )}
                <button onClick={() => setSelected(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Deal info */}
              <div className="px-6 py-5 border-b border-gray-50">
                {editing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Value ($)</label>
                        <input
                          type="number"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                          value={editForm.value ?? selected.value}
                          onChange={e => setEditForm(f => ({ ...f, value: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Leads</label>
                        <input
                          type="number"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                          value={editForm.leads_count ?? selected.leads_count}
                          onChange={e => setEditForm(f => ({ ...f, leads_count: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Package</label>
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                        value={editForm.package_name ?? selected.package_name ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, package_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Assigned to</label>
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                        value={editForm.assigned_to ?? selected.assigned_to ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, assigned_to: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Stage</label>
                      <select
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white"
                        value={editForm.stage ?? selected.stage}
                        onChange={e => setEditForm(f => ({ ...f, stage: e.target.value }))}
                      >
                        {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Notes</label>
                      <textarea
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
                        rows={3}
                        value={editForm.notes ?? selected.notes ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="flex-1 bg-gray-900 text-white text-sm py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                      >
                        {saving ? 'Saving…' : 'Save changes'}
                      </button>
                      <button onClick={() => setEditing(false)} className="px-4 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Stage pill + move */}
                    <div className="flex items-center gap-2">
                      {(() => {
                        const s = STAGES.find(s => s.key === selected.stage)!
                        return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s?.color}`}>{s?.label}</span>
                      })()}
                      <select
                        className="text-xs text-gray-400 border-none outline-none bg-transparent cursor-pointer"
                        value={selected.stage}
                        onChange={e => updateStage(selected.id, e.target.value)}
                      >
                        {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </div>
                    {/* Key metrics */}
                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div>
                        <div className="text-xs text-gray-400">Value</div>
                        <div className="text-lg font-semibold text-gray-900 mt-0.5">{fmt(selected.value)}</div>
                      </div>
                      {selected.leads_count > 0 && (
                        <div>
                          <div className="text-xs text-gray-400">Leads</div>
                          <div className="text-lg font-semibold text-gray-900 mt-0.5">{selected.leads_count}</div>
                        </div>
                      )}
                      {selected.package_name && (
                        <div>
                          <div className="text-xs text-gray-400">Package</div>
                          <div className="text-sm font-medium text-gray-700 mt-0.5">{selected.package_name}</div>
                        </div>
                      )}
                    </div>
                    {selected.assigned_to && (
                      <div className="flex items-center gap-2 pt-1">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                          {selected.assigned_to[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-600">{selected.assigned_to}</span>
                      </div>
                    )}
                    {selected.notes && (
                      <p className="text-sm text-gray-500 leading-relaxed pt-1">{selected.notes}</p>
                    )}
                    {selected.contact_email && (
                      <div className="text-xs text-gray-400">{selected.contact_email}{selected.contact_phone ? ` · ${selected.contact_phone}` : ''}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Log activity */}
              {!editing && (
                <div className="px-6 py-5 border-b border-gray-50">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Log Activity</div>
                  <div className="flex gap-2 mb-3">
                    {ACTIVITY_TYPES.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setActivityType(t.key)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${activityType === t.key ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      >
                        <t.icon className="w-3 h-3" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 resize-none placeholder-gray-300"
                    rows={2}
                    placeholder="What happened?"
                    value={activityText}
                    onChange={e => setActivityText(e.target.value)}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 placeholder-gray-300"
                      placeholder="Your name (optional)"
                      value={activityBy}
                      onChange={e => setActivityBy(e.target.value)}
                    />
                    <button
                      onClick={logActivity}
                      disabled={saving || !activityText.trim()}
                      className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
                    >
                      Log
                    </button>
                  </div>
                </div>
              )}

              {/* Activity feed */}
              {!editing && selected.activities && selected.activities.length > 0 && (
                <div className="px-6 py-5">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Activity</div>
                  <div className="space-y-4">
                    {selected.activities.map(a => {
                      const t = ACTIVITY_TYPES.find(t => t.key === a.type)
                      return (
                        <div key={a.id} className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {t ? <t.icon className="w-3.5 h-3.5 text-gray-500" /> : <FileText className="w-3.5 h-3.5 text-gray-500" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-700">{a.created_by}</span>
                              <span className="text-xs text-gray-300">{timeAgo(a.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{a.content}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Delete */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button onClick={deleteDeal} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete deal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Deal Modal */}
      {showNew && (
        <NewDealModal
          contacts={contacts}
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); loadDeals() }}
        />
      )}
    </div>
  )
}

function NewDealModal({ contacts, onClose, onCreated }: {
  contacts: Contact[]
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({ title: '', contact_id: '', stage: 'prospecting', value: '', leads_count: '', package_name: '', assigned_to: '', notes: '' })
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    await fetch('/api/crm/deals', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...form,
        contact_id: form.contact_id ? parseInt(form.contact_id) : null,
        value: parseFloat(form.value) || 0,
        leads_count: parseInt(form.leads_count) || 0,
      }),
    })
    setSaving(false)
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">New Deal</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Deal title *</label>
            <input
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
              placeholder="e.g. Acme Corp — Starter Package"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Contact</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white"
              value={form.contact_id}
              onChange={e => setForm(f => ({ ...f, contact_id: e.target.value }))}
            >
              <option value="">— None —</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Value ($)</label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                placeholder="0"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Leads</label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                placeholder="0"
                value={form.leads_count}
                onChange={e => setForm(f => ({ ...f, leads_count: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Package</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                placeholder="e.g. Starter"
                value={form.package_name}
                onChange={e => setForm(f => ({ ...f, package_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Assigned to</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                placeholder="Name"
                value={form.assigned_to}
                onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Stage</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white"
              value={form.stage}
              onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
            >
              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Notes</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
              rows={2}
              placeholder="Any initial notes…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gray-900 text-white text-sm py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors font-medium"
          >
            {saving ? 'Creating…' : 'Create Deal'}
          </button>
        </form>
      </div>
    </div>
  )
}
