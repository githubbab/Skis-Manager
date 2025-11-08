import { StyleSheet, Text, View, ViewStyle } from "react-native";

type PastilleProps = {
  name: string,
  size?: number,
  color?: string,
  textColor?: string,
  style?: ViewStyle,
}

function stringToColor(str: string): string {
  // Generate hash from string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert hash to HSL for better control over color appearance
  // Hue: 0-360 (full color spectrum)
  const hue = Math.abs(hash % 360);
  
  // Saturation: 55-70% (vibrant but not oversaturated)
  const saturation = 55 + (Math.abs(hash) % 16);
  
  // Lightness: 45-60% (ensures good contrast with white text)
  const lightness = 45 + (Math.abs(hash >> 8) % 16);
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getContrastTextColor(backgroundColor: string): string {
  // Extract HSL values from the background color
  const hslMatch = backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!hslMatch) return 'white'; // Fallback
  
  const lightness = parseInt(hslMatch[3]);
  
  // Use white text for darker backgrounds (< 55%), black for lighter ones
  return lightness < 55 ? 'white' : 'black';
}

function getInitials(name: string): string {
  const words = name.trim().split(/[\s-_]+/).filter(Boolean);

  if (words.length === 0) return "__";
  if (words.length === 1) {
    const word = words[0];
    return (word.slice(0, 2)); // ex: "Al" pour "Alice"
  }

  const firstInitial = words[0][0];
  const lastInitial = words[words.length - 1][0];
  return (firstInitial + lastInitial).toUpperCase();
}

const Pastille = ({name, size=24, color, textColor, style}: PastilleProps) => {
  const initial = name.length<=3 ? name : getInitials(name);
  const bgColor = color ??
    (name.length < 4 ?
      stringToColor(initial+initial+initial+initial):
      stringToColor(name)
    );
  
  // Auto-calculate text color if not provided
  const finalTextColor = textColor ?? (color ? 'white' : getContrastTextColor(bgColor));
  
  const styles = StyleSheet.create ({
    pastille: {
      width: size,
      height: size,
      borderRadius: 50,
      backgroundColor: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.5,
      fontWeight: 'bold',
      userSelect: 'none',
    },
    text: {
      fontSize: initial.length <= 2 ? size / 2 : size / 2.2,
      fontWeight: 'bold',
      color: finalTextColor,
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
  })
  
  return (
    <View style={[styles.pastille,style]} >
      <Text style={styles.text} numberOfLines={1} ellipsizeMode={'clip'}>
      {initial}
      </Text>
    </View>
  )
}

export default Pastille;