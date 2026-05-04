import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  return <div>{children}</div>;
}
interface NavbarContextType {
  isNavbarVisible: boolean;
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export const NavbarProvider = ({ children }: { children: ReactNode }) => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 64) {
        setIsNavbarVisible(false);
      } else {
        setIsNavbarVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <NavbarContext.Provider value={{ isNavbarVisible }}>
      {children}
    </NavbarContext.Provider>
  );
};

export const useNavbar = () => {
  const context = useContext(NavbarContext);
  if (context === undefined) {
    throw new Error('useNavbar must be used within NavbarProvider');
  }
  return context;
};
