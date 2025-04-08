import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    // Initial check
    checkSize();
    
    // Add event listener
    window.addEventListener('resize', checkSize);
    
    // Clean up
    return () => window.removeEventListener('resize', checkSize);
  }, [breakpoint]);

  return isMobile;
}