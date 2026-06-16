import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Home, Tag, User, PenLine, LogOut, Menu, X, Sparkles, Archive, MessageSquareHeart, HeartPulse, Globe, Mailbox, Orbit, Trophy } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import { cn } from '@/utils/helpers';

const navItems = [
  { path: '/', label: '信件广场', icon: Home },
  { path: '/write', label: '写一封信', icon: PenLine },
  { path: '/relation-network', label: '关系星图', icon: Orbit },
  { path: '/future-mailbox', label: '未来信箱', icon: Mailbox },
  { path: '/activities', label: '星球社群', icon: Globe },
  { path: '/stranger-reply', label: '陌生回信', icon: MessageSquareHeart },
  { path: '/achievements', label: '成就中心', icon: Trophy },
  { path: '/healing', label: '情绪疗愈室', icon: HeartPulse },
  { path: '/emotions', label: '情绪星河', icon: Tag },
  { path: '/archive', label: '星愿档案馆', icon: Archive },
  { path: '/profile', label: '我的星阁', icon: User },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showToast({ type: 'success', message: '已退出星邮局，下次再会 ✨' });
    navigate('/login');
  };

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link
            to="/"
            className="flex items-center gap-2 group"
          >
            <div className="relative">
              <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-starlight transition-transform duration-300 group-hover:rotate-12" />
              <Sparkles className="w-3 h-3 text-aurora absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="font-serif-sc text-xl sm:text-2xl font-bold bg-gradient-to-r from-starlight via-aurora to-nebula-pink bg-clip-text text-transparent">
              星邮局
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const needAuth = ['/write', '/profile'].includes(item.path);

              return (
                <Link
                  key={item.path}
                  to={needAuth && !isAuthenticated ? '/login' : item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'bg-white/10 text-white shadow-glow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <span className="text-xl">{user.avatar}</span>
                  <span className="text-sm font-medium text-white/90">{user.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
                  title="退出登录"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-cosmic-500 to-aurora hover:shadow-glow transition-all"
                >
                  注册
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-white/10 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const needAuth = ['/write', '/profile'].includes(item.path);

                return (
                  <Link
                    key={item.path}
                    to={needAuth && !isAuthenticated ? '/login' : item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="mt-4 pt-4 border-t border-white/10">
                {isAuthenticated && user ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 px-4 py-2">
                      <span className="text-2xl">{user.avatar}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{user.username}</div>
                        <div className="text-xs text-white/50">{user.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      退出登录
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 px-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="text-center px-4 py-3 rounded-xl text-sm font-medium text-white/80 border border-white/10 hover:bg-white/5"
                    >
                      登录
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="text-center px-4 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cosmic-500 to-aurora"
                    >
                      注册账号
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
