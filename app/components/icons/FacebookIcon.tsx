import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface FacebookIconProps {
  width?: number;
  height?: number;
  style?: any;
}

export const FacebookIcon: React.FC<FacebookIconProps> = ({ 
  width = 32, 
  height = 32, 
  style 
}) => {
  return (
    <Svg 
      width={width} 
      height={height} 
      viewBox="0 0 32 32" 
      style={[{ backgroundColor: 'transparent' }, style]}
    >
      <Path 
        d="M18,32V18h6l1-6h-7V9c0-2,1.002-3,3-3h3V0c-1,0-3.24,0-5,0c-5,0-7,3-7,8v4H6v6h6v14H18z" 
        fill="#1877F2"
      />
    </Svg>
  );
};

export default FacebookIcon;