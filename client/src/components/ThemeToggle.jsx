import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/useTheme';

export default function ThemeToggle({ showLabel = false, className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const label = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';

  if (showLabel) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`app-nav-mobile-theme-row ${className}`.trim()}
        aria-label={label}
        title={label}
      >
        <span className="app-nav-mobile-theme-info">
          {isDark ? <Sun size={18} className="theme-toggle-icon" /> : <Moon size={18} className="theme-toggle-icon" />}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </span>
        <span className="app-nav-mobile-theme-badge">
          {isDark ? 'Dark Active' : 'Light Active'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`app-nav-theme-toggle ${className}`.trim()}
      aria-label={label}
      title={label}
    >
      {isDark ? (
        <Sun size={16} className="theme-toggle-icon theme-toggle-sun" />
      ) : (
        <Moon size={16} className="theme-toggle-icon theme-toggle-moon" />
      )}
    </button>
  );
}
