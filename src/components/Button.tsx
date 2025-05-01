import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ title, onPress, disabled }) => {
  return (
    <TouchableOpacity
      className={`px-4 py-2 rounded ${
        disabled ? 'bg-gray-400' : 'bg-blue-500'
      }`}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className="text-white text-center">{title}</Text>
    </TouchableOpacity>
  );
};

export default Button;
