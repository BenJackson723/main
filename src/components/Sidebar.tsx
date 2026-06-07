'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'

const NAV = [
  { href: '/', label: 'Overview', icon: '⚡' },
  { href: '/leads', label: 'Leads', icon: '🎯' },
  { href: '/agents', label: 'Agents', icon: '👤' },
  { href: '/revenue', label: 'Revenue', icon: '💰' },
  { href: '/users', label: 'Users', icon: '🧑‍💻' },
  { href: '/marketplace', label: 'Marketplace', icon: '🏪' },
  { href: '/campaigns', label: 'Campaigns', icon: '📧' },
]

const CRM_NAV = [
  { href: '/crm', label: 'Pipeline', icon: '◈' },
  { href: '/crm/contacts', label: 'Contacts', icon: '◉' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-gray-900 border-r border-gray-800 flex flex-col z-30">
      <div className="px-5 py-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">📊</div>
          <div>
            <div className="text-sm font-bold text-white">CEO Dashboard</div>
            <div className="text-xs text-gray-500">Lead Marketplace</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800">
          <div className="px-3 mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Sales CRM</div>
          <div className="space-y-0.5">
            {CRM_NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                <span className="text-xs">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
