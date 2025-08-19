import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import Card from "@/components/Card";
import ModalEditor from "@/components/ModalEditor";
import Pastille from "@/components/Pastille";
import Row from "@/components/Row";
import Separator from "@/components/Separator";
import Tile from "@/components/Tile";
import TileIconTitle from "@/components/TileIconTitle";
import AppStyles from "@/constants/AppStyles";
import { useEnvContext } from "@/context/EnvContext";
import { ThemeContext } from "@/context/ThemeContext";
import { getLastDBWrite } from "@/hooks/DatabaseManager";
import { Boots, getAllBoots } from "@/hooks/dbBoots";
import { Friends, getAllFriends } from "@/hooks/dbFriends";
import { getAllOffPistes, OffPistes } from "@/hooks/dbOffPistes";
import { getAllOutings, initOuting, Outings } from "@/hooks/dbOutings";
import { getAllSkis, Skis } from "@/hooks/dbSkis";
import { getAllTypeOfOutings, TOO } from "@/hooks/dbTypeOfOuting";
import { getAllUsers, Users } from "@/hooks/dbUsers";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useContext, useState } from "react";
import { Image, ListRenderItem, Text, TouchableOpacity, View } from 'react-native';
import { FlatList } from "react-native-gesture-handler";
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

const iconSize = 32; // Size for icons in the filter row

