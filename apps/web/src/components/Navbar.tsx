import { useUser } from '@clerk/nextjs'
import Icon from '@/components/Icons'
import type { IconName } from '@easylearn/core'

interface NavItem {
  key: string
  label: string
  icon: IconName
}

const BASE_NAV_ITEMS: NavItem[] = [
  { key: 'home', label: '每日刷題', icon: 'home' },
  { key: 'notes', label: '精選筆記', icon: 'book-open' },
  { key: 'stats', label: '學習數據', icon: 'bar-chart' },
  { key: 'profile', label: '個人資料', icon: 'user' },
]

interface NavbarProps {
  active: string
  onNavigate: (key: string) => void
}

const Navbar = ({ active, onNavigate }: NavbarProps) => {
  const { isSignedIn } = useUser()
  const navItems = BASE_NAV_ITEMS.map((item) =>
    item.key === 'profile' ? { ...item, label: isSignedIn ? '個人資料' : '登入' } : item,
  )

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <span className="navbar-brand" aria-label="EasyLearn">
          <span className="navbar-brand-bracket" aria-hidden="true">&lt;</span>
          <span aria-hidden="true">EASY</span>
          <span className="navbar-brand-accent" aria-hidden="true">LEARN</span>
          <span className="navbar-brand-bracket" aria-hidden="true">/&gt;</span>
        </span>
        <nav className="navbar-tabs">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`navbar-tab ${active === item.key ? 'is-active' : ''}`}
              onClick={() => onNavigate(item.key)}
              aria-current={active === item.key ? 'page' : undefined}
            >
              <Icon name={item.icon} size={18} />
              <span className="navbar-tab-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default Navbar
