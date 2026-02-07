import Link from 'next/link';
import { FiMessageSquare, FiTwitter } from 'react-icons/fi';
import { FaXTwitter } from 'react-icons/fa6';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent mb-3">
              PIXEL RACE
            </h3>
            <p className="text-gray-400 text-sm">
              Real-time multiplayer horse racing game on Solana blockchain. Collect, train, and race NFT horses to win rewards.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/mystery-box"
                  className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2"
                >
                  Mystery Box
                </Link>
              </li>
              <li>
                <Link
                  href="/races"
                  className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2"
                >
                  Races
                </Link>
              </li>
              <li>
                <Link
                  href="/goodluck"
                  className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2"
                >
                  GoodLuck
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Community & Support</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/feedback"
                  className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2"
                >
                  <FiMessageSquare className="text-base" />
                  Give Feedback
                </Link>
              </li>
              <li>
                <a
                  href="https://twitter.com/PixelHorseRace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-colors text-sm flex items-center gap-2"
                >
                  <FaXTwitter className="text-base" />
                  Follow us on Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {currentYear} Pixel Race. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="https://twitter.com/PixelHorseRace"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors"
                aria-label="Twitter"
              >
                <FaXTwitter className="text-xl" />
              </a>
              <Link
                href="/feedback"
                className="text-gray-400 hover:text-purple-400 transition-colors"
                aria-label="Feedback"
              >
                <FiMessageSquare className="text-xl" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-gray-500 text-center">
            Pixel Race is an experimental blockchain-based game. Play responsibly and only invest what you can afford to lose.
          </p>
        </div>
      </div>
    </footer>
  );
}
