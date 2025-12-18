import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import Card from "@/components/Card";
import CheckButton from "@/components/CheckButton";
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
import { Boots, getAllBoots } from "@/hooks/dbBoots";
import { Friends, getAllFriends } from "@/hooks/dbFriends";
import { initMaintain, insertMaintain, Maintains } from "@/hooks/dbMaintains";
import { getAllOffPistes, OffPistes } from "@/hooks/dbOffPistes";
import { initOuting, insertOuting, Outings } from "@/hooks/dbOutings";
import { getSeasonSkis, getSkis2Sharp, getSkis2Wax, getTopSkis, initSkis, Skis } from "@/hooks/dbSkis";
import { getAllTypeOfOutings, TOO } from "@/hooks/dbTypeOfOuting";
import { getAllUsers, getTopUsers, Users } from "@/hooks/dbUsers";
import { Logger, smDate, PartOfDay, PartOfDayUtils } from "@/hooks/ToolsBox";
import PartOfDaySelector from "@/components/PartOfDaySelector";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { FlatList, Image, ListRenderItem, Text, TouchableOpacity, View, TextInput, ScrollView } from 'react-native';

const iconSize: number = 32;
const waitSyncTime = 5 * 60 * 1000; // 5 minutes

// IDs spéciaux pour les locations et prêts
const RENTAL_SKIS_ID = "RENTAL-SKIS";
const RENTAL_BOOTS_ID = "RENTAL-BOOTS";
const LOAN_USER_ID = "LOAN-USER";

const getCountColor = (count: number) => {
  const safeColor = Math.max(0, Math.min(255, 137 - count * 10));
  return `rgb(255,${safeColor},0)`;
}

