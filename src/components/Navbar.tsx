import Icon, { type IconName } from './Icons'

interface NavItem {
  key: string
  label: string
  icon: IconName
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: '每日刷題', icon: 'home' },
  { key: 'notes', label: '精選筆記', icon: 'book-open' },
  { key: 'stats', label: '學習數據', icon: 'bar-chart' },
  { key: 'profile', label: '個人資料', icon: 'user' },
]

interface NavbarProps {
  active: string
  onNavigate: (key: string) => void
}

const Navbar = ({ active, onNavigate }: NavbarProps) => (
  <header className="navbar">
    <div className="navbar-inner">
      <span className="navbar-brand">
        <Icon name="sprout" size={22} />
        EasyLearn
      </span>
      <nav className="navbar-tabs">
        {NAV_ITEMS.map((item) => (
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

export default Navbar
