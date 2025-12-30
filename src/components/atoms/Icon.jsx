import React from 'react';

import googleSrc from '../../assets/Images/google-icon-logo-svgrepo-com.svg';
import appleSrc from '../../assets/Images/apple-black-logo-svgrepo-com.svg';
import eyeOpen from '../../assets/Images/eye-svgrepo-com.svg';
import eyeClosed from '../../assets/Images/eye-closed-svgrepo-com.svg'; 

const Icon = ({ provider, className = "" }) => {
  // Helper to invert colors in dark mode (for black icons)
  const invertInDark = "dark:invert dark:brightness-200";

  const icons = {
    // Google logo has colors, usually doesn't need inversion
    google: <img src={googleSrc} alt="Google" className={className} />,
    
    // Apple logo is black -> needs to turn white in dark mode
    apple: <img src={appleSrc} alt="Apple" className={`${className} ${invertInDark}`} />,
    
    // Eye icons are usually outline/black -> need inversion or color change
    eye: <img src={eyeOpen} alt="Show Password" className={`${className} ${invertInDark}`} />,
    'eye-off': <img src={eyeClosed} alt="Hide Password" className={`${className} ${invertInDark}`} />, 
  };
  
  return icons[provider] || null;
};

export default Icon;