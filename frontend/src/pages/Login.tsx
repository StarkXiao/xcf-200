import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { authApi } from '@/api/auth';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const { showToast, setLoading } = useUIStore();

  const [email, setEmail] = useState('stardust@example.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = '请输入邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = '请输入有效邮箱';
    if (!password) newErrors.password = '请输入密码';
    else if (password.length < 6) newErrors.password = '密码至少6位';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await authApi.login(email, password);
      if (res.success && res.user && res.token) {
        login(res.user, res.token);
        showToast({ type: 'success', message: res.message });
        setTimeout(() => navigate('/'), 500);
      } else {
        showToast({ type: 'error', message: res.message || '登录失败' });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || '登录失败，请稍后重试';
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
              <Mail className="w-10 h-10 text-starlight" />
              <Sparkles className="w-4 h-4 text-aurora absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <h1 className="font-serif-sc text-3xl sm:text-4xl font-bold text-white mb-3">
            欢迎回到<span className="bg-gradient-to-r from-starlight via-aurora to-nebula-pink bg-clip-text text-transparent"> 星邮局</span>
          </h1>
          <p className="text-white/60 text-sm sm:text-base">
            穿越时空的信件，正等待着你的开启
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8 shadow-glow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
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
              <label className="block text-sm font-medium text-white/80 mb-2">密码</label>
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

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base">
              登录星邮局
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-sm text-white/60">
              还没有星门通行证？{' '}
              <Link to="/register" className="text-aurora hover:text-aurora-light font-medium transition-colors">
                立即注册 →
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-starlight/5 border border-starlight/20">
            <p className="text-xs text-starlight/90 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              演示账号
            </p>
            <p className="text-xs text-white/60 leading-relaxed">
              邮箱：stardust@example.com<br />
              密码：123456
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
