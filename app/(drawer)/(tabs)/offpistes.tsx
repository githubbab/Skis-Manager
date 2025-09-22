import Body from "@/components/Body";
import Row from "@/components/Row";
import Separator from "@/components/Separator";
import Tile from '@/components/Tile';
import TileIconTitle from '@/components/TileIconTitle';
import AppStyles from "@/constants/AppStyles";
import { ThemeContext } from "@/context/ThemeContext";
import { getSeasonOffPistes, OffPistes } from "@/hooks/dbOffPistes";
import { t } from "@/hooks/ToolsBox";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useContext, useState } from "react";
import { Text, View } from 'react-native';
import { FlatList } from "react-native";


export default function Offpistes() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();

  const [listOffPistes, setListOffPistes] = useState<OffPistes[]>([]);

  //                             ######                     
  // #       ####    ##   #####  #     #   ##   #####   ##  
  // #      #    #  #  #  #    # #     #  #  #    #    #  # 
  // #      #    # #    # #    # #     # #    #   #   #    #
  // #      #    # ###### #    # #     # ######   #   ######
  // #      #    # #    # #    # #     # #    #   #   #    #
  // ######  ####  #    # #####  ######  #    #   #   #    #
  const loadData = async () => {
    // Fetch off-pistes data here
    console.debug("Loading off-pistes data from DB");
    const data = await getSeasonOffPistes(db);
    console.debug("Off-pistes data loaded:", data);
    setListOffPistes(data);
  };

  //                      #######                                  
  // #    #  ####  ###### #       ###### ###### ######  ####  #####
  // #    # #      #      #       #      #      #      #    #   #  
  // #    #  ####  #####  #####   #####  #####  #####  #        #  
  // #    #      # #      #       #      #      #      #        #  
  // #    # #    # #      #       #      #      #      #    #   #  
  //  ####   ####  ###### ####### #      #      ######  ####    #  
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // #####  ###### ##### #    # #####  #    #
  // #    # #        #   #    # #    # ##   #
  // #    # #####    #   #    # #    # # #  #
  // #####  #        #   #    # #####  #  # #
  // #   #  #        #   #    # #   #  #   ##
  // #    # ######   #    ####  #    # #    #
  return (
    <Body >
      <Text style={appStyles.title}>{t("offpiste")}</Text>
      <Separator />
      <Tile flex={1}>
        <TileIconTitle usersIconName={"hors-piste"} littleIconName={"star-full"} textColor={colorsTheme.text} />
        <FlatList
          data={listOffPistes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[appStyles.renderItem, { borderLeftColor: 'transparent'}]}>
              <Row>
                <Text style={appStyles.text}>{item.name}</Text>
                <Text style={appStyles.text}>{item.count > 0 ? item.count : ""}</Text>
              </Row>
            </View>
          )}
        />
      </Tile>
    </Body>
  );
}