import {Text, StyleSheet, View, ViewStyle} from "react-native";

type PastilleProps = {
  name: string,
  size?: number,
  color?: string,
  textColor?: string,
  style?: ViewStyle,
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return "#" + ((hash >> 24) & 0xFF).toString(16).padStart(2, '0') +
    ((hash >> 16) & 0xFF).toString(16).padStart(2, '0') +
    ((hash >> 8) & 0xFF).toString(16).padStart(2, '0');
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
  const initial = name.length<3 ? name : getInitials(name);
  const bgColor = color ??
    (name.length < 4 ?
      stringToColor(initial+initial+initial+initial):
      stringToColor(name)
    );
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
      fontSize: size/2,
      fontWeight: 'bold',
      color: textColor ?? 'white',
    }
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