export default function OutingsTabs() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const [dbState, setDbState] = useState("none");
  const { lang, t, seasonDate, smDate } = useEnvContext();
  const db = useSQLiteContext();
  const [lastCheck, setLastCheck] = useState<number>(0);

  const [listOutings, setListOutings] = useState<Outings[]>([]);
  const [tooFilter, setTooFilter] = useState<TOO | null>(null);
  const [viewTooFilter, setViewTooFilter] = useState<boolean>(false);
  const [userFilter, setUserFilter] = useState<Users | null>(null);
  const [viewUserFilter, setViewUserFilter] = useState<boolean>(false);
  const [skisFilter, setSkisFilter] = useState<Skis | null>(null);
  const [viewSkisFilter, setViewSkisFilter] = useState<boolean>(false);

  const [outing2write, setOuting2Write] = useState<Outings>(initOuting());
  const [selectedOuting, setSelectedOuting] = useState<Outings | null>(null);
  const [listUsers, setListUsers] = useState<Users[]>([]);
  const [listSkis, setListSkis] = useState<Skis[]>([]);
  const [listBoots, setListBoots] = useState<Boots[]>([]);
  const [listOutingTypes, setListOutingTypes] = useState<TOO[]>([]);
  const [listFriends, setListFriends] = useState<Friends[]>([]);
  const [listOffPistes, setListOffPistes] = useState<OffPistes[]>([]);
  const [friendsVisible, setFriendsVisible] = useState<boolean>(false);
  const [outingVisible, setOutingVisible] = useState<boolean>(false);
  const [offPisteVisible, setOffPisteVisible] = useState<boolean>(false);
  const [selectedSkis, setSelectedSkis] = useState<string>("");
  const [partOfDay, setPartOfDay] = useState<"am" | "noon" | "pm">("am");
  const [outingViewUser, setOutingViewUser] = useState<boolean>(false);
  const [outingViewSkis, setOutingViewSkis] = useState<boolean>(false);
  const [outingViewBoots, setOutingViewBoots] = useState<boolean>(false);
  const [outingViewToOuting, setOutingViewToOuting] = useState<boolean>(false);
  const [outingViewOffPiste, setOutingViewOffPiste] = useState<boolean>(false);
  const [outingViewFriends, setOutingViewFriends] = useState<boolean>(false);
  const [effectActive, setEffectActive] = useState<boolean>(false);

  const handleCancelFilters = () => {
    setViewUserFilter(false);
    setViewSkisFilter(false);
    setViewTooFilter(false);
  };

  const skis4filter = listSkis.filter(s => listOutings.some(o => o.idSkis === s.id));
  const users4filter = listUsers.filter(u => listOutings.some(o => o.idUser === u.id));
  const too4filter = listOutingTypes.filter(t => listOutings.some(o => o.idOutingType === t.id));
  const list2View = listOutings.filter(s => {
    let ret = true;
    if (tooFilter) {
      ret = s.idOutingType === tooFilter.id;
    }
    if (userFilter) {
      ret = s.idUser === userFilter.id && ret;
    }
    if (skisFilter) {
      ret = ret && s.idSkis === skisFilter.id;
    }
    return ret;
  }) || [];

  // #                            ######                     
  // #        ####    ##   #####  #     #   ##   #####   ##  
  // #       #    #  #  #  #    # #     #  #  #    #    #  # 
  // #       #    # #    # #    # #     # #    #   #   #    #
  // #       #    # ###### #    # #     # ######   #   ######
  // #       #    # #    # #    # #     # #    #   #   #    #
  // #######  ####  #    # #####  ######  #    #   #   #    #
  const loadData = async () => {
    setDbState("loading");
    try {
      const outings = await getAllOutings(db, smDate(seasonDate));
      setListOutings(outings);
      console.debug("Loaded outings:", outings);
      setListUsers(await getAllUsers(db, smDate(seasonDate)));
      setListSkis(await getAllSkis(db, smDate(seasonDate)));
      setListBoots(await getAllBoots(db, smDate(seasonDate)));
      setListOutingTypes(await getAllTypeOfOutings(db));
      setListFriends(await getAllFriends(db));
      setListOffPistes(await getAllOffPistes(db));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setDbState("done");
    }
  };

  const toggleTooFilter = () => {
    setViewTooFilter(!viewTooFilter);
    setViewSkisFilter(false);
    setViewUserFilter(false);
  };

  const toggleUsersFilter = () => {
    setViewUserFilter(!viewUserFilter);
    setViewSkisFilter(false);
    setViewTooFilter(false);
  };

  const toggleSkisFilter = () => {
    setViewSkisFilter(!viewSkisFilter);
    setViewUserFilter(false);
    setViewTooFilter(false);
  };

  const extractOffPistes = (listOfOffPistes: { id: string, nb: number }[]) => {
    if (!listOfOffPistes || listOfOffPistes.length === 0) return [];
    const extractedOffPistes: OffPistes[] = [];
    for (const off of listOfOffPistes) {
      const offPiste = listOffPistes.find(o => o.id === off.id);
      if (!offPiste) {
        console.warn("OffPiste not found:", off.id);
        continue;
      }
      extractedOffPistes.push({ ...offPiste, count: off.nb });
    }
    return extractedOffPistes;
  };


  // #     #               #######                             #######                                  
  // #     #  ####  ###### #        ####   ####  #    #  ####  #       ###### ###### ######  ####  #####
  // #     # #      #      #       #    # #    # #    # #      #       #      #      #      #    #   #  
  // #     #  ####  #####  #####   #    # #      #    #  ####  #####   #####  #####  #####  #        #  
  // #     #      # #      #       #    # #      #    #      # #       #      #      #      #        #  
  // #     # #    # #      #       #    # #    # #    # #    # #       #      #      #      #    #   #  
  //  #####   ####  ###### #        ####   ####   ####   ####  ####### #      #      ######  ####    #  
  useFocusEffect(
    useCallback(() => {
      if (dbState === "loading") return;
      const lastWrite = getLastDBWrite();
      if (lastWrite > lastCheck) {
        console.log('La base a été modifiée, je recharge mes données');
        loadData().then(() => setLastCheck(lastWrite))
      }
    }, [])
  )

  //                                           #######                                    
  // #####  ###### #    # #####  ###### #####  #     # #    # ##### # #    #  ####   #### 
  // #    # #      ##   # #    # #      #    # #     # #    #   #   # ##   # #    # #     
  // #    # #####  # #  # #    # #####  #    # #     # #    #   #   # # #  # #       #### 
  // #####  #      #  # # #    # #      #####  #     # #    #   #   # #  # # #  ###      #
  // #   #  #      #   ## #    # #      #   #  #     # #    #   #   # #   ## #    # #    #
  // #    # ###### #    # #####  ###### #    # #######  ####    #   # #    #  ####   #### 
  const renderOutings: ListRenderItem<Outings> = ({ item }) => {
    const outingSkis: Skis | undefined = listSkis.find(s => s.id === item.idSkis);
    if (!outingSkis) {
      console.warn("No skis found for outing:", item.id, item.idSkis);
      return null;
    }
    const outingBoots: Boots | undefined = listBoots.find(b => b.id === item.idBoots);
    if (!outingBoots) {
      console.warn("No boots found for outing:", item.id, item.idBoots);
      return null;
    }
    const outingType: TOO | undefined = listOutingTypes.find(t => t.id === item.idOutingType);
    const outingUser: Users | undefined = listUsers.find(u => u.id === item.idUser);
    if (!outingUser) {
      console.warn("No user found for outing:", item.id);
      return null;
    }
    const outingFriends: Friends[] = listFriends.filter(f => item.idFriends?.includes(f.id));
    console.debug("Outing Off-Pistes", item.listOfOffPistes)
    const outingOffPistes: OffPistes[] = extractOffPistes(item.listOfOffPistes || []);
    return (
      <ReanimatedSwipeable
        renderLeftActions={() => (
          <TouchableOpacity
            onPress={() => {
              setSelectedOuting(item);
              setOutingVisible(true);
            }}
            style={appStyles.swipePrimary}
          >
            <AppIcon name={"pencil"} color={colorsTheme.text} size={iconSize} />
          </TouchableOpacity>
        )}
        renderRightActions={() => (
          <TouchableOpacity
            onPress={() => {
              setSelectedOuting(item);
              setOutingVisible(true);
            }}
            style={appStyles.swipeAlert}
          >
            <AppIcon name={"bin"} color={colorsTheme.text} size={iconSize} />
          </TouchableOpacity>
        ) }
        
      >
        <TouchableOpacity
          onPress={() => {
            if (selectedOuting?.id !== item.id) {
              setSelectedOuting(item)
            }
            else {
              setSelectedOuting(null)
            }

          }}
          style={{ backgroundColor: selectedOuting?.id === item.id ? colorsTheme.transparentGray : 'transparent' }}
        >
          <Row style={{ marginVertical: 2 }}>
            <Text style={appStyles.title}>{new Date(item.date).toLocaleDateString(lang, { month: 'short', day: '2-digit' })}</Text>
            {!skisFilter &&
              <>
                <Text style={appStyles.text}>-</Text>
                {outingSkis.icoTypeOfSkisUri ?
                  <Image source={{ uri: outingSkis.icoTypeOfSkisUri }} style={{ width: iconSize, height: iconSize }} /> :
                  <Pastille size={iconSize} name={outingSkis.typeOfSkis || ""} />
                }
                <Image source={{ uri: outingSkis.icoBrandUri }}
                  style={{ width: iconSize, height: iconSize }} />
                <Text numberOfLines={1}
                  style={{ color: colorsTheme.text, fontSize: 20, flex: 4, fontWeight: 'bold' }}
                >
                  {outingSkis.size ? outingSkis.size + " " : ""}{outingSkis.radius ? outingSkis.radius + "m " : ""}{outingSkis.name}
                </Text>
              </>
            }
            <Pastille size={iconSize} name={outingUser.name} color={outingUser.pcolor} />
          </Row>
          <Row>
            <Text style={[appStyles.text]}>
              {outingType?.name || ""}
              {outingOffPistes.length > 0 && `(${outingOffPistes.reduce((sum, off) => sum + (off.count || 0), 0)})`}
            </Text>
            <Row isFlex={false} >
              <AppIcon name={"ski-boot"} color={colorsTheme.text} />
              <Image source={{ uri: outingBoots.icoBrandUri }}
                style={{ width: iconSize, height: iconSize }} />
              <Text style={[appStyles.title,]}>
                {outingBoots.flex ? outingBoots.flex + " " : ""}
                {outingBoots.size ? "T" + outingBoots.size + " " : ""}
                {outingBoots.name}
              </Text>
            </Row>
          </Row>

          {selectedOuting?.id === item.id &&
            <View>
              <Row>
                <AppIcon name={"hors-piste"} color={colorsTheme.text} />
                <View style={{ flex: 1 }}>
                  {outingOffPistes.map(off => (
                    <Text key={off.id} style={appStyles.text}>{off.name}({off.count})</Text>
                  ))}
                </View>
                {outingFriends.length > 0 && (
                  <Card>
                    <AppIcon name={"accessibility"} color={colorsTheme.text} />
                    {outingFriends.map(friend => (
                      <Pastille key={friend.id} name={friend.name} />
                    ))}
                  </Card>
                )}
              </Row>
              <TouchableOpacity onPress={() => { }}>
                <AppIcon name={"pencil"} color={colorsTheme.primary} size={iconSize} styles={{ margin: "auto" }} />
              </TouchableOpacity>
            </View>
          }
          <Separator />

        </TouchableOpacity>
      </ReanimatedSwipeable>
    )
  }


  // #####  ###### ##### #    # #####  #    #
  // #    # #        #   #    # #    # ##   #
  // #    # #####    #   #    # #    # # #  #
  // #####  #        #   #    # #####  #  # #
  // #   #  #        #   #    # #   #  #   ##
  // #    # ######   #    ####  #    # #    #

  if (dbState !== "done") {
    console.debug("Data loading, wait !")
    return <Text>Loading...</Text>;
  }

  return (
    <Body inTabs={true}>
      <Tile >
        <Row >
          <AppIcon name={"skis"} color={colorsTheme.text} size={32} />
          <TouchableOpacity onPress={toggleSkisFilter}>
            {(skisFilter) ?
              <Row isFlex={true}>
                {skisFilter.icoTypeOfSkisUri ?
                  <Image source={{ uri: skisFilter.icoTypeOfSkisUri }} style={{ width: iconSize, height: iconSize }} /> :
                  <Pastille size={iconSize} name={skisFilter.typeOfSkis || ""} color={"#fbe2cb"} />
                }
                <Image source={{ uri: skisFilter.icoBrandUri }}
                  style={{ width: iconSize, height: iconSize }} />
                <Text numberOfLines={1}
                  style={appStyles.text}
                >
                  {skisFilter.size ? skisFilter.size + " " : ""}{skisFilter.radius ? skisFilter.radius + "m " : ""}{skisFilter.name}
                </Text>
              </Row>
              :
              <Row isFlex={true}>
                <Text style={appStyles.inactiveText}>
                  {t("filter_skis")}
                </Text>
              </Row>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setSkisFilter(null);
          }}>
            <AppIcon name={"cancel-circle"} color={colorsTheme.inactiveText} styles={{ fontSize: 20 }} />
          </TouchableOpacity>

        </Row>
      </Tile>
      <Tile >
        <Row >
          <AppIcon name={"users"} color={colorsTheme.text} styles={{ fontSize: 32, width: 'auto' }} />
          <TouchableOpacity onPress={toggleUsersFilter}>
            {(userFilter) ?
              <Row isFlex={true}>
                <Pastille size={iconSize} name={userFilter.name} color={userFilter.pcolor} />
                <Text numberOfLines={1} style={appStyles.text}>
                  {userFilter.name}
                </Text>
              </Row>
              :
              <Text style={appStyles.inactiveText}>
                {t("filter_users")}
              </Text>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setUserFilter(null);
          }}>
            <AppIcon name={"cancel-circle"} color={colorsTheme.inactiveText} styles={{ fontSize: 20 }} />
          </TouchableOpacity>

        </Row>
      </Tile>

      <Tile >
        <Row >
          <AppIcon name={"slope"} color={colorsTheme.text} styles={{ fontSize: 32, width: 'auto' }} />
          <TouchableOpacity onPress={toggleTooFilter}>
            {(tooFilter) ?
              <Row isFlex={true}>
                <Text numberOfLines={1} style={appStyles.text}>
                  {tooFilter.name}
                </Text>
              </Row>
              :
              <Text style={appStyles.inactiveText}>
                {t("filter_too")}
              </Text>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setTooFilter(null);
          }}>
            <AppIcon name={"cancel-circle"} color={colorsTheme.inactiveText} styles={{ fontSize: 20 }} />
          </TouchableOpacity>

        </Row>
      </Tile>
      <Tile flex={1} style={{ marginTop: 16, marginBottom: 8 }} >
        <TileIconTitle
          littleIconName={"calendar"}
          usersIconName={"slope"}
          pastilleColor={colorsTheme.pastille}
          pastilleValue={list2View.length.toString()}
          textColor={colorsTheme.text}
        />

        <FlatList
          data={list2View}
          renderItem={renderOutings}
          keyExtractor={(item) => item.id}
        />

      </Tile>
      <ModalEditor visible={viewSkisFilter}>
        <Text style={appStyles.title}>{t("filter_skis")}</Text>
        <Tile style={{ marginBottom: 16 }}>
          <FlatList
            data={skis4filter || []}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => {
                setSkisFilter(item);
                setViewSkisFilter(false);
              }}>
                <Row>
                  {item.icoTypeOfSkisUri ?
                    <Image source={{ uri: item.icoTypeOfSkisUri }} style={{ width: iconSize, height: iconSize }} /> :
                    <Pastille size={iconSize} name={item.typeOfSkis || ""} color={"#fbe2cb"} />
                  }
                  <Image source={{ uri: item.icoBrandUri }}
                    style={{ width: iconSize, height: iconSize }} />
                  <Text numberOfLines={1}
                    style={{ color: colorsTheme.text, fontSize: 20, flex: 4, fontWeight: 'bold' }}
                  >
                    {item.size ? item.size + " " : ""}{item.radius ? item.radius + "m " : ""}{item.name}
                  </Text>
                </Row>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </Tile>
        <AppButton onPress={handleCancelFilters} caption={t("cancel")} />
      </ModalEditor>
      <ModalEditor visible={viewUserFilter}>
        <Text style={appStyles.title}>{t("filter_users")}</Text>
        <Tile style={{ marginBottom: 16 }}>
          <FlatList
            data={users4filter || []}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => {
                setUserFilter(item);
                setViewUserFilter(false);
              }}>
                <Row>
                  <Pastille size={iconSize} name={item.name} color={item.pcolor} />
                  <Text numberOfLines={1} style={{ color: colorsTheme.text, fontSize: 20, flex: 1 }}>
                    {item.name}
                  </Text>
                </Row>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </Tile>
        <AppButton onPress={handleCancelFilters} caption={t("cancel")} />
      </ModalEditor>
      <ModalEditor visible={viewTooFilter}>
        <Text style={appStyles.title}>{t("filter_too")}</Text>
        <Tile style={{ marginBottom: 16 }}>
          <FlatList
            data={too4filter || []}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => {
                setTooFilter(item);
                setViewTooFilter(false);
              }}>
                <Row>
                  <Text numberOfLines={1} style={{ color: colorsTheme.text, fontSize: 20, flex: 1 }}>
                    {item.name}
                  </Text>
                </Row>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </Tile>
        <AppButton onPress={handleCancelFilters} caption={t("cancel")} />
      </ModalEditor>
    </Body>
  );
}