import { MdStadium, MdCardGiftcard } from 'react-icons/md';
import { FaFlag } from 'react-icons/fa';
import { IoInformationCircle } from 'react-icons/io5';
import { DesktopNavLink } from './DesktopNavLink';
import { UserMenuDropdown } from './UserMenuDropdown';

interface NavbarDesktopProps {
  isLoggedIn: boolean;
  pathname: string;
}

export function NavbarDesktop({ isLoggedIn, pathname }: NavbarDesktopProps) {
  return (
    <div className="hidden lg:flex items-center gap-8">
      <div className="flex items-center gap-1">
        <DesktopNavLink
          href="/"
          icon={<FaFlag />}
          label="Home"
          neonColor="blue"
          isActive={pathname === '/'}
        />
        <DesktopNavLink
          href="/mystery-box"
          icon={<MdCardGiftcard />}
          label="Mystery Box"
          neonColor="yellow"
          isActive={pathname === '/mystery-box'}
        />
        <DesktopNavLink
          href="/races"
          icon={<MdStadium />}
          label="Races"
          neonColor="purple"
          isActive={pathname === '/races' || pathname?.startsWith('/race/')}
        />
        <DesktopNavLink
          href="/about"
          icon={<IoInformationCircle />}
          label="About"
          neonColor="pink"
          isActive={pathname === '/about'}
        />
      </div>

      {isLoggedIn && <UserMenuDropdown pathname={pathname} />}
    </div>
  );
}
