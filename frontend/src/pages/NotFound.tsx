import { Link } from 'react-router-dom';
import { Home, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center animate-fade-in-up">
        <div className="relative mb-8">
          <div className="text-[120px] sm:text-[180px] font-serif-sc font-bold bg-gradient-to-r from-cosmic-400 via-aurora to-nebula-pink bg-clip-text text-transparent leading-none">
            404
          </div>
          <div className="absolute top-10 left-1/4 text-4xl animate-float">🌠</div>
          <div className="absolute top-20 right-1/4 text-3xl animate-twinkle" style={{ animationDelay: '0.5s' }}>✨</div>
          <div className="absolute bottom-10 left-1/3 text-2xl animate-twinkle" style={{ animationDelay: '1s' }}>⭐</div>
        </div>

        <h1 className="font-serif-sc text-2xl sm:text-3xl font-bold text-white mb-4">
          迷失在星河中...
        </h1>
        <p className="text-white/60 mb-8 max-w-md mx-auto leading-relaxed">
          你要找的那颗星星似乎暂时离开了这片星域，
          <br />
          也许它正在某个平行宇宙中闪耀。
        </p>

        <Link
          to="/"
          className="btn-primary inline-flex items-center gap-2 px-8 py-3.5"
        >
          <Home className="w-5 h-5" />
          <Sparkles className="w-4 h-4" />
          返回信件广场
        </Link>
      </div>
    </div>
  );
}
