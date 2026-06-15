import { Mail, Heart, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 mt-20 border-t border-white/5">
      <div className="container py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Mail className="w-6 h-6 text-starlight" />
              <Sparkles className="w-2.5 h-2.5 text-aurora absolute -top-0.5 -right-0.5 animate-pulse" />
            </div>
            <span className="font-serif-sc text-lg font-semibold bg-gradient-to-r from-starlight to-aurora bg-clip-text text-transparent">
              星邮局
            </span>
          </div>

          <p className="text-sm text-white/50 flex items-center gap-1.5">
            穿越时空的信，传递每一份思念
            <Heart className="w-3.5 h-3.5 text-nebula-pink fill-nebula-pink/50" />
          </p>

          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>© 2026 星邮局</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">银河时空邮政认证</span>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-white/30 font-serif-sc italic">
            "每一封信都是一颗星星，在宇宙中闪烁，等待被发现。"
          </p>
        </div>
      </div>
    </footer>
  );
}
