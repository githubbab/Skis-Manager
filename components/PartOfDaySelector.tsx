import React, { useContext } from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemeContext } from '@/context/ThemeContext';
import { PartOfDay, PartOfDayUtils } from '@/hooks/ToolsBox';

interface PartOfDaySelectorProps {
  selectedPart: PartOfDay;
  onSelect: (part: PartOfDay) => void;
  style?: ViewStyle;
}

/**
 * Composant réutilisable pour sélectionner un moment de la journée
 * Affiche 4 boutons avec des icônes : matin, midi, après-midi, soir
 */
const PartOfDaySelector: React.FC<PartOfDaySelectorProps> = ({
  selectedPart,
  onSelect,
  style,
}) => {
  const { colorsTheme } = useContext(ThemeContext);

  return (
    <View style={[{ flexDirection: 'row', gap: 8 }, style]}>
      {PartOfDayUtils.allParts.map((part) => (
        <TouchableOpacity
          key={part}
          onPress={() => onSelect(part)}
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 8,
            backgroundColor: selectedPart === part ? colorsTheme.primary : colorsTheme.tileBG,
            alignItems: 'center',
          }}
        >
          <Feather
            name={PartOfDayUtils.getPartOfDayIcon(part)}
            size={24}
            color={selectedPart === part ? colorsTheme.white : colorsTheme.text}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default PartOfDaySelector;
