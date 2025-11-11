import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import Card from "@/components/Card";
import ModalEditor from "@/components/ModalEditor";
import Pastille from "@/components/Pastille";
import Row from "@/components/Row";
import RowItem from "@/components/RowItem";
import Separator from "@/components/Separator";
import Tile from "@/components/Tile";
import TileIconTitle from "@/components/TileIconTitle";
import AppStyles from "@/constants/AppStyles";
import AppContext from "@/context/AppContext";
import { ThemeContext } from "@/context/ThemeContext";
import { getAllSeasons, initSeason, Seasons } from "@/hooks/dbSeasons";
import { getTopSkis4Stats, Skis } from "@/hooks/dbSkis";
import { getTopUsers, Users } from "@/hooks/dbUsers";
import { Logger } from "@/hooks/ToolsBox";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useContext, useEffect, useState } from "react";
import { ListRenderItem, Pressable, Text, View, Image } from "react-native";
import { FlatList } from "react-native-gesture-handler";

const iconSize: number = 32;

export default function SeasonsStatistics() {
  const { colorsTheme, currentTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();
  const { localeDate, t } = useContext(AppContext);

  const [seasons, setSeasons] = useState<Seasons[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Seasons>(initSeason());
  const [seasonUsersStats, setSeasonUsersStats] = useState<Users[]>([]);
  const [seasonSkisStats, setSeasonSkisStats] = useState<Skis[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modaleVisible, setModaleVisible] = useState<boolean>(false);

  const loadSeasons = async () => {
    try {
      if (loading) return;
      setLoading(true);
      const seasonsFromDB = await getAllSeasons(db);
      setSeasons(seasonsFromDB);
      setLoading(false);
      if (seasonsFromDB.length > 0) {
        setSelectedSeason(seasonsFromDB[0]);
        fetchSeasonStatistics(seasonsFromDB[0]);
      }
    } catch (error) {
      Logger.error("Error loading seasons:", error);
      setLoading(false);
    }
  };

  const fetchSeasonStatistics = async (season: Seasons) => {
    if (loading) return;
    setLoading(true);
    try {
      const seasonUsers = await getTopUsers(db, season);
      setSeasonUsersStats(seasonUsers);
      const seasonSkis = await getTopSkis4Stats(db, season);
      setSeasonSkisStats(seasonSkis);
    } catch (error) {
      Logger.error("Error fetching season statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeasons();
  }, []);

  const renderSeason: ListRenderItem<Seasons> = ({ item }) => (
    <RowItem
      onSelect={() => {
        setSelectedSeason(item);
        fetchSeasonStatistics(item);
        setModaleVisible(false);
      }}
      isActive={selectedSeason.id === item.id}
    >
      <Text style={[appStyles.textBold, { textAlign: 'center', color: selectedSeason.id === item.id ? colorsTheme.primary : colorsTheme.text }]}>
        {item.name}
      </Text>
      <Text style={[appStyles.textItalic, { textAlign: 'center', marginTop: -8, color: selectedSeason.id === item.id ? colorsTheme.primary : colorsTheme.text }]}>
        ({localeDate(item.begin, { year: 'numeric', month: 'short' })}{item.end ? " - " + localeDate(item.end, { year: 'numeric', month: 'short' }) : ''})
      </Text>
    </RowItem>
  );

  const renderUsers: ListRenderItem<Users> = ({ item }) => (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 85 }}>
      <Pastille size={iconSize + 8} name={item.name} color={item.pcolor} />
      <Pastille size={iconSize} name={item.nbOutings?.toString() || "0"} color={colorsTheme.pastille} textColor={colorsTheme.text}
        style={{ marginTop: -16, marginRight: -40 }} />
      <AppIcon name={'sortie'} color={currentTheme === "light" ? colorsTheme.transparentBlack : colorsTheme.transparentWhite} styles={{ fontSize: 16, marginTop: -16, marginRight: -64 }} />
      <Text numberOfLines={1} style={{
        color: colorsTheme.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: -8,
        marginRight: -16
      }}>{item.name}</Text>
    </View>
  );

  const renderSkis: ListRenderItem<Skis> = ({ item }) => (
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



  if (selectedSeason.id === "not-an-id") {
    return (
      <Body>
        <Text style={appStyles.title}>{t('menu_stats')}</Text>
        <Pressable onPress={() => router.navigate({ pathname: '/(drawer)/seasons-management' })}>
          <Text style={appStyles.text}>{t('define_season')}</Text>
        </Pressable>
      </Body>
    );
  }

  return (
    <Body>
      <Text style={appStyles.title}>{t('menu_stats')}</Text>
      <Tile>
        <Pressable onPress={() => setModaleVisible(true)}>
            <Text style={[appStyles.textBold, { textAlign: 'center'}]}>
              {selectedSeason.name}
            </Text>
            <Text style={[appStyles.textItalic, { textAlign: 'center', marginTop: -8}]}>
              ({localeDate(selectedSeason.begin, { year: 'numeric', month: 'short' })}{selectedSeason.end ? " - " + localeDate(selectedSeason.end, { year: 'numeric', month: 'short' }) : ''})
            </Text>
        </Pressable>
      </Tile>
      <Separator />
      <Tile style={{ height: 96 }}>
        <TileIconTitle littleIconName={"star-full"} usersIconName={"users"} textColor={colorsTheme.text}
          pastilleValue={(seasonUsersStats.length > 4) ? seasonUsersStats.length.toString() : undefined}
          pastilleColor={colorsTheme.pastille} />
        <FlatList
          data={seasonUsersStats}
          horizontal={true}
          keyExtractor={(item) => item.id}
          renderItem={renderUsers}
        />
      </Tile>
      <Separator />
      <Tile flex={3}>
        <TileIconTitle littleIconName={"star-full"} usersIconName={"skis"} textColor={colorsTheme.text}
          pastilleValue={seasonSkisStats.length.toString()} pastilleColor={colorsTheme.pastille} />
        <FlatList
          data={seasonSkisStats}
          keyExtractor={(item) => item.id}
          renderItem={renderSkis}
        />
      </Tile>
      <ModalEditor visible={modaleVisible}>
        <Text style={appStyles.title}>{t('choose_season')}</Text>
        <Tile>
          <FlatList
            data={seasons}
            keyExtractor={(item) => item.id}
            onRefresh={loadSeasons}
            refreshing={false}
            renderItem={renderSeason}
          />
        </Tile>
      </ModalEditor>
    </Body>
  );
}