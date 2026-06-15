import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, Rocket } from 'lucide-react';
import { authApi } from '@/api/auth';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';

export default function Register() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const { showToast, setLoading } = useUIStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = '请输入昵称';
    else if (username.length < 2) newErrors.username = '昵称至少2个字符';
    else if (username.length > 20) newErrors.username = '昵称最多20个字符';

    if (!email) newErrors.email = '请输入邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = '请输入有效邮箱';

    if (!password) newErrors.password = '请输入密码';
    else if (password.length < 6) newErrors.password = '密码至少6位';

    if (!confirmPassword) newErrors.confirmPassword = '请再次输入密码';
    else if (confirmPassword !== password) newErrors.confirmPassword = '两次密码不一致';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await authApi.register(username.trim(), email, password);
      if (res.success && res.user && res.token) {
        login(res.user, res.token);
        showToast({ type: 'success', message: res.message });
        setTimeout(() => navigate('/'), 500);
      } else {
        showToast({ type: 'error', message: res.message || '注册失败' });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || '注册失败，请稍后重试';
      showToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="relative">
              <Rocket className="w-10 h-10 text-aurora animate-float" />
              <Sparkles className="w-4 h-4 text-starlight absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <h1 className="font-serif-sc text-3xl sm:text-4xl font-bold text-white mb-3">
            开启<span className="bg-gradient-to-r from-cosmic-400 via-aurora to-nebula-pink bg-clip-text text-transparent"> 星之旅</span>
          </h1>
          <p className="text-white/60 text-sm sm:text-base">
            创建你的星际身份，寄出第一封穿越时空的信
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8 shadow-glow-lg">
          <form onSubmit={handleSubmit} className="space-y-4.5">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">星际昵称</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="给自己取个梦幻的名字"
                  className={`input-field pl-11 ${errors.username ? 'border-red-500/60 focus:border-red-500' : ''}`}
                  maxLength={20}
                />
              </div>
              {errors.username && <p className="mt-1.5 text-xs text-red-400">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">邮箱地址</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={`input-field pl-11 ${errors.email ? 'border-red-500/60 focus:border-red-500' : ''}`}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">设置密码</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6位字符"
                  className={`input-field pl-11 pr-11 ${errors.password ? 'border-red-500/60 focus:border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入相同密码"
                  className={`input-field pl-11 ${errors.confirmPassword ? 'border-red-500/60 focus:border-red-500' : ''}`}
                />
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base mt-2"
            >
              穿越星门
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-sm text-white/60">
              已经有星门通行证了？{' '}
              <Link to="/login" className="text-aurora hover:text-aurora-light font-medium transition-colors">
                返回登录 →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
