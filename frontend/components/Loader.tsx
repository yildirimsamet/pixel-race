import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface LoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Loader({ text = 'Loading...', size = 'md' }: LoaderProps) {
  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink blur-xl opacity-50 animate-pulse"></div>

        <AiOutlineLoading3Quarters
          className={`${sizes[size]} text-neon-blue spinner-neon relative z-10`}
        />
      </div>

      <p className="text-lg font-semibold bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent animate-pulse">
        {text}
      </p>
    </div>
  );
}
