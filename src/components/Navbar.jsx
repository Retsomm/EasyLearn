import Icon from './Icons'

const NAV_ITEMS = [
  { key: 'home', label: '每日刷題', icon: 'home' },
  { key: 'notes', label: '精選筆記', icon: 'book-open' },
  { key: 'stats', label: '學習數據', icon: 'bar-chart' },
  { key: 'profile', label: '個人資料', icon: 'user' },
]

export default function Navbar({ active, onNavigate }) {
  return (
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
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