export default function Index() {
  const { colorsTheme, currentTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const [addOutingMode, setAddOutingMode] = useState<boolean>(false);
  const [addMaintainMode, setAddMaintainMode] = useState<boolean>(false);

  const db = useSQLiteContext()
  const [topUsers, setTopUsers] = useState<Users[]>([]);
  const [topSkis, setTopSkis] = useState<Skis[]>([]);
  const [toSharp, setToSharp] = useState<Skis[]>([]);
  const [toWax, setToWax] = useState<Skis[]>([]);
  const [dbState, setDbState] = useState<'none' | 'loading' | 'done'>('none');

  const [dateTimePickerVisible, setDateTimePickerVisible] = useState<"none" | "outing" | "maintain">("none");
  const [outing2write, setOuting2Write] = useState<Outings>(initOuting());
  const [maintain2write, setMaintain2Write] = useState<Maintains>(initMaintain());
  const [listUsers, setListUsers] = useState<Users[]>([]);
  const [listSkis, setListSkis] = useState<Skis[]>([]);
  const [listBoots, setListBoots] = useState<Boots[]>([]);
  const [listOutingTypes, setListOutingTypes] = useState<TOO[]>([]);
  const [listFriends, setListFriends] = useState<Friends[]>([]);
  const [listOffPistes, setListOffPistes] = useState<OffPistes[]>([]);
  const [friendsVisible, setFriendsVisible] = useState<boolean>(false);
  const [outingVisible, setOutingVisible] = useState<boolean>(false);
  const [offPisteVisible, setOffPisteVisible] = useState<boolean>(false);
  const [selectedSkis, setSelectedSkis] = useState<Skis>(initSkis(0));
  const [partOfDay, setPartOfDay] = useState<PartOfDay>("morning");
  const [outingViewUser, setOutingViewUser] = useState<boolean>(false);
  const [outingViewSkis, setOutingViewSkis] = useState<boolean>(false);
  const [outingViewBoots, setOutingViewBoots] = useState<boolean>(false);
  const [outingViewToOuting, setOutingViewToOuting] = useState<boolean>(false);
  const [outingViewOffPiste, setOutingViewOffPiste] = useState<boolean>(false);
  const [outingViewFriends, setOutingViewFriends] = useState<boolean>(false);
  const [effectActive, setEffectActive] = useState<boolean>(false);
  const [lastSyncDate, setLastSyncDate] = useState<number>(Date.now());

  const { t, localeDate, seasonDate, viewFriends, viewOuting, webDavSync, webDavSyncEnabled, lastWebDavSync } = useContext(AppContext)!;

  const filterOutingSkis = (idUser: string) => {
    // Si c'est un prêt, retourner tous les skis
    if (idUser === LOAN_USER_ID) {
      return listSkis.sort((a, b) => {
        const aNb = a.nbOutings || 0;
        const bNb = b.nbOutings || 0;
        return bNb - aNb;
      });
    }
    return listSkis.filter(ski => ski.listUsers?.includes(idUser)).sort((a, b) => {
      const aNb = a.nbOutings || 0;
      const bNb = b.nbOutings || 0;
      return bNb - aNb;
    });
  };
  const filterOutingBoots = (idUser: string, idSkis?: string) => {
    // Si c'est un prêt, retourner toutes les chaussures
    if (idUser === LOAN_USER_ID) {
      const allBoots = [...listBoots];

      // Si des skis sont sélectionnés, trier pour mettre en premier les chaussures compatibles
      if (idSkis && idSkis !== RENTAL_SKIS_ID) {
        const ski = listSkis.find(ski => ski.id === idSkis);
        const compatibleBootsIds = ski?.listBoots || [];

        return allBoots.sort((a, b) => {
          // Priorité 1: Chaussures compatibles avec les skis
          const aCompatible = compatibleBootsIds.includes(a.id || "");
          const bCompatible = compatibleBootsIds.includes(b.id || "");
          if (aCompatible && !bCompatible) return -1;
          if (!aCompatible && bCompatible) return 1;

          // Priorité 2: Nombre de sorties
          const aNb = a.nbOutings || 0;
          const bNb = b.nbOutings || 0;
          return bNb - aNb;
        });
      }

      // Sinon, trier simplement par nombre de sorties
      return allBoots.sort((a, b) => {
        const aNb = a.nbOutings || 0;
        const bNb = b.nbOutings || 0;
        return bNb - aNb;
      });
    }

    // Retourne toutes les chaussures de l'utilisateur
    const userBoots = listBoots.filter(boots => boots.listUsers?.includes(idUser));

    // Si des skis sont sélectionnés, trier pour mettre en premier les chaussures compatibles
    if (idSkis && idSkis !== RENTAL_SKIS_ID) {
      const ski = listSkis.find(ski => ski.id === idSkis);
      const compatibleBootsIds = ski?.listBoots || [];

      return userBoots.sort((a, b) => {
        // Priorité 1: Chaussures compatibles avec les skis
        const aCompatible = compatibleBootsIds.includes(a.id || "");
        const bCompatible = compatibleBootsIds.includes(b.id || "");
        if (aCompatible && !bCompatible) return -1;
        if (!aCompatible && bCompatible) return 1;

        // Priorité 2: Nombre de sorties
        const aNb = a.nbOutings || 0;
        const bNb = b.nbOutings || 0;
        return bNb - aNb;
      });
    }

    // Sinon, trier simplement par nombre de sorties
    return userBoots.sort((a, b) => {
      const aNb = a.nbOutings || 0;
      const bNb = b.nbOutings || 0;
      return bNb - aNb;
    });
  };
  const filterMaintainSkis = () => listSkis.sort((a, b) => {
    const aScore = (a.nbOutingsSinceLastSharp || 0) * 10 + (a.nbOutingsSinceLastWax || 0);
    const bScore = (b.nbOutingsSinceLastSharp || 0) * 10 + (b.nbOutingsSinceLastWax || 0);
    return bScore - aScore;
  });

  const loadData = async () => {
    if (dbState === "loading") {
      Logger.debug("index - loadData already in progress, skipping");
      return;
    }
    if (webDavSyncEnabled && (Date.now() > lastSyncDate + waitSyncTime)) {
      setLastSyncDate(Date.now());
      await webDavSync();
    }

    try {
      setDbState("loading");
      const topUsersResult: Users[] = await getTopUsers(db);
      setTopUsers(topUsersResult);
      const topSkisResult: Skis[] = await getTopSkis(db);
      setTopSkis(topSkisResult);
      const toSharpResult: Skis[] = await getSkis2Sharp(db);
      setToSharp(toSharpResult);
      const toWaxResult: Skis[] = await getSkis2Wax(db);
      setToWax(toWaxResult);
      const usersResult: Users[] = await getAllUsers(db, smDate(seasonDate));
      setListUsers(usersResult);
      const skisResult: Skis[] = await getSeasonSkis(db);
      setListSkis(skisResult);
      const bootsResult: Boots[] = await getAllBoots(db, smDate(seasonDate));
      setListBoots(bootsResult);
      const typeOfOutings: TOO[] = await getAllTypeOfOutings(db);
      setListOutingTypes(typeOfOutings);
      const friendsResult: Friends[] = await getAllFriends(db);
      setListFriends(friendsResult);
      const offPistesResult: OffPistes[] = await getAllOffPistes(db);
      setListOffPistes(offPistesResult);
      setDbState("done");
    } catch (error) {
      Logger.error(error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Refresh data after sync
  useEffect(() => {
    Logger.debug("index - lastWebDavSync changed, reloading data");
    if (lastWebDavSync > 0) {
      loadData();
    }
  }, [lastWebDavSync]);

  useEffect(() => {
    Logger.debug("index - outing2write changed");
    if (effectActive) {
      Logger.debug("useEffect active, skipping outing2write update");
      return;
    }
    if (outing2write.date === 0) {
      Logger.debug("outing2write date is 0, skipping outing2write update");
      return;
    }
    setEffectActive(true);
    setOutingViewUser(true);

    let outing = outing2write
    if (outing2write.idUser) {
      setOutingViewSkis(true);
      const skis = filterOutingSkis(outing2write.idUser || "");
      if (skis.length === 1) {
        outing = { ...outing, idSkis: skis[0].id };
      }
    }
    else if (selectedSkis.id !== "not-an-id") {
      setOutingViewSkis(true);
      outing = { ...outing, idSkis: selectedSkis.id.replace("topSkis-", ""), idUser: selectedSkis.listUsers ? selectedSkis.listUsers[0] : "" };
    }
    if (outing2write.idSkis) {
      setOutingViewBoots(true);
      const boots = filterOutingBoots(outing2write.idUser || "", outing2write.idSkis);
      // Sélection automatique de la première chaussure (la plus compatible/utilisée) uniquement si idSkis vient de changer
      // Cela évite la resélection automatique après une désélection manuelle
      if (boots.length >= 1 && outing.idSkis !== outing2write.idSkis) {
        outing = { ...outing, idBoots: boots[0].id };
      }
    } else {
      setOutingViewBoots(false);
    }
    if (outing2write.idBoots) {
      if (viewOuting) {
        setOutingViewToOuting(true);
        const majorType = listSkis.find(ski => ski.id === outing2write.idSkis)?.majorTypeOfOuting;
        if (majorType) {
          outing = { ...outing, idOutingType: majorType };
        }
        if (outing2write.idOutingType) {
          if (listOutingTypes.find(type => type.id === outing2write.idOutingType)?.canOffPiste) {
            setOutingViewOffPiste(true);
          }
          else {
            setOutingViewOffPiste(false);
          }
        }
        else {
          setOutingViewOffPiste(false);
        }
      } else {
        setOutingViewToOuting(false);
      }
      if (viewFriends) {
        if (listFriends.length > 0) {
          setOutingViewFriends(true);
        }
        else {
          setOutingViewFriends(false);
        }
      }
    }
    else {
      setOutingViewToOuting(false);
      setOutingViewOffPiste(false);
      setOutingViewFriends(false);
    }
    if (JSON.stringify(outing) !== JSON.stringify(outing2write)) {
      setOuting2Write(outing);
    }
    setEffectActive(false);
  }, [outing2write])

  const renderSkiers: ListRenderItem<Users> = ({ item }) => (
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
  )

  const renderSkis: ListRenderItem<Skis> = ({ item }) => {
    return (
      <RowItem onSelect={() => {
        if (selectedSkis.id !== item.id) {
          setSelectedSkis(item);
        }
        else {
          setSelectedSkis(initSkis(0));
        }
      }}
        isActive={selectedSkis.id === item.id}
        style={{
          borderLeftColor: colorsTheme.primary,
          borderLeftWidth: selectedSkis.id === item.id ? 1 : 0,
          borderRightColor: colorsTheme.primary,
          borderRightWidth: selectedSkis.id === item.id ? 1 : 0,
          paddingLeft: selectedSkis.id === item.id ? 3 : 4,
          paddingRight: selectedSkis.id === item.id ? 3 : 4
        }}
      >
        <Row style={{ marginRight: 10 }}>
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
          {item.listUserNames?.map((value: string, index: number) => {
            return <Pastille key={"SKIS" + value + index} name={value} size={iconSize} color={listUsers.find(u => u.name === value)?.pcolor}
              style={{ marginRight: -10, zIndex: index * -1 }} />;
          })}
          {selectedSkis.id !== item.id &&
            <>
              <Text numberOfLines={1}
                style={{ color: colorsTheme.text, fontSize: 20, flex: 1, textAlign: 'right' }}>{item.nbOutings?.toString()}</Text>
              <AppIcon name={'sortie'} color={colorsTheme.text} styles={{ fontSize: 20 }} />
              {((item.nbOutingsSinceLastSharp || 0) + (item.nbOutingsSinceLastWax || 0)) === 0 ?
                <AppIcon name={'checkmark'} color={colorsTheme.primaryGreen} styles={{ fontSize: 14, marginBottom: -6, marginLeft: -10, marginRight: -12 }} /> :
                toSharp.find(s => s.id === 'toSharp-' + item.id.replace('topSkis-', '')) || toWax.find(w => w.id === 'toWax-' + item.id.replace('topSkis-', '')) ? <AppIcon name={'notification'} color={colorsTheme.warning} styles={{ fontSize: 14, marginBottom: -6, marginLeft: -10, marginRight: -12 }} /> : null}
            </>
          }
        </Row>
        {selectedSkis.id === item.id && (
          <Row>
            {/* <AppIcon name={'none'} color={colorsTheme.text} /> */}
            <Card flex={1} >
              <View style={{ marginHorizontal: 'auto' }}>
                <Row style={{ marginHorizontal: 'auto' }}>
                  <AppIcon name={'play3'} color={colorsTheme.text} size={18} />
                  <Text numberOfLines={1}
                    style={[appStyles.text, { fontSize: 18 }]}>
                    {item.nbOutings?.toString()}
                  </Text>
                  <AppIcon name={'sortie'} color={colorsTheme.text} size={18} />
                </Row>
                {selectedSkis.id === item.id && (
                  <Row style={{ marginHorizontal: 'auto' }}>
                    <AppIcon name={'calendar'} color={colorsTheme.text} size={18} />
                    <Text numberOfLines={1}
                      style={[appStyles.text, { fontSize: 18 }]}>
                      {item.lastOutingDate !== undefined ? localeDate(item.lastOutingDate, { month: 'short', day: 'numeric' }) : "N/A"}
                    </Text>
                  </Row>
                )}
              </View>
            </Card>
            <Card flex={1}>
              <View style={{ marginHorizontal: 'auto' }}>
                {item.nbOutingsSinceLastSharp === 0 ?
                  <Text numberOfLines={1}
                    style={[appStyles.text, { fontSize: 18, color: colorsTheme.primaryGreen, marginHorizontal: 'auto' }]}>
                    {t('sharpened')}
                  </Text> :
                  <Row style={{ marginHorizontal: 'auto' }}>
                    <AppIcon name={'affuteuse'} color={colorsTheme.text} size={18} />
                    <AppIcon name={'arrow-left2'} color={colorsTheme.text} size={18} styles={{ marginRight: -8 }} />
                    <AppIcon name={'arrow-right2'} color={colorsTheme.text} size={18} styles={{ marginLeft: -8 }} />
                    <Text numberOfLines={1}
                      style={[appStyles.text, { fontSize: 18, color: toSharp.find(s => s.id === 'toSharp-' + item.id.replace('topSkis-', '')) ? colorsTheme.warning : colorsTheme.text }]}>
                      {item.nbOutingsSinceLastSharp?.toString()}
                    </Text>
                  </Row>
                }
                <Row style={{ marginHorizontal: 'auto' }}>
                  <AppIcon name={'calendar'} color={colorsTheme.text} size={18} />
                  <Text numberOfLines={1}
                    style={[appStyles.text, { fontSize: 18 }]}>
                    {item.lastSharpDate !== undefined ? localeDate(item.lastSharpDate, { month: 'short', day: 'numeric' }) : "N/A"}
                  </Text>
                </Row>
              </View>
            </Card>
            <Card flex={1}>
              <View style={{ marginHorizontal: 'auto' }}>
                {item.nbOutingsSinceLastWax === 0 ?
                  <Text numberOfLines={1}
                    style={[appStyles.text, { fontSize: 18, color: colorsTheme.primaryGreen, marginHorizontal: 'auto' }]}>
                    {t('waxed')}
                  </Text> :
                  <Row style={{ marginHorizontal: 'auto' }}>
                    <AppIcon name={'fartage'} color={colorsTheme.text} size={18} />
                    <AppIcon name={'arrow-left2'} color={colorsTheme.text} size={18} styles={{ marginRight: -8 }} />
                    <AppIcon name={'arrow-right2'} color={colorsTheme.text} size={18} styles={{ marginLeft: -8 }} />
                    <Text numberOfLines={1}
                      style={[appStyles.text, { fontSize: 18, color: toWax.find(s => s.id === 'toWax-' + item.id.replace('topSkis-', '')) ? colorsTheme.warning : colorsTheme.text }]}>
                      {item.nbOutingsSinceLastWax?.toString()}
                    </Text>

                  </Row>
                }
                <Row style={{ marginHorizontal: 'auto' }}>
                  <AppIcon name={'calendar'} color={colorsTheme.text} size={18} />
                  <Text numberOfLines={1}
                    style={[appStyles.text, { fontSize: 18 }]}>
                    {item.lastWaxDate !== undefined ? localeDate(item.lastWaxDate, { month: 'short', day: 'numeric' }) : "N/A"}
                  </Text>
                </Row>
              </View>
            </Card>
          </Row>
        )}
      </RowItem>
    )
  }

  const renderToSharp: ListRenderItem<Skis> = ({ item }) => {
    const count = item.nbMaintains || 0;
    const countColor = getCountColor(count)
    return (
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
        {item.listUserNames?.map((value: string, index: number) => {
          return <Pastille key={"SHARP" + value + index} name={value} size={iconSize}
            style={{ marginRight: -10, zIndex: index * -1 }} 
            color={listUsers.find(user => user.name === value)?.pcolor} />;
        })}
        {count === 0 ?
          <AppIcon name={"affuteuse"} color={colorsTheme.warning}
            styles={{ fontSize: iconSize, flex: 1, textAlign: 'right' }} />
          :
          <>
            <AppIcon name={"affuteuse"} color={countColor} styles={{ fontSize: 20, flex: 1, textAlign: 'right' }} />
            <Text numberOfLines={1}
              style={{ color: countColor, fontSize: 14, marginLeft: -12, marginBottom: -12, textAlign: 'right' }}>
              +{count.toString()}
            </Text>
          </>
        }

      </Row>
    )
  }

  const renderToWax: ListRenderItem<Skis> = ({ item }) => {
    const count = item.nbMaintains || 0;
    const countColor = getCountColor(count)
    return (
      <Row >
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
        {item.listUserNames?.map((value: string, index: number) => {
          return <Pastille key={"WAX" + value + index} name={value} size={iconSize}
            style={{ marginRight: -10, zIndex: index * -1 }} 
            color={listUsers.find(user => user.name === value)?.pcolor} />;
        })}
        {count === 0 ?
          <AppIcon name={"fartage"} color={colorsTheme.warning} styles={{ fontSize: 24, flex: 1, textAlign: 'right' }} />
          :
          <>
            <AppIcon name={"fartage"} color={countColor}
              styles={{ fontSize: 20, flex: 1, marginTop: -10, textAlign: 'right' }} />
            <Text numberOfLines={1}
              style={{ color: countColor, fontSize: 14, marginLeft: -12, marginBottom: -10, textAlign: 'right' }}>
              +{count.toString()}
            </Text>
          </>
        }

      </Row>
    )
  }
  const renderOutingSkis: ListRenderItem<Skis> = ({ item }) => {
    return (
      <TouchableOpacity key={item.id} onPress={() => {
        if (outing2write.idSkis === item.id) {
          const skis = filterOutingSkis(outing2write.idUser || "");
          if (skis.length !== 1) {
            setOuting2Write({ ...outing2write, idSkis: undefined, idBoots: undefined, idOutingType: undefined });
          }
        } else {
          const boots = filterOutingBoots(outing2write.idUser || "", item.id);
          if (boots.length >= 1) {
            setOuting2Write({ ...outing2write, idSkis: item.id, idBoots: boots[0].id, idOutingType: item.majorTypeOfOuting || undefined });
          } else {
            setOuting2Write({ ...outing2write, idSkis: item.id, idBoots: undefined, idOutingType: item.majorTypeOfOuting || undefined });
          }
        }
      }}>
        <Row style={{ marginVertical: 2 }}>
          {item.icoTypeOfSkisUri ?
            <Image source={{ uri: item.icoTypeOfSkisUri }} style={{ width: iconSize, height: iconSize }} /> :
            <Pastille size={iconSize} name={item.typeOfSkis || ""} color={"#fbe2cb"} />
          }
          <Image source={{ uri: item.icoBrandUri }}
            style={{ width: iconSize, height: iconSize }} />
          <Text numberOfLines={1}
            style={{ color: colorsTheme.text, fontSize: 20, flex: 1, fontWeight: 'bold' }}
          >
            {item.size ? item.size + " " : ""}{item.radius ? item.radius + "m " : ""}{item.name}
          </Text>
          <Text numberOfLines={1}
            style={appStyles.inactiveText}
          >
            {item.nbOutings || 0 > 0 ? (
              `(${item.nbOutings?.toString()})`
            ) : "-"}

          </Text>
        </Row>
      </TouchableOpacity>
    )
  }

  const renderOutingBoots: ListRenderItem<Boots> = ({ item }) => {
    return (
      <TouchableOpacity key={item.id} onPress={() => {
        if (outing2write.idBoots === item.id) {
          // Toujours permettre la désélection pour pouvoir choisir la location
          setOuting2Write({ ...outing2write, idBoots: undefined });
        } else {
          setOuting2Write({ ...outing2write, idBoots: item.id })
        }
      }}>
        <Row style={{ marginVertical: 2 }}>
          <Image source={{ uri: item.icoBrandUri }}
            style={{ width: iconSize, height: iconSize }} />
          <Text style={[appStyles.title, { flex: 1 }]}>
            {item.idBrand === "init-unknown" ? "" : item.brand + " "}
            {item.flex ? item.flex + " " : ""}
            {item.size ? "T" + item.size + " " : ""}
            {item.name}
          </Text>
        </Row>
      </TouchableOpacity>
    )
  }

  const renderMaintainSkis: ListRenderItem<Skis> = ({ item }) => {
    const nbOutingsSinceLastSharp = item.nbOutingsSinceLastSharp || 0;
    const nbOutingsSinceLastWax = item.nbOutingsSinceLastWax || 0;
    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => {
          if (maintain2write.idSkis === item.id) {
            setMaintain2Write({ ...maintain2write, idSkis: "not-an-id" });
          }
          else {
            setMaintain2Write({ ...maintain2write, idSkis: item.id });
          }
        }}
      >
        <Row style={{ marginVertical: 2 }}>
          {item.icoTypeOfSkisUri ?
            <Image source={{ uri: item.icoTypeOfSkisUri }} style={{ width: iconSize, height: iconSize }} /> :
            <Pastille size={iconSize} name={item.typeOfSkis || ""} color={"#fbe2cb"} />
          }
          <Image source={{ uri: item.icoBrandUri }}
            style={{ width: iconSize, height: iconSize }} />
          <Text numberOfLines={1}
            style={{ color: colorsTheme.text, fontSize: 20, flex: 1, fontWeight: 'bold' }}
          >
            {item.size ? item.size + " " : ""}{item.radius ? item.radius + "m " : ""}{item.name}
          </Text>
          <Text numberOfLines={1}
            style={appStyles.inactiveText}
          >
            {nbOutingsSinceLastSharp > 0 ? (
              `${nbOutingsSinceLastSharp.toString()}`
            ) : "-"}
            {nbOutingsSinceLastWax > 0 ? (
              `(${nbOutingsSinceLastWax.toString()})`
            ) : ""}

          </Text>
        </Row>
      </TouchableOpacity>
    )
  }

  const saveOuting = async () => {
    setAddOutingMode(false);
    await insertOuting(db, outing2write);
    cancelAdd();
    await webDavSync();
    await loadData(); // Reload data after saving
  }
  const saveMaintain = async () => {
    setAddMaintainMode(false);
    await insertMaintain(db, maintain2write);
    cancelAdd();
    await webDavSync();
    await loadData(); // Reload data after saving
  }
  const cancelAdd = () => {
    setAddOutingMode(false);
    setAddMaintainMode(false);
    setOuting2Write(initOuting());
    setMaintain2Write(initMaintain());
    setDateTimePickerVisible("none");
    setOutingVisible(false);
    setOffPisteVisible(false);
    setFriendsVisible(false);
    setOutingViewBoots(false);
    setOutingViewFriends(false);
    setOutingViewOffPiste(false);
    setOutingViewSkis(false);
    setOutingViewToOuting(false);
    setOutingViewUser(false);
    setEffectActive(false);
    setPartOfDay("morning");
  }

  function changePartOfDay(part: PartOfDay, type: "outing" | "maintain") {
    const currentDate = new Date(type === "outing" ? outing2write.date || Date.now() : maintain2write.date || Date.now());
    const newDate = PartOfDayUtils.setPartOfDayToDate(currentDate, part);
    changeDate(newDate, type);
    setPartOfDay(part);
  }

  function changeDate(date: Date, type: "outing" | "maintain") {
    const date2Save = smDate(date);

    if (type === "outing") {
      if (listUsers.length === 1) {
        const skis = filterOutingSkis(listUsers[0].id);
        if (skis.length === 1) {
          const boots = filterOutingBoots(listUsers[0].id, skis[0].id);
          if (boots.length >= 1) {
            setOuting2Write({ ...outing2write, date: date2Save, idUser: listUsers[0].id, idSkis: skis[0].id, idBoots: boots[0].id });
          } else {
            setOuting2Write({ ...outing2write, date: date2Save, idUser: listUsers[0].id, idSkis: skis[0].id, idBoots: undefined });
          }
        }
        else {
          setOuting2Write({ ...outing2write, date: date2Save, idUser: listUsers[0].id, idSkis: undefined, idBoots: undefined });
        }
      } else {
        setOuting2Write({ ...outing2write, date: date2Save });
      }
    } else {
      setMaintain2Write({ ...maintain2write, date: date2Save });
    }
  }

  function onDateChange(event: any, selectedDate: Date | undefined) {
    if (event.type === "set" && selectedDate) {
      changeDate(selectedDate, dateTimePickerVisible as "outing" | "maintain");
    }
    setDateTimePickerVisible("none");
  }

  return (
    <Body inTabs={true}>
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
            style={{ width: "100%", padding: 0 }}
            renderItem={renderSkis}
            onRefresh={loadData}
            refreshing={false}
          /> : <></>
        }
      </Tile>
      {(toSharp.length > 0) ? <>
        <Separator />
        <Tile style={{ maxHeight: 112 }}>
          <TileIconTitle littleIconName={"warning"} usersIconName={"affuteuse"} textColor={colorsTheme.text}
            pastilleValue={toSharp.length.toString()} pastilleColor={colorsTheme.notification} />
          <FlatList data={toSharp}
            keyExtractor={(item) => item.id}
            style={{ width: "100%", padding: 4 }}
            renderItem={renderToSharp}

          />
        </Tile></> : <></>
      }
      {(toWax.length > 0) ? <>
        <Separator />
        <Tile style={{ maxHeight: 112 }}>
          <TileIconTitle littleIconName={"warning"} usersIconName={"fartage"} textColor={colorsTheme.text}
            pastilleValue={toWax.length.toString()} pastilleColor={colorsTheme.notification} />
          <FlatList data={toWax}
            keyExtractor={(item) => item.id}
            style={{ width: "100%", padding: 4 }}
            renderItem={renderToWax}

          />
        </Tile></> : <></>}

      <Row style={{ width: "100%" }}>
        <AppButton flex={1} onPress={() => {
          setPartOfDay("morning");
          setAddOutingMode(true);
        }} color={colorsTheme.activeButton} icon={"plus"} caption={""} style={{ height: 68 }}>
          <AppIcon name={"sortie"} color={colorsTheme.text} styles={{ marginRight: 8 }} size={40} />
        </AppButton>
        <AppButton flex={1} onPress={() => {
          setPartOfDay("evening");
          if (selectedSkis.id !== "not-an-id") {
            setMaintain2Write({ ...maintain2write, idSkis: selectedSkis.id.replace("topSkis-", "") });// in case user clicked on a ski
          }
          setAddMaintainMode(true);
        }} color={colorsTheme.activeButton} icon={"plus"} caption={""} style={{ height: 68 }}>
          <AppIcon name={"entretien"} color={colorsTheme.text} styles={{ marginRight: 8 }} size={40} />
        </AppButton>
      </Row>

      {
      }
      <ModalEditor visible={addOutingMode} >
        <Row>
          <Text style={appStyles.title}>{t("add_outing")}</Text>
        </Row>
        <Row>
          <AppIcon name="calendar" color={colorsTheme.text} styles={{ marginRight: 8 }} />
          {outing2write.date === 0 ? (
            <View style={{ flex: 1 }}>
              <AppButton onPress={() => changeDate(new Date(), "outing")} caption={t('today')} />
              <AppButton onPress={() => changeDate(new Date(Date.now() - 24 * 60 * 60 * 1000), "outing")} caption={t('yesterday')} />
              <AppButton onPress={() => setDateTimePickerVisible("outing")} caption={t('anotherday')} />
            </View>)
            : (
              <Tile flex={1}>
                <TouchableOpacity onPress={() => setDateTimePickerVisible("outing")}>
                  <Text style={appStyles.text}>{localeDate(outing2write.date, { day: 'numeric', month: 'short', year: 'numeric' })} </Text>
                </TouchableOpacity>
              </Tile>
            )
          }
        </Row>
        {outing2write.date !== 0 && (
          <Row style={{ marginTop: 8 }}>
            <AppIcon name="clock" color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <PartOfDaySelector
              selectedPart={partOfDay}
              onSelect={(part) => changePartOfDay(part, "outing")}
              style={{ flex: 1 }}
            />
          </Row>
        )}

        {outing2write.date !== 0 && outingViewUser &&
          <Row>
            <AppIcon name={"users"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <Tile flex={1}>
              {outing2write.idUser ? (
                <TouchableOpacity onPress={() => setOuting2Write({ ...outing2write, idUser: undefined, idSkis: undefined, idBoots: undefined })}>
                  <Row>
                    {outing2write.idUser === LOAN_USER_ID ? (
                      <Text style={[appStyles.text, { flex: 1, fontStyle: 'italic', marginLeft: 8 }]}>{t('loan_equipment')}</Text>
                    ) : (
                      <>
                        <Pastille name={listUsers.find(user => user.id === outing2write.idUser)?.name || ""} color={listUsers.find(user => user.id === outing2write.idUser)?.pcolor} textColor={colorsTheme.text} size={iconSize} />
                        <Text style={[appStyles.text, { flex: 1 }]}>{listUsers.find(user => user.id === outing2write.idUser)?.name || ""}</Text>
                      </>
                    )}
                  </Row>
                </TouchableOpacity>

              ) : (
                <>
                  <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled={true}>
                    {listUsers.map((item) => (
                      <TouchableOpacity key={item.id} onPress={() => {
                        Logger.debug("Selected user:", item);
                        const skis = filterOutingSkis(item.id);
                        if (skis.length === 1) {
                          const boots = filterOutingBoots(item.id, skis[0].id);
                          if (boots.length >= 1) {
                            setOuting2Write({ ...outing2write, idSkis: skis[0].id, idBoots: boots[0].id, idOutingType: skis[0].majorTypeOfOuting });
                          } else {
                            setOuting2Write({ ...outing2write, idSkis: skis[0].id, idBoots: undefined, idOutingType: undefined });
                          }
                        }
                        else {
                          setOuting2Write({ ...outing2write, idUser: item.id, idSkis: undefined, idBoots: undefined, idOutingType: undefined });
                        }
                      }}>
                        <Row style={{ paddingVertical: 4 }}>
                          <Pastille name={item.name} color={item.pcolor} textColor={colorsTheme.text} size={iconSize} />
                          <Text style={[appStyles.text, { flex: 1 }]}> {item.name}</Text>
                        </Row>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity onPress={() => {
                    setOuting2Write({ ...outing2write, idUser: LOAN_USER_ID, idSkis: undefined, idBoots: undefined, idOutingType: undefined });
                  }}>
                    <Row style={{ marginVertical: 2, paddingVertical: 4, borderTopWidth: 1, borderTopColor: colorsTheme.separator }}>
                      <Text numberOfLines={1}
                        style={{ color: colorsTheme.text, fontSize: 20, flex: 1, fontStyle: 'italic', marginLeft: 8 }}
                      >
                        {t('loan_equipment')}
                      </Text>
                    </Row>
                  </TouchableOpacity>
                </>
              )}
            </Tile>
          </Row>
        }
        {outing2write.date !== 0 && outingViewSkis &&
          <Row>
            <AppIcon name={"skis"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <Tile flex={1} >
              {outing2write.idSkis ? (
                (() => {
                  if (outing2write.idSkis === RENTAL_SKIS_ID) {
                    return (
                      <TouchableOpacity onPress={() => {
                        setOuting2Write({ ...outing2write, idSkis: undefined, idBoots: undefined, idOutingType: undefined });
                      }}>
                        <Row style={{ marginVertical: 2 }}>
                          <AppIcon name={"credit-card"} color={colorsTheme.text} size={20} />
                          <Text numberOfLines={1}
                            style={{ color: colorsTheme.text, fontSize: 20, flex: 1, fontStyle: 'italic', marginLeft: 8 }}
                          >
                            {t('rental_skis')}
                          </Text>
                        </Row>
                      </TouchableOpacity>
                    );
                  }
                  const ski = listSkis.find(ski => ski.id === outing2write.idSkis);
                  return ski ? renderOutingSkis({ item: ski, index: 0, separators: { highlight: () => { }, unhighlight: () => { }, updateProps: () => { } } }) : null;
                })()
              ) : (
                <>
                  <ScrollView style={{ maxHeight: 400, width: '100%' }} nestedScrollEnabled={true}>
                    {filterOutingSkis(outing2write.idUser || "").map((item) =>
                      renderOutingSkis({ item, index: 0, separators: { highlight: () => { }, unhighlight: () => { }, updateProps: () => { } } })
                    )}
                  </ScrollView>
                  <TouchableOpacity onPress={() => {
                    setOuting2Write({ ...outing2write, idSkis: RENTAL_SKIS_ID, idBoots: undefined, idOutingType: undefined });
                  }}>
                    <Row style={{ marginVertical: 2, paddingVertical: 4, borderTopWidth: 1, borderTopColor: colorsTheme.separator }}>
                      <AppIcon name={"credit-card"} color={colorsTheme.text} size={20} />
                      <Text numberOfLines={1}
                        style={{ color: colorsTheme.text, fontSize: 20, flex: 1, fontStyle: 'italic', marginLeft: 8 }}
                      >
                        {t('rental_skis')}
                      </Text>
                    </Row>
                  </TouchableOpacity>
                </>
              )}
            </Tile>
          </Row>
        }
        {outing2write.date !== 0 && outingViewBoots &&
          <Row>
            <AppIcon name={"ski-boot"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <Tile flex={1} >
              {outing2write.idBoots ? (
                (() => {
                  if (outing2write.idBoots === RENTAL_BOOTS_ID) {
                    return (
                      <TouchableOpacity onPress={() => {
                        setOuting2Write({ ...outing2write, idBoots: undefined });
                      }}>
                        <Row style={{ marginVertical: 2 }}>
                          <AppIcon name={"credit-card"} color={colorsTheme.text} size={20} />
                          <Text numberOfLines={1}
                            style={{ color: colorsTheme.text, fontSize: 20, flex: 1, fontStyle: 'italic', marginLeft: 8 }}
                          >
                            {t('rental_boots')}
                          </Text>
                        </Row>
                      </TouchableOpacity>
                    );
                  }
                  const boots = listBoots.find(boots => boots.id === outing2write.idBoots);
                  return boots ? renderOutingBoots({ item: boots, index: 0, separators: { highlight: () => { }, unhighlight: () => { }, updateProps: () => { } } }) : null;
                })()
              ) : (
                <>
                  <ScrollView style={{ maxHeight: 400, width: '100%' }} nestedScrollEnabled={true}>
                    {filterOutingBoots(outing2write.idUser || "", outing2write.idSkis).map((item) =>
                      renderOutingBoots({ item, index: 0, separators: { highlight: () => { }, unhighlight: () => { }, updateProps: () => { } } })
                    )}
                  </ScrollView>
                  <TouchableOpacity onPress={() => {
                    setOuting2Write({ ...outing2write, idBoots: RENTAL_BOOTS_ID });
                  }}>
                    <Row style={{ marginVertical: 2, paddingVertical: 4, borderTopWidth: 1, borderTopColor: colorsTheme.separator }}>
                      <AppIcon name={"credit-card"} color={colorsTheme.text} size={20} />
                      <Text numberOfLines={1}
                        style={{ color: colorsTheme.text, fontSize: 20, flex: 1, fontStyle: 'italic', marginLeft: 8 }}
                      >
                        {t('rental_boots')}
                      </Text>
                    </Row>
                  </TouchableOpacity>
                </>
              )}
            </Tile>
          </Row>
        }

        {outingViewToOuting &&
          <Row>
            <AppIcon name={"slope"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <Tile flex={1}>
              <TouchableOpacity onPress={() => setOutingVisible(!outingVisible)}>
                {
                  outing2write.idOutingType ?
                    <Text style={[appStyles.text]}>{listOutingTypes.find(type => type.id === outing2write.idOutingType)?.name || ""}</Text>
                    :
                    <Text style={[appStyles.inactiveText]}>{t('add_too')}</Text>
                }
              </TouchableOpacity>
            </Tile>
          </Row>
        }
        {outingViewOffPiste &&
          <Row>
            <AppIcon name={"hors-piste"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <Tile flex={1}>
              <Row>
                <TouchableOpacity onPress={() => setOffPisteVisible(true)}>
                  <AppIcon name={"plus"} color={colorsTheme.primary} />
                </TouchableOpacity>
                {(outing2write.listOfOffPistes?.length || 0) > 0 ? (
                  <ScrollView style={{ flex: 1, maxHeight: 200 }} nestedScrollEnabled={true}>
                    {(outing2write.listOfOffPistes ? listOffPistes.filter(offpiste => outing2write.listOfOffPistes?.find(op => op.id === offpiste.id)) : []).map((item) => (
                      <Row key={item.id}>
                        <Text style={[appStyles.text, { flex: 1 }]}>{item.name}</Text>
                        <Card>
                          <TouchableOpacity onPress={() => {
                            let myOP = outing2write.listOfOffPistes?.find(op => op.id === item.id);
                            if (myOP) {
                              if (myOP.nb >= 2) {
                                myOP.nb--;
                              }
                            } else {
                              myOP = {
                                id: item.id, nb: 1
                              };
                            }
                            outing2write.listOfOffPistes = outing2write.listOfOffPistes?.filter(op => op.id !== item.id) || [];
                            setOuting2Write({ ...outing2write, listOfOffPistes: [...outing2write.listOfOffPistes, myOP] });

                          }}>

                            <AppIcon name={"minus"} color={colorsTheme.text} styles={{ fontSize: 16 }} />
                          </TouchableOpacity>
                          <Text style={[appStyles.text, { marginLeft: 8 }]}>{outing2write.listOfOffPistes?.find(op => op.id === item.id)?.nb || 0}</Text>
                          <TouchableOpacity onPress={() => {
                            let myOP = outing2write.listOfOffPistes?.find(op => op.id === item.id);
                            if (myOP) {
                              myOP.nb++;
                            }
                            else {
                              myOP = {
                                id: item.id, nb: 1
                              }
                            }
                            outing2write.listOfOffPistes = outing2write.listOfOffPistes?.filter(op => op.id !== item.id) || [];
                            setOuting2Write({ ...outing2write, listOfOffPistes: [...outing2write.listOfOffPistes, myOP] });

                          }
                          }>
                            <AppIcon name={"plus"} color={colorsTheme.text} styles={{ fontSize: 16 }} />
                          </TouchableOpacity>
                        </Card>
                      </Row>
                    ))}
                  </ScrollView>
                ) :
                  <Text style={[appStyles.inactiveText]}>{t('add_offpistes')}</Text>
                }
              </Row>
            </Tile>
          </Row>
        }
        {outingViewFriends &&
          <Row>
            <AppIcon name={"accessibility"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <Tile flex={1}>
              <TouchableOpacity onPress={() => { setFriendsVisible(!friendsVisible); }}>
                {
                  outing2write.idFriends && outing2write.idFriends.length > 0 ? (
                    <FlatList
                      data={outing2write.idFriends ? listFriends.filter(friend => outing2write.idFriends?.includes(friend.id)) : []}
                      renderItem={({ item }) => (
                        <Row style={{ padding: 4 }}>
                          <Pastille name={item.name} textColor={colorsTheme.black} size={iconSize} />
                          <Text style={[appStyles.text, { flex: 1 }]}>{item.name}</Text>
                        </Row>
                      )}
                      horizontal={true}
                      nestedScrollEnabled={true}
                      keyExtractor={(item) => item.id}
                    />) : (
                    <Text style={[appStyles.inactiveText]}>{t('add_friends')}</Text>
                  )
                }
              </TouchableOpacity>
            </Tile>
          </Row>
        }

        <Row style={{ marginTop: 8, gap: 16, justifyContent: 'space-between' }}>
          {outing2write.idBoots ? (
            <AppButton onPress={saveOuting} color={colorsTheme.activeButton} flex={1} caption={t('add')} />
          ) : null}
          <AppButton onPress={cancelAdd} color={colorsTheme.transparentGray} flex={1} caption={t('cancel')} />
        </Row>
      </ModalEditor>
      {
      }
      <ModalEditor visible={addMaintainMode} >
        <Row>
          <Text style={appStyles.title}>{t("add_maintain")}</Text>
        </Row>
        <Row>
          <AppIcon name="calendar" color={colorsTheme.text} styles={{ marginRight: 8 }} />
          {maintain2write.date === 0 ? (
            <View style={{ flex: 1 }}>
              <AppButton onPress={() => changeDate(new Date(), "maintain")} caption={t('today')} />
              <AppButton onPress={() => changeDate(new Date(Date.now() - 24 * 60 * 60 * 1000), "maintain")} caption={t('yesterday')} />
              <AppButton onPress={() => setDateTimePickerVisible("maintain")} caption={t('anotherday')} />
            </View>)
            : (
              <Tile flex={1}>
                <TouchableOpacity onPress={() => setDateTimePickerVisible("maintain")}>
                  <Text style={appStyles.text}>{localeDate(maintain2write.date, { day: 'numeric', month: 'short', year: 'numeric' })} </Text>
                </TouchableOpacity>
              </Tile>
            )
          }
        </Row>
        {maintain2write.date !== 0 && (
          <Row style={{ marginTop: 8 }}>
            <AppIcon name="clock" color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <PartOfDaySelector
              selectedPart={partOfDay}
              onSelect={(part) => changePartOfDay(part, "maintain")}
              style={{ flex: 1 }}
            />
          </Row>
        )}
        {maintain2write.date !== 0 ? <Row>
          <AppIcon name={"skis"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
          <Tile flex={1} >
            {maintain2write.idSkis !== "not-an-id" ? (
              (() => {
                const ski = listSkis.find(ski => ski.id === maintain2write.idSkis);
                return ski ? renderMaintainSkis({ item: ski, index: 0, separators: { highlight: () => { }, unhighlight: () => { }, updateProps: () => { } } }) : null;
              })()
            ) : (
              <ScrollView style={{ maxHeight: 400, width: '100%' }} nestedScrollEnabled={true}>
                {filterMaintainSkis().map((item) =>
                  renderMaintainSkis({ item, index: 0, separators: { highlight: () => { }, unhighlight: () => { }, updateProps: () => { } } })
                )}
              </ScrollView>
            )}
          </Tile>
        </Row> : <></>
        }
        {maintain2write.date !== 0 && maintain2write.idSkis !== "not-an-id" && <>
          <Row>
            <AppIcon name={"entretien"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <CheckButton
                type={"checkbox"}
                title={t('sharpening')}
                iconName="affuteuse"
                isActive={/S/.test(maintain2write.swr)}
                onPress={() => {
                  if (/S/.test(maintain2write.swr)) {
                    setMaintain2Write({ ...maintain2write, swr: maintain2write.swr.replace(/S/, '') });
                  } else {
                    setMaintain2Write({ ...maintain2write, swr: maintain2write.swr + 'S' });
                  }
                }}
              />
              <CheckButton
                type={"checkbox"}
                title={t('waxing')}
                iconName="fartage"
                isActive={/W/.test(maintain2write.swr)}
                onPress={() => {
                  if (/W/.test(maintain2write.swr)) {
                    setMaintain2Write({ ...maintain2write, swr: maintain2write.swr.replace(/W/, '') });
                  } else {
                    setMaintain2Write({ ...maintain2write, swr: maintain2write.swr + 'W' });
                  }
                }}
              />
              <CheckButton
                type={"checkbox"}
                title={t('repair')}
                iconName="aid-kit"
                isActive={/R/.test(maintain2write.swr)}
                onPress={() => {
                  if (/R/.test(maintain2write.swr)) {
                    setMaintain2Write({ ...maintain2write, swr: maintain2write.swr.replace(/R/, '') });
                  } else {
                    setMaintain2Write({ ...maintain2write, swr: maintain2write.swr + 'R' });
                  }
                }}
              />
            </View>
          </Row>
          <Row>
            <AppIcon name={"write"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <TextInput
              placeholder={t("description") + " " + t("optional")}
              placeholderTextColor={colorsTheme.inactiveText}
              style={appStyles.editField}
              value={maintain2write.description}
              onChangeText={text => setMaintain2Write({ ...maintain2write, description: text })}
            />
          </Row>
        </>
        }
        <Row style={{ marginTop: 8, gap: 16, justifyContent: 'space-between' }}>
          {maintain2write.swr.length > 0 || maintain2write.description.length > 0 ?
            <AppButton onPress={saveMaintain} color={colorsTheme.activeButton} flex={1} caption={t('add')} />
            : null}
          <AppButton onPress={cancelAdd} color={colorsTheme.transparentGray} flex={1} caption={t('cancel')} />
        </Row>
      </ModalEditor>
      {
      }
      {dateTimePickerVisible !== "none" &&
        <DateTimePicker
          value={new Date()}
          maximumDate={new Date()}
          minimumDate={seasonDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      }
      {
      }
      <ModalEditor visible={friendsVisible} center={true} onRequestClose={() => setFriendsVisible(false)}>
        <Tile>
          <ScrollView style={{ maxHeight: 400, width: '100%' }} nestedScrollEnabled={true}>
            {listFriends.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => {
                if (outing2write.idFriends?.includes(item.id)) {
                  setOuting2Write({ ...outing2write, idFriends: outing2write.idFriends.filter(id => id !== item.id) });
                } else {
                  setOuting2Write({ ...outing2write, idFriends: [...(outing2write.idFriends || []), item.id] });
                }
              }}>
                <Row style={{ paddingVertical: 4 }}>
                  <Pastille name={item.name} textColor={colorsTheme.black} size={iconSize} />
                  <Text style={[appStyles.text, { flex: 1, borderRadius: 8, padding: 4, backgroundColor: outing2write.idFriends?.includes(item.id) ? colorsTheme.transparentGray : undefined }]}> {item.name}</Text>
                </Row>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Tile>
        <AppButton onPress={() => setFriendsVisible(false)} caption={t('ok')} color={colorsTheme.activeButton} style={{ marginTop: 16 }} />
      </ModalEditor>
      {
      }
      <ModalEditor visible={outingVisible} center={true} onRequestClose={() => setOutingVisible(false)}>
        <Row>
          <Text style={appStyles.title}>{t("add_outing")}</Text>
        </Row>
        <Tile>
          <ScrollView style={{ maxHeight: 400, width: '100%' }} nestedScrollEnabled={true}>
            {listOutingTypes.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => {
                if (outing2write.idOutingType === item.id) {
                  setOuting2Write({ ...outing2write, idOutingType: undefined });
                }
                else {
                  setOuting2Write({ ...outing2write, idOutingType: item.id });
                }
                setOutingVisible(false);
              }}>
                <Row style={{ backgroundColor: outing2write.idOutingType === item.id ? colorsTheme.transparentGray : undefined }}>
                  <Text style={[appStyles.title, { flex: 1, marginLeft: 8 }]}>
                    {item.name}
                    {(item.itemCount || 0) > 0 && (
                      <Text style={[appStyles.text]}> ({item.itemCount})</Text>
                    )}
                  </Text>
                  {item.canOffPiste ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                      <AppIcon name="hors-piste" size={28} color={colorsTheme.primary} />
                    </View>
                  ) : null}
                </Row>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Tile>
        <AppButton onPress={() => setOutingVisible(false)} caption={t('cancel')} color={colorsTheme.transparentGray} style={{ marginTop: 16 }} />
      </ModalEditor>
      {
      }
      <ModalEditor visible={offPisteVisible} center={true} onRequestClose={() => setOffPisteVisible(false)}>
        <Row>
          <Text style={appStyles.title}>{t("offpiste")}</Text>
        </Row>
        <Tile>
          <ScrollView style={{ maxHeight: 400, width: '100%' }} nestedScrollEnabled={true}>
            {listOffPistes.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => {
                if (outing2write.listOfOffPistes?.find(offPiste => offPiste.id === item.id)) {
                  setOuting2Write({ ...outing2write, listOfOffPistes: outing2write.listOfOffPistes.filter(offPiste => offPiste.id !== item.id) });
                } else {
                  setOuting2Write({ ...outing2write, listOfOffPistes: [...outing2write.listOfOffPistes || [], { id: item.id, nb: 1 }] });
                }
                setOffPisteVisible(false);
              }}>
                <Row>
                  <Text style={[appStyles.text]}>{item.name}</Text>
                  {(item.count || 0) > 0 && (
                    <Text style={[appStyles.text]}>{item.count}</Text>
                  )}
                </Row>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Tile>
        <AppButton onPress={() => setOffPisteVisible(false)} caption={t('ok')} color={colorsTheme.activeButton} style={{ marginTop: 16 }} />
      </ModalEditor>
    </Body>

  );
}