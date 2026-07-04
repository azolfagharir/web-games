// app/page.tsx
import type { NextPage } from 'next';
import Link from 'next/link';

const Home: NextPage = () => {
  const games = [
    {
      id: 1,
      title: '🏎️ مسابقه جاده',
      desc: 'فرار از موانع و جمع‌آوری ستاره',
      path: '/game/racing',
      color: 'from-blue-500/20 to-blue-600/10',
      icon: '🏎️',
      badge: '🔥 محبوب'
    },
    {
      id: 2,
      title: '🍄 ماجراجویی ماریو',
      desc: 'پرش روی موانع و شلیک به دشمنان',
      path: '/game/mario',
      color: 'from-red-500/20 to-red-600/10',
      icon: '🍄',
      badge: '⭐ ویژه'
    },
    {
      id: 3,
      title: '🎯 تیراندازی به سیبل',
      desc: '۳ تیر فرصت داری به سیبل بزنی!',
      path: '/game/dart',
      color: 'from-green-500/20 to-green-600/10',
      icon: '🎯',
      badge: '🆕 جدید'
    },
    {
      id: 4,
      title: '🚀 فرار از موانع',
      desc: 'از دشمنان فرار کن و ستاره جمع کن!',
      path: '/game/avoider',
      color: 'from-purple-500/20 to-purple-600/10',
      icon: '🚀',
      badge: '⚡ سریع'
    },
    {
      id: 5,
      title: '🧠 بازی حافظه',
      desc: 'جفت‌های مشابه رو پیدا کن!',
      path: '/game/memory',
      color: 'from-pink-500/20 to-pink-600/10',
      icon: '🧠',
      badge: '🎯 چالشی'
    },
    {
      id: 6,
      title: '🎯 بازی AA',
      desc: 'تیرها رو به دایره بزن بدون برخورد!',
      path: '/game/aa',
      color: 'from-orange-500/20 to-orange-600/10',
      icon: '🎯',
      badge: '🔥 جدید'
    },
  ];

  // تولید ستاره‌های متحرک
  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 3,
    size: 1 + Math.random() * 2,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a0a1a] p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto relative">
      {/* دایره‌های رنگی متحرک - ریسپانسیو */}
      <div className="absolute w-[200px] sm:w-[250px] md:w-[300px] lg:w-[400px] h-[200px] sm:h-[250px] md:h-[300px] lg:h-[400px] bg-blue-500/10 rounded-full blur-[80px] -top-12 -right-12 animate-pulse" />
      <div className="absolute w-[250px] sm:w-[300px] md:w-[400px] lg:w-[500px] h-[250px] sm:h-[300px] md:h-[400px] lg:h-[500px] bg-red-500/10 rounded-full blur-[80px] -bottom-20 -left-20 animate-pulse delay-1000" />
      <div className="absolute w-[150px] sm:w-[200px] md:w-[250px] lg:w-[350px] h-[150px] sm:h-[200px] md:h-[250px] lg:h-[350px] bg-yellow-500/10 rounded-full blur-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500" />

      {/* ستاره‌ها - ریسپانسیو */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full animate-twinkle"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              animationDelay: `${star.delay}s`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: 0.2,
            }}
          />
        ))}
      </div>

      {/* محتوا - دسکتاپ */}
      <div className="hidden lg:block relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10 lg:mb-12 pt-2 sm:pt-4 md:pt-6">
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-blue-400 via-yellow-400 to-red-400 bg-clip-text text-transparent px-2">
            🎮 بازی‌های من
          </h1>
          <p className="text-gray-400 mt-1 sm:mt-2 md:mt-3 text-xs sm:text-sm md:text-base lg:text-lg px-2">
            ✨ یکی از بازی‌ها رو انتخاب کن و شروع کن!
          </p>
        </div>

        {/* Grid Games - دسکتاپ */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {games.map((game) => (
            <Link key={game.id} href={game.path}>
              <div className={`
                bg-gradient-to-br ${game.color} 
                backdrop-blur-lg rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7
                border border-white/5 hover:border-white/20 
                transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl 
                cursor-pointer relative overflow-hidden
                group h-full
              `}>
                {/* Badge */}
                <span className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[7px] sm:text-[8px] md:text-[10px] lg:text-xs bg-white/10 text-white/60 px-1.5 sm:px-2 py-0.5 rounded-full">
                  {game.badge}
                </span>
                
                {/* Icon */}
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                  {game.icon}
                </div>
                
                {/* Title */}
                <h3 className="text-white font-bold text-base sm:text-lg md:text-xl lg:text-2xl mb-1 leading-tight">
                  {game.title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-400 text-xs sm:text-sm md:text-base leading-relaxed">
                  {game.desc}
                </p>
                
                {/* Play Button */}
                <div className="mt-3 sm:mt-4 md:mt-5 text-blue-400 text-xs sm:text-sm md:text-base font-medium flex items-center gap-1 sm:gap-2 group-hover:gap-2 sm:group-hover:gap-3 transition-all">
                  <span>▶ بازی کن</span>
                  <span className="text-xs">→</span>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 text-[8px] sm:text-[10px] md:text-xs lg:text-sm mt-6 sm:mt-8 md:mt-10 lg:mt-12">
          <span className="inline-block">🎮 با فلش‌ها و Space کنترل کن</span>
          <span className="hidden xs:inline mx-1 sm:mx-2">|</span>
          <span className="inline-block">🔄 R برای ریست</span>
          <span className="hidden xs:inline mx-1 sm:mx-2">|</span>
          <span className="inline-block">📱 لمسی و ماوس پشتیبانی می‌شود</span>
        </div>
      </div>

      {/* محتوا - موبایل و تبلت */}
      <div className="lg:hidden relative z-10 max-w-7xl mx-auto h-screen flex flex-col">
        {/* Header - ریسپانسیو */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8 pt-2 sm:pt-4 md:pt-6 flex-shrink-0">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-yellow-400 to-red-400 bg-clip-text text-transparent px-2">
            🎮 بازی‌های من
          </h1>
          <p className="text-gray-400 mt-1 sm:mt-2 md:mt-3 text-xs sm:text-sm md:text-base px-2">
            ✨ یکی از بازی‌ها رو انتخاب کن و شروع کن!
          </p>
        </div>

        {/* Grid Games - موبایل و تبلت با اسکرول */}
        <div className="flex-1 overflow-y-auto pb-4 sm:pb-6 md:pb-8">
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 md:gap-5 auto-rows-fr">
            {games.map((game) => (
              <Link key={game.id} href={game.path}>
                <div className={`
                  bg-gradient-to-br ${game.color} 
                  backdrop-blur-lg rounded-2xl p-4 sm:p-5 md:p-6
                  border border-white/5 hover:border-white/20 
                  transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl 
                  cursor-pointer relative overflow-hidden
                  group h-full min-h-[160px] sm:min-h-[180px] md:min-h-[200px]
                  flex flex-col justify-between
                `}>
                  {/* Badge */}
                  <span className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[7px] sm:text-[8px] md:text-[10px] bg-white/10 text-white/60 px-1.5 sm:px-2 py-0.5 rounded-full">
                    {game.badge}
                  </span>
                  
                  {/* Icon */}
                  <div className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                    {game.icon}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-white font-bold text-base sm:text-lg md:text-xl mb-1 leading-tight">
                    {game.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-400 text-xs sm:text-sm md:text-base leading-relaxed flex-1">
                    {game.desc}
                  </p>
                  
                  {/* Play Button */}
                  <div className="mt-3 sm:mt-4 md:mt-5 text-blue-400 text-xs sm:text-sm md:text-base font-medium flex items-center gap-1 sm:gap-2 group-hover:gap-2 sm:group-hover:gap-3 transition-all">
                    <span>▶ بازی کن</span>
                    <span className="text-xs">→</span>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer - موبایل و تبلت */}
        <div className="text-center text-gray-600 text-[8px] sm:text-[10px] md:text-xs mt-4 sm:mt-6 md:mt-8 flex-shrink-0 pb-1">
          <span className="inline-block">🎮 با فلش‌ها و Space کنترل کن</span>
          <span className="hidden xs:inline mx-1 sm:mx-2">|</span>
          <span className="inline-block">🔄 R برای ریست</span>
          <span className="hidden xs:inline mx-1 sm:mx-2">|</span>
          <span className="inline-block">📱 لمسی و ماوس پشتیبانی می‌شود</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }

        /* Custom breakpoint for extra small screens */
        @media (min-width: 480px) {
          .xs\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 480px) {
          .xs\\:inline {
            display: inline;
          }
        }

        @media (max-width: 479px) {
          .grid {
            gap: 0.75rem;
          }
        }

        /* Ensure scrolling works on mobile/tablet */
        .overflow-y-auto {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }

        /* Fix for iOS Safari */
        .h-screen {
          height: 100vh;
          height: 100dvh; /* Dynamic viewport height for mobile */
        }
      `}</style>
    </div>
  );
};

export default Home;