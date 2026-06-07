'use client'
import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Search, Loader2, Trash2, ChevronRight } from 'lucide-react'

type Contact = {
  id: number
  name: string
  company: string | null
  email: string | null
  phone: string | null
  current_package: string | null
  notes: string | null
  deal_count: number
  created_at: string
}

type Deal = {
  id: number
  title: string
  stage: string
  value: string
}

type ContactDetail = Contact & { deals: Deal[]; activities: { id: number; type: string; content: string; created_by: string; created_at: string }[] }

const STAGE_LABELS: Record<string, string> = {
  prospecting: 'Prospecting', qualified: 'Qualified', proposal: 'Proposal Sent',
  negotiation: 'Negotiation', won: 'Won', lost: 'Lost',
}

function fmt(v: string | number) {
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '$0'
  return '$' + n.toLocaleString('en-AU', { maximumFractionDigits: 0 })
}

export default function ContactsClient() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ContactDetail | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Contact>>({})
  const [saving, setSaving] = useState(false)

  const loadContacts = useCallback(async () => {
    const res = await fetch('/api/crm/contacts')
    if (res.ok) setContacts(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { loadContacts() }, [loadContacts])

  async function openContact(c: Contact) {
    const res = await fetch(`/api/crm/contacts/${c.id}`)
    if (res.ok) {
      setSelected(await res.json())
      setEditing(false)
    }
  }

  async function saveEdit() {
    if (!selected) return
    setSaving(true)
    await fetch(`/api/crm/contacts/${selected.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...selected, ...editForm }),
    })
    await loadContacts()
    const res = await fetch(`/api/crm/contacts/${selected.id}`)
    if (res.ok) setSelected(await res.json())
    setEditing(false)
    setSaving(false)
  }

  async function deleteContact() {
    if (!selected || !confirm('Delete this contact?')) return
    await fetch(`/api/crm/contacts/${selected.id}`, { method: 'DELETE' })
    setSelected(null)
    await loadContacts()
  }

  const filtered = contacts.filter(c =>
    [c.name, c.company, c.email, c.phone, c.current_package].some(v =>
      v?.toLowerCase().includes(query.toLowerCase())
    )
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-400 mt-0.5">{contacts.length} total</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 bg-gray-900 text-white text-sm px-3.5 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Contact
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        <input
          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-gray-400 placeholder-gray-300"
          placeholder="Search by name, company, email…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-300 text-sm">
          {query ? 'No contacts match your search.' : 'No contacts yet. Add your first one.'}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Company</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 hidden md:table-cell">Email</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 hidden lg:table-cell">Package</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 hidden lg:table-cell">Deals</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${i !== filtered.length - 1 ? 'border-b border-gray-50' : ''}`}
                  onClick={() => openContact(c)}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                        {c.name[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{c.company || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-400 hidden md:table-cell">{c.email || '—'}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    {c.current_package ? (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{c.current_package}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 hidden lg:table-cell">{c.deal_count}</td>
                  <td className="px-5 py-3.5">
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Contact Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20" onClick={() => setSelected(null)} />
          <div className="w-[440px] bg-white h-full shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                  {selected.name[0].toUpperCase()}
                </div>
                <div>
                  {editing ? (
                    <input
                      className="text-base font-semibold text-gray-900 border-b border-gray-300 outline-none bg-transparent w-48"
                      value={editForm.name ?? selected.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    />
                  ) : (
                    <h2 className="text-base font-semibold text-gray-900">{selected.name}</h2>
                  )}
                  {selected.company && <p className="text-xs text-gray-400">{selected.company}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!editing && (
                  <button onClick={() => { setEditing(true); setEditForm(selected) }} className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors">Edit</button>
                )}
                <button onClick={() => setSelected(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 border-b border-gray-50">
                {editing ? (
                  <div className="space-y-3">
                    {[
                      { key: 'company', label: 'Company', placeholder: 'Acme Corp' },
                      { key: 'email', label: 'Email', placeholder: 'email@example.com' },
                      { key: 'phone', label: 'Phone', placeholder: '+61 4xx xxx xxx' },
                      { key: 'current_package', label: 'Current Package', placeholder: 'Starter / Growth / Scale' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="text-xs text-gray-500 block mb-1">{field.label}</label>
                        <input
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                          placeholder={field.placeholder}
                          value={(editForm as unknown as Record<string, string>)[field.key] ?? (selected as unknown as Record<string, string>)[field.key] ?? ''}
                          onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Notes</label>
                      <textarea
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
                        rows={3}
                        value={editForm.notes ?? selected.notes ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} disabled={saving} className="flex-1 bg-gray-900 text-white text-sm py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditing(false)} className="px-4 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    {selected.email && <div className="flex gap-3"><span className="text-gray-400 w-24 flex-shrink-0">Email</span><span className="text-gray-700">{selected.email}</span></div>}
                    {selected.phone && <div className="flex gap-3"><span className="text-gray-400 w-24 flex-shrink-0">Phone</span><span className="text-gray-700">{selected.phone}</span></div>}
                    {selected.current_package && <div className="flex gap-3"><span className="text-gray-400 w-24 flex-shrink-0">Package</span><span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{selected.current_package}</span></div>}
                    {selected.notes && <div className="flex gap-3 pt-1"><span className="text-gray-400 w-24 flex-shrink-0">Notes</span><span className="text-gray-600 leading-relaxed">{selected.notes}</span></div>}
                  </div>
                )}
              </div>

              {/* Associated deals */}
              {!editing && selected.deals && selected.deals.length > 0 && (
                <div className="px-6 py-5">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Deals</div>
                  <div className="space-y-2">
                    {selected.deals.map(d => (
                      <div key={d.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-800">{d.title}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{STAGE_LABELS[d.stage] ?? d.stage}</div>
                        </div>
                        <div className="text-sm font-semibold text-gray-700">{fmt(d.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100">
              <button onClick={deleteContact} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Contact Modal */}
      {showNew && (
        <NewContactModal
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); loadContacts() }}
        />
      )}
    </div>
  )
}

function NewContactModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', current_package: '', notes: '' })
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await fetch('/api/crm/contacts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    onCreated()
  }

  const fields: { key: keyof typeof form; label: string; placeholder: string; required?: boolean }[] = [
    { key: 'name', label: 'Full name', placeholder: 'Jane Smith', required: true },
    { key: 'company', label: 'Company', placeholder: 'Acme Corp' },
    { key: 'email', label: 'Email', placeholder: 'jane@acme.com' },
    { key: 'phone', label: 'Phone', placeholder: '+61 4xx xxx xxx' },
    { key: 'current_package', label: 'Current Package', placeholder: 'Starter / Growth / Scale' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">New Contact</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-xs text-gray-500 block mb-1">{f.label}{f.required ? ' *' : ''}</label>
              <input
                required={f.required}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Notes</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
              rows={2}
              placeholder="Any notes…"
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gray-900 text-white text-sm py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors font-medium"
          >
            {saving ? 'Creating…' : 'Create Contact'}
          </button>
        </form>
      </div>
    </div>
  )
}
