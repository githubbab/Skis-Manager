import Body from "@/components/Body";
import Row from "@/components/Row";
import RowItem from "@/components/RowItem";
import Separator from "@/components/Separator";
import Tile from '@/components/Tile';
import TileIconTitle from '@/components/TileIconTitle';
import AppStyles from "@/constants/AppStyles";
import AppContext from "@/context/AppContext";
import { ThemeContext } from "@/context/ThemeContext";
import { getSeasonOffPistes, OffPistes } from "@/hooks/dbOffPistes";
import { RatingUtils } from "@/hooks/ToolsBox";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useContext, useState } from "react";
import { Text , FlatList, View } from 'react-native';

export default function Offpistes() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();

  const { t } = useContext(AppContext)!;

  const [listOffPistes, setListOffPistes] = useState<OffPistes[]>([]);
  const [numberOfOffPistes, setNumberOfOffPistes] = useState<number>(0);

  const loadData = async () => {
    const data = await getSeasonOffPistes(db);
    setListOffPistes(data);
    const total = data.reduce((acc, offPiste) => acc + offPiste.count, 0);
    setNumberOfOffPistes(total);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  return (
    <Body >
      <Text style={appStyles.title}>{t("offpiste")}</Text>
      <Separator />
      <Tile flex={1}>
        <TileIconTitle usersIconName={"hors-piste"} littleIconName={"star-full"} textColor={colorsTheme.text} 
        pastilleColor={colorsTheme.pastille} pastilleValue={numberOfOffPistes.toString()}/>
        <FlatList
          data={listOffPistes}
          keyExtractor={(item) => item.id}
          onRefresh={loadData}
          refreshing={false}
          renderItem={({ item }) => (
            <RowItem isActive={false}>
              <Row>
                <Text style={[appStyles.text, { flex: 1 }]}>{item.name}</Text>
                <Text style={appStyles.text}>{item.count > 0 ? item.count : ""}</Text>
              </Row>
              {item.ratingStats && item.ratingStats.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: -4, flexWrap: 'wrap' }}>
                  {item.ratingStats.map((stat) => (
                    <View key={stat.rating} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 20 }}>{RatingUtils.ratingToEmoji(stat.rating)}</Text>
                      <Text style={[appStyles.text, { fontSize: 14, margin: 0 }]}>×{stat.count}</Text>
                    </View>
                  ))}
                </View>
              )}
            </RowItem>
          )}
        />
      </Tile>
    </Body>
  );
}