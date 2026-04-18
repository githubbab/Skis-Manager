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
import { getOffPistesForSeason, OffPistes } from "@/hooks/dbOffPistes";
import { getFriendsForSeason, Friends } from "@/hooks/dbFriends";
import { getAllTypeOfOutings, TOO } from "@/hooks/dbTypeOfOuting";
import { getBootsForSeason, Boots } from "@/hooks/dbBoots";
import { Logger, RatingUtils } from "@/hooks/ToolsBox";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useContext, useEffect, useMemo, useState } from "react";
import { ListRenderItem, Pressable, Text, View, Image, TouchableOpacity, ScrollView } from "react-native";
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
  const [seasonOffPistesStats, setSeasonOffPistesStats] = useState<OffPistes[]>([]);
  const [seasonFriendsStats, setSeasonFriendsStats] = useState<Friends[]>([]);
  const [seasonBootsStats, setSeasonBootsStats] = useState<Boots[]>([]);
  const [typeOfOutingList, setTypeOfOutingList] = useState<TOO[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modaleVisible, setModaleVisible] = useState<boolean>(false);
  const [offPistesDrawerOpen, setOffPistesDrawerOpen] = useState<boolean>(false);
  const [friendsDrawerOpen, setFriendsDrawerOpen] = useState<boolean>(false);
  const [bootsDrawerOpen, setBootsDrawerOpen] = useState<boolean>(false);

  // Créer un mapping nom d'utilisateur -> couleur
  const userColorMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    seasonUsersStats.forEach(user => {
      map.set(user.name, user.pcolor);
    });
    return map;
  }, [seasonUsersStats]);

  // Calculer le nombre total de hors-pistes
  const numberOfOffPistes = useMemo(() => {
    return seasonOffPistesStats.reduce((acc, offPiste) => acc + offPiste.count, 0);
  }, [seasonOffPistesStats]);

  // Calculer le nombre d'amis uniques
  const uniqueFriendIds = useMemo(() => {
    return Array.from(new Set(seasonFriendsStats.map(f => f.id)));
  }, [seasonFriendsStats]);

  // Calculer le nombre total d'utilisations des chaussures
  const numberOfBootsUsages = useMemo(() => {
    return seasonBootsStats.reduce((acc, boots) => acc + (boots.nbOutings ?? 0), 0);
  }, [seasonBootsStats]);

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
      const seasonOffPistes = await getOffPistesForSeason(db, season);
      setSeasonOffPistesStats(seasonOffPistes);
      const seasonFriends = await getFriendsForSeason(db, season);
      setSeasonFriendsStats(seasonFriends);
      const seasonBoots = await getBootsForSeason(db, season);
      setSeasonBootsStats(seasonBoots);
      const tooData = await getAllTypeOfOutings(db);
      // Filtre uniquement les types de sorties utilisés par les amis
      const usedTooIds = new Set(seasonFriends.map(f => f.typeOfOuting).filter(id => id !== undefined));
      const filteredTooData = tooData.filter(too => usedTooIds.has(too.id));
      setTypeOfOutingList(filteredTooData);
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
          const userColor = userColorMap.get(value);
          return <Pastille key={"SKIS" + value + index} name={value} size={iconSize}
            color={userColor}
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
          {seasons.map((item) => (
            <View key={item.id}>
              {renderSeason({ item, index: 0, separators: { highlight: () => { }, unhighlight: () => { }, updateProps: () => { } } })}
            </View>
          ))}
        </Tile>
      </ModalEditor>

      {/* Drawer des chaussures coulissant depuis la gauche */}
      {bootsDrawerOpen && (
        <>
          {/* Overlay */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 5,
            }}
            onPress={() => setBootsDrawerOpen(false)}
            activeOpacity={1}
          />

          {/* Drawer */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '80%',
            maxWidth: 400,
            maxHeight: '100%',
            backgroundColor: colorsTheme.background,
            borderRightWidth: 4,
            borderRightColor: '#6E9D7A',
            borderTopWidth: 4,
            borderTopColor: '#6E9D7A',
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
            elevation: 8,
            zIndex: 6,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            padding: 16,
          }}>
            <ScrollView style={{ marginTop: 8 }}>
              {/* Liste des chaussures */}
              {seasonBootsStats.length > 0 && (
                <Tile>
                  <Row style={{ marginBottom: 12 }}>
                    <AppIcon name={"ski-boot"} color={colorsTheme.text} size={28} styles={{ marginRight: 8 }} />
                    <Text style={[appStyles.title, { flex: 1 }]}>{t("menu_boots")}</Text>
                    <Pastille
                      size={24}
                      name={numberOfBootsUsages.toString()}
                      color={colorsTheme.pastille}
                      textColor={colorsTheme.text}
                    />
                  </Row>
                  {seasonBootsStats.map((item) => (
                    <RowItem key={item.id} isActive={false}>
                      <Row>
                        <Image source={{ uri: item.icoBrandUri }}
                          style={{ width: iconSize, height: iconSize }} />
                        <Text style={[appStyles.text, { flex: 1 }]}>
                          {item.flex ? item.flex + " " : ""}
                          {item.size ? "T" + item.size + " " : ""}
                          {item.name}
                        </Text>
                        {item.listUserNames?.map((value: string, index: number) => {
                          const userColor = userColorMap.get(value);
                          return <Pastille key={"BOOTS" + value + index} name={value} size={iconSize}
                            color={userColor}
                            style={{ marginRight: -10, zIndex: index * -1 }} />;
                        })}
                        <Text style={[appStyles.text, { marginLeft: 16 }]}>{item.nbOutings > 0 ? item.nbOutings : ""}</Text>
                      </Row>
                    </RowItem>
                  ))}
                </Tile>
              )}
            </ScrollView>
          </View>
        </>
      )}

      {/* Drawer des amis coulissant depuis la gauche */}
      {friendsDrawerOpen && (
        <>
          {/* Overlay */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 5,
            }}
            onPress={() => setFriendsDrawerOpen(false)}
            activeOpacity={1}
          />

          {/* Drawer */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '80%',
            maxWidth: 400,
            maxHeight: '100%',
            backgroundColor: colorsTheme.background,
            borderRightWidth: 4,
            borderRightColor: '#B8A4D4',
            borderTopWidth: 4,
            borderTopColor: '#B8A4D4',
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
            elevation: 8,
            zIndex: 6,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            padding: 16,
          }}>
            <ScrollView style={{ marginTop: 8 }}>
              {/* Liste des amis */}
              {seasonFriendsStats.length > 0 && (
                <Tile>
                  <Row style={{ marginBottom: 12 }}>
                    <AppIcon name={"accessibility"} color={colorsTheme.text} size={28} styles={{ marginRight: 8 }} />
                    <Text style={[appStyles.title, { flex: 1 }]}>{t("menu_friends")}</Text>
                    <Pastille
                      size={24}
                      name={uniqueFriendIds.length.toString()}
                      color={colorsTheme.pastille}
                      textColor={colorsTheme.text}
                    />
                  </Row>
                  {uniqueFriendIds.map((friendId) => {
                    const friendOutings = seasonFriendsStats.filter(f => f.id === friendId);
                    const friendName = friendOutings[0]?.name || '';
                    return (
                      <RowItem key={friendId} isActive={false}>
                        <View style={{ marginBottom: 8 }}>
                          {friendOutings.map((f, index) => (
                            <Row key={f.typeOfOuting ?? "no-type"}>
                              <Text style={[appStyles.text, { marginHorizontal: 4, flex: 1 }]}>
                                {index === 0 ? friendName : ""}
                              </Text>
                              <Text style={[appStyles.text, { flex: 2 }]}>
                                {f.typeOfOuting ? typeOfOutingList.find(too => too.id === f.typeOfOuting)?.name : t("type_of_outing_all")}
                              </Text>
                              <Text style={appStyles.text}>{f.nbOutings}</Text>
                            </Row>
                          ))}
                        </View>
                      </RowItem>
                    );
                  })}
                </Tile>
              )}
            </ScrollView>
          </View>
        </>
      )}

      {/* Drawer des hors-pistes coulissant depuis la gauche */}
      {offPistesDrawerOpen && (
        <>
          {/* Overlay */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 5,
            }}
            onPress={() => setOffPistesDrawerOpen(false)}
            activeOpacity={1}
          />

          {/* Drawer */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '80%',
            maxWidth: 400,
            maxHeight: '100%',
            backgroundColor: colorsTheme.background,
            borderRightWidth: 4,
            borderRightColor: colorsTheme.primary,
            borderTopWidth: 4,
            borderTopColor: colorsTheme.primary,
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
            elevation: 8,
            zIndex: 6,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            padding: 16,
          }}>
            <ScrollView style={{ marginTop: 8 }}>
              {/* Liste des hors-pistes */}
              {seasonOffPistesStats.length > 0 && (
                <Tile>
                  <Row style={{ marginBottom: 12 }}>
                    <AppIcon name={"hors-piste"} color={colorsTheme.text} size={28} styles={{ marginRight: 8 }} />
                    <Text style={[appStyles.title, { flex: 1 }]}>{t("offpiste")}</Text>
                    <Pastille
                      size={24}
                      name={numberOfOffPistes.toString()}
                      color={colorsTheme.pastille}
                      textColor={colorsTheme.text}
                    />
                  </Row>
                  {seasonOffPistesStats.map((item) => (
                    <RowItem key={item.id} isActive={false}>
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
                  ))}
                </Tile>
              )}
            </ScrollView>
          </View>
        </>
      )}

      {/* Onglet latéral pour les amis */}
      {seasonFriendsStats.length > 0 && uniqueFriendIds.length > 0 && !offPistesDrawerOpen && !bootsDrawerOpen && (
        <TouchableOpacity
          onPress={() => {
            const isOpening = !friendsDrawerOpen;
            setFriendsDrawerOpen(isOpening);
            if (isOpening) {
              setOffPistesDrawerOpen(false);
              setBootsDrawerOpen(false);
            }
          }}
          style={{
            position: 'absolute',
            left: friendsDrawerOpen ? '80%' : 0,
            bottom: friendsDrawerOpen ? 16 : 184,
            backgroundColor: '#B8A4D4',
            paddingVertical: 8,
            paddingHorizontal: 6,
            paddingLeft: 8,
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
            elevation: 10,
            zIndex: 7,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <AppIcon name={"accessibility"} color={colorsTheme.text} size={22} />
          <Pastille
            size={28}
            name={uniqueFriendIds.length.toString()}
            color={colorsTheme.pastille}
            textColor={colorsTheme.text}
          />
        </TouchableOpacity>
      )}

      {/* Onglet latéral pour les hors-pistes */}
      {seasonOffPistesStats.length > 0 && numberOfOffPistes > 0 && !friendsDrawerOpen && !bootsDrawerOpen && (
        <TouchableOpacity
          onPress={() => {
            const isOpening = !offPistesDrawerOpen;
            setOffPistesDrawerOpen(isOpening);
            if (isOpening) {
              setFriendsDrawerOpen(false);
              setBootsDrawerOpen(false);
            }
          }}
          style={{
            position: 'absolute',
            left: offPistesDrawerOpen ? '80%' : 0,
            bottom: 100,
            backgroundColor: colorsTheme.primary,
            paddingVertical: 8,
            paddingHorizontal: 6,
            paddingLeft: 8,
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
            elevation: 10,
            zIndex: 7,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <AppIcon name={"hors-piste"} color={colorsTheme.text} size={22} />
          <Pastille
            size={28}
            name={numberOfOffPistes.toString()}
            color={colorsTheme.pastille}
            textColor={colorsTheme.text}
          />
        </TouchableOpacity>
      )}

      {/* Onglet latéral pour les chaussures */}
      {seasonBootsStats.length > 0 && numberOfBootsUsages > 0 && !friendsDrawerOpen && !offPistesDrawerOpen && (
        <TouchableOpacity
          onPress={() => {
            const isOpening = !bootsDrawerOpen;
            setBootsDrawerOpen(isOpening);
            if (isOpening) {
              setFriendsDrawerOpen(false);
              setOffPistesDrawerOpen(false);
            }
          }}
          style={{
            position: 'absolute',
            left: bootsDrawerOpen ? '80%' : 0,
            bottom: 16,
            backgroundColor: '#6E9D7A',
            paddingVertical: 8,
            paddingHorizontal: 6,
            paddingLeft: 8,
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
            elevation: 10,
            zIndex: 7,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <AppIcon name={"ski-boot"} color={colorsTheme.text} size={22} />
          <Pastille
            size={28}
            name={numberOfBootsUsages.toString()}
            color={colorsTheme.pastille}
            textColor={colorsTheme.text}
          />
        </TouchableOpacity>
      )}
    </Body>
  );
}