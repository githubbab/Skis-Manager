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
import { Logger } from "@/hooks/ToolsBox";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useContext, useState } from "react";
import { Text , FlatList } from 'react-native';


export default function Offpistes() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();

  const { t } = useContext(AppContext)!;

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
    Logger.debug("Loading off-pistes data from DB");
    const data = await getSeasonOffPistes(db);
    Logger.debug("Off-pistes data loaded:", data);
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
          onRefresh={loadData}
          refreshing={false}
          renderItem={({ item }) => (
            <RowItem isActive={false} onSelect={() => { }}>
              <Row>
                <Text style={appStyles.text}>{item.name}</Text>
                <Text style={appStyles.text}>{item.count > 0 ? item.count : ""}</Text>
              </Row>
            </RowItem>
          )}
        />
      </Tile>
    </Body>
  );
}