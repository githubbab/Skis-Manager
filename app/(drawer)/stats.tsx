import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import Card from "@/components/Card";
import Pastille from "@/components/Pastille";
import Row from "@/components/Row";
import Separator from "@/components/Separator";
import Tile from "@/components/Tile";
import TileIconTitle from "@/components/TileIconTitle";
import AppStyles from "@/constants/AppStyles";
import { ThemeContext } from "@/context/ThemeContext";
import { getAllSeasons, Seasons } from "@/hooks/dbSeasons";
import { getTopSkis, Skis } from "@/hooks/dbSkis";
import { getTopUsers, Users } from "@/hooks/dbUsers";
import { getLang } from "@/hooks/SettingsManager";
import { localeDate, t } from "@/hooks/ToolsBox";
import { Picker } from '@react-native-picker/picker';
import { useSQLiteContext } from "expo-sqlite";
import { useContext, useEffect, useState } from "react";
import { FlatList, Image, ListRenderItem, Text, View } from 'react-native';

const iconSize: number = 32;

export default function Stats() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();

  const [seasons, setSeasons] = useState<Seasons[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Seasons | null>(null);
  const [topUsers, setTopUsers] = useState<Users[]>([]);
  const [topSkis, setTopSkis] = useState<Skis[]>([]);
  const [selectedSkis, setSelectedSkis] = useState<string>("");

  useEffect(() => {
    console.debug("Loading seasons");
    (async () => {
      const data = await getAllSeasons(db);
      setSeasons(data);
      if (data.length > 0) setSelectedSeason(data[0]);
    })();
  }, []);

  useEffect(() => {
    console.debug("Loading top users and skis for season", selectedSeason);
    if (selectedSeason) {
      (async () => {
        setTopUsers(await getTopUsers(db, selectedSeason));
        setTopSkis(await getTopSkis(db, selectedSeason));
      })();
    }
  }, [selectedSeason]);



  //                                            #####                               
  // #####  ###### #    # #####  ###### #####  #     # #    # # ###### #####   #### 
  // #    # #      ##   # #    # #      #    # #       #   #  # #      #    # #     
  // #    # #####  # #  # #    # #####  #    #  #####  ####   # #####  #    #  #### 
  // #####  #      #  # # #    # #      #####        # #  #   # #      #####       #
  // #   #  #      #   ## #    # #      #   #  #     # #   #  # #      #   #  #    #
  // #    # ###### #    # #####  ###### #    #  #####  #    # # ###### #    #  #### 
  const renderSkiers: ListRenderItem<Users> = ({ item }) => (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 85 }}>
      <Pastille size={iconSize + 8} name={item.name} color={item.pcolor} />
      <Pastille size={iconSize} name={item.nbOutings?.toString() || "0"} color={colorsTheme.pastille} textColor={colorsTheme.text}
        style={{ marginTop: -16, marginRight: -40 }} />
      <AppIcon name={'sortie'} color={colorsTheme.transparentBlack} styles={{ fontSize: 16, marginTop: -16, marginRight: -64 }} />
      <Text numberOfLines={1} style={{
        color: colorsTheme.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: -8,
        marginRight: -16
      }}>{item.name}</Text>
    </View>
  )

  //                                            #####                 
  // #####  ###### #    # #####  ###### #####  #     # #    # #  #### 
  // #    # #      ##   # #    # #      #    # #       #   #  # #     
  // #    # #####  # #  # #    # #####  #    #  #####  ####   #  #### 
  // #####  #      #  # # #    # #      #####        # #  #   #      #
  // #   #  #      #   ## #    # #      #   #  #     # #   #  # #    #
  // #    # ###### #    # #####  ###### #    #  #####  #    # #  #### 
  const renderSkis: ListRenderItem<Skis> = ({ item }) => {
    return (
      <View>
        <Row style={{ marginRight: 8 }}>
          {item.icoTypeOfSkisUri ?
            <Image source={{ uri: item.icoTypeOfSkisUri }} style={{ width: iconSize, height: iconSize }} /> :
            <Pastille size={iconSize} name={item.typeOfSkis || ""} color={"#fbe2cb"} />
          }
          <Image source={{ uri: item.icoBrandUri }}
            style={{ width: iconSize, height: iconSize, marginStart: -8 }} />

          <Text numberOfLines={1}
            style={{ color: colorsTheme.text, fontSize: 20, flex: 4, fontWeight: 'bold' }}
          >
            {item.typeOfSkis} {item.idBrand === "init-unknown" ? "" : item.brand + " "}{item.size ? item.size + " " : ""}{item.radius ? item.radius + "m " : ""}{item.name}
          </Text>


            {item.listUserNames?.map((value: string, index: number) => {
              return <Pastille key={"SKIS" + value + index} name={value} size={iconSize}
                style={{ marginRight: -10, zIndex: index * -1 }} />;
            })}
        </Row>
        <Row style={{ zIndex: 99 }}>
          <Card>
            <AppIcon name={"ski-boot"} color={colorsTheme.text} size={20} />
            <Text numberOfLines={1}
              style={{
                color: colorsTheme.text,
                fontSize: 20,
              }}
            >
              {(item.listBoots) ? item.listBoots.length.toString() : 0}
            </Text>
          </Card>
          <Text numberOfLines={1}
            style={{
              color: selectedSeason?.end && item?.end && selectedSeason.end > item.end ? colorsTheme.alert : colorsTheme.text,
              fontSize: item.end ? 16 : 20,
              marginRight: 8,
              flex: 1,
            }}
          >
            {localeDate(item.begin, { month: 'short', year: 'numeric' })}
            {selectedSeason?.end && item?.end && selectedSeason.end > item.end && " -> " + localeDate(item.end, { month: 'short', year: 'numeric' })}
          </Text>
          <Card>
            <AppIcon name={'sortie'} color={colorsTheme.text} size={20} />
            <Text numberOfLines={1}
              style={{
                color: colorsTheme.text,
                fontSize: 20,
              }}
            >
              {`${(item.nbOutings ?? 0) < 10 ? " " : ""}${item.nbOutings ?? 0}`}
            </Text>
          </Card>
          <Card>
            <AppIcon name={'entretien'} color={colorsTheme.text} size={20} />
            <Text numberOfLines={1}
              style={{
                color: colorsTheme.text,
                fontSize: 20,
              }}
            >
              {`${(item.nbMaintains ?? 0) < 10 ? " " : ""}${item.nbMaintains ?? 0}`}
            </Text>
          </Card>
        </Row>
        <Separator />
      </View>
    )
  }


  return (
    <Body>
      <Text style={appStyles.title}>{t('menu_stats')}</Text>
      <Tile>
        <Picker
          selectedValue={selectedSeason}
          onValueChange={setSelectedSeason}
          style={{ marginVertical: 8 }}
          itemStyle={{ color: colorsTheme.text, backgroundColor: colorsTheme.background }}
          mode="dialog"
          dropdownIconColor={colorsTheme.text}
          prompt={t('choose_season')}
        >
          {seasons.map(season =>
            <Picker.Item
              key={season.begin}
              label={`${season.name} (${new Date(season.begin).toLocaleDateString(getLang(), { year: 'numeric', month: 'short' })}${season.end ? " - " + new Date(season.end).toLocaleDateString(getLang(), { year: 'numeric', month: 'short' }) : ''})`}
              value={season}
            />
          )}
        </Picker>
      </Tile>
      <Separator />
      <Tile style={{ height: 96 }}>
        <TileIconTitle littleIconName={"star-full"} usersIconName={"users"} textColor={colorsTheme.text}
          pastilleValue={(topUsers.length > 4) ? topSkis.length.toString() : undefined}
          pastilleColor={colorsTheme.pastille} />
        {(topUsers) ? <FlatList data={topUsers.slice(0, 4)}
          horizontal={true}
          keyExtractor={(item) => item.id}
          style={{ width: '100%' }}
          renderItem={renderSkiers}
        /> : <></>
        }
      </Tile>
      <Separator />
      <Tile flex={2}>
        <TileIconTitle littleIconName={"star-full"} usersIconName={"skis"} textColor={colorsTheme.text}
          pastilleValue={topSkis.length.toString()} pastilleColor={colorsTheme.pastille} />
        {(topSkis) ?
          <FlatList data={topSkis}
            keyExtractor={(item) => item.id}
            style={{ width: "100%", padding: 4 }}
            renderItem={renderSkis}
          /> : <></>
        }
      </Tile>
    </Body>
  );
}