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
import { Logger, smDate, PartOfDay, PartOfDayUtils, RatingUtils } from "@/hooks/ToolsBox";
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
  const [selectedOffPisteForRating, setSelectedOffPisteForRating] = useState<string | null>(null);
  const [partOfDay, setPartOfDay] = useState<PartOfDay>("morning");
  const [outingViewUser, setOutingViewUser] = useState<boolean>(false);
  const [outingViewSkis, setOutingViewSkis] = useState<boolean>(false);
  const [outingViewBoots, setOutingViewBoots] = useState<boolean>(false);
  const [outingViewToOuting, setOutingViewToOuting] = useState<boolean>(false);
  const [outingViewOffPiste, setOutingViewOffPiste] = useState<boolean>(false);
  const [outingViewFriends, setOutingViewFriends] = useState<boolean>(false);
  const [effectActive, setEffectActive] = useState<boolean>(false);
  const [lastSyncDate, setLastSyncDate] = useState<number>(Date.now());
  const [toSharpVisible, setToSharpVisible] = useState<boolean>(false);
  const [toWaxVisible, setToWaxVisible] = useState<boolean>(false);
  const [fabOpen, setFabOpen] = useState<boolean>(false);
  const [maintenanceDrawerOpen, setMaintenanceDrawerOpen] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [order_by_topSkis, setOrderByTopSkis] = useState<"order_by_outings" | "order_by_sharp" | "order_by_wax">("order_by_outings");

  const { t, localeDate, seasonDate, viewFriends, viewOuting, webDavSync, webDavSyncEnabled, lastWebDavSync } = useContext(AppContext)!

  const filterOutingSkis = (idUser: string, date: number) => {
    // Si c'est un prêt, retourner tous les skis
    if (idUser === LOAN_USER_ID) {
      return listSkis.filter(ski => !ski.end || ski.end > date).sort((a, b) => {
        const aNb = a.nbOutings || 0;
        const bNb = b.nbOutings || 0;
        return bNb - aNb;
      });
    }
    return listSkis.filter(ski => ski.listUsers?.includes(idUser) && (!ski.end || ski.end > date)).sort((a, b) => {
      const aNb = a.nbOutings || 0;
      const bNb = b.nbOutings || 0;
      return bNb - aNb;
    });
  };
  const filterOutingBoots = (idUser: string, date: number, idSkis?: string) => {
    // Si c'est un prêt, retourner toutes les chaussures
    if (idUser === LOAN_USER_ID) {
      const allBoots = [...listBoots].filter(boots => {
        // Exclure les chaussures dont la date de fin est antérieure à la date de l'événement
        if (boots.end && date > 0 && boots.end < date) {
          return false;
        }
        return true;
      });

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

    // Retourne toutes les chaussures de l'utilisateur, en excluant celles dont la date de fin est dépassée
    const userBoots = listBoots.filter(boots => {
      if (!boots.listUsers?.includes(idUser)) return false;

      // Exclure les chaussures dont la date de fin est antérieure à la date de l'événement
      if (boots.end && date > 0 && boots.end < date) {
        return false;
      }
      return true;
    });

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
  const filterMaintainSkis = (date: number) => {
    return listSkis.filter(ski => !ski.end || ski.end > date).sort((a, b) => {
      const aScore = (a.nbOutingsSinceLastSharp || 0) * 10 + (a.nbOutingsSinceLastWax || 0);
      const bScore = (b.nbOutingsSinceLastSharp || 0) * 10 + (b.nbOutingsSinceLastWax || 0);
      return bScore - aScore;
    });
  };

  // Filter skis by selected user
  const filterSkisBySelectedUser = (skis: Skis[]): Skis[] => {
    if (!selectedUserId) {
      return skis;
    }
    // Check in topUsers first, then in listUsers
    const selectedUser = topUsers.find(u => u.id === selectedUserId) || listUsers.find(u => u.id === selectedUserId);
    if (!selectedUser) {
      return skis;
    }
    return skis.filter(ski => ski.listUserNames?.includes(selectedUser.name));
  };

  // Filtered lists based on selected user
  const filteredTopSkis = filterSkisBySelectedUser(topSkis).sort((a, b) => {
    if (order_by_topSkis === "order_by_sharp") {
      // Tri par affûtage : prioriser les skis avec needsSharp.nbMaintains, puis par nbOutingsSinceLastSharp
      const aSharp = toSharp.find(s => s.id === 'toSharp-' + a.id.replace('topSkis-', ''));
      const bSharp = toSharp.find(s => s.id === 'toSharp-' + b.id.replace('topSkis-', ''));
      const aScore = (aSharp?.nbMaintains || 0) * 10000 + (a.nbOutingsSinceLastSharp || 0);
      const bScore = (bSharp?.nbMaintains || 0) * 10000 + (b.nbOutingsSinceLastSharp || 0);
      return bScore - aScore;
    } else if (order_by_topSkis === "order_by_wax") {
      // Tri par fartage : prioriser les skis avec needsWax.nbMaintains, puis par nbOutingsSinceLastWax
      const aWax = toWax.find(w => w.id === 'toWax-' + a.id.replace('topSkis-', ''));
      const bWax = toWax.find(w => w.id === 'toWax-' + b.id.replace('topSkis-', ''));
      const aScore = (aWax?.nbMaintains || 0) * 10000 + (a.nbOutingsSinceLastWax || 0);
      const bScore = (bWax?.nbMaintains || 0) * 10000 + (b.nbOutingsSinceLastWax || 0);
      return bScore - aScore;
    } else {
      // Tri par défaut : par nombre de sorties
      return (b.nbOutings || 0) - (a.nbOutings || 0);
    }
  });
  const filteredToSharp = filterSkisBySelectedUser(toSharp);
  const filteredToWax = filterSkisBySelectedUser(toWax);

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
      const skis = filterOutingSkis(outing2write.idUser || "", outing2write.date);
      if (skis.length === 1 && outing.idSkis == undefined) {
        outing = { ...outing, idSkis: skis[0].id };
      }
    }

    if (outing2write.idSkis) {
      setOutingViewBoots(true);
      const boots = filterOutingBoots(outing2write.idUser || "", outing2write.date, outing2write.idSkis);
      // Sélection automatique de la première chaussure (la plus compatible/utilisée) uniquement si idSkis vient de changer
      // Cela évite la resélection automatique après une désélection manuelle
      if (boots.length === 1 && outing.idBoots == undefined) {
        outing = { ...outing, idBoots: boots[0].id };
      }
    } else {
      setOutingViewBoots(false);
    }
    if (outing2write.idBoots) {
      if (viewOuting) {
        setOutingViewToOuting(true);
        const majorType = listSkis.find(ski => ski.id === outing2write.idSkis)?.majorTypeOfOuting;
        if (majorType && outing.idOutingType == undefined) {
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

  const renderSkiers: ListRenderItem<Users> = ({ item }) => {
    const isSelected = selectedUserId === item.id;
    return (
      <TouchableOpacity 
        onPress={() => {
          // Toggle selection: if already selected, deselect
          setSelectedUserId(isSelected ? null : item.id);
        }}
        style={{ 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: 85,
          backgroundColor: isSelected ? colorsTheme.transparentGray : 'transparent',
          borderRadius: 8,
          borderWidth: isSelected ? 2 : 0,
          borderColor: isSelected ? colorsTheme.primary : 'transparent',
          padding: 4
        }}
      >
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
      </TouchableOpacity>
    );
  }

  const renderSkis: ListRenderItem<Skis> = ({ item }) => {
    const needsSharp = toSharp.find(s => s.id === 'toSharp-' + item.id.replace('topSkis-', ''));
    const colorSharp = needsSharp ? getCountColor(needsSharp.nbMaintains || 0) : colorsTheme.text;
    const needsWax = toWax.find(w => w.id === 'toWax-' + item.id.replace('topSkis-', ''));
    const colorWax = needsWax ? getCountColor(needsWax.nbMaintains || 0) : colorsTheme.text;
    const isArchived = item.end !== undefined && item.end > 0;
    return (
      <View style={{
        marginVertical: 4,
        padding: 8,
        backgroundColor: isArchived ? 'rgba(255, 0, 0, 0.1)' : colorsTheme.cardBG,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: isArchived ? 'rgba(255, 0, 0, 0.7)' : colorsTheme.separator,
        position: 'relative'
      }}>
        {/* Ligne principale avec infos du ski */}
        <Row style={{ marginBottom: 6 }}>
          {item.icoTypeOfSkisUri ?
            <Image source={{ uri: item.icoTypeOfSkisUri }} style={{ width: iconSize, height: iconSize }} /> :
            <Pastille size={iconSize} name={item.typeOfSkis || ""} color={"#fbe2cb"} />
          }
          <Image source={{ uri: item.icoBrandUri }}
            style={{ width: iconSize, height: iconSize }} />
          <Text numberOfLines={1}
            style={{ color: colorsTheme.text, fontSize: 18, flex: 1, fontWeight: 'bold' }}
          >
            {item.size ? item.size + " " : ""}{item.radius ? item.radius + "m " : ""}{item.name}
          </Text>
          {item.listUserNames?.map((value: string, index: number) => {
            const totalUsers = item.listUserNames?.length || 0;
            return <Pastille key={"SKIS" + value + index} name={value} size={28} color={listUsers.find(u => u.name === value)?.pcolor}
              style={{ marginLeft: index > 0 ? -12 : 0, zIndex: totalUsers - index }} />;
          })}
        </Row>

        {/* Ligne des statistiques compactes */}
        <Row style={{ gap: 8, paddingLeft: 4 }}>
          {/* Sorties totales */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <AppIcon name={'sortie'} color={colorsTheme.text} size={16} />
            <Text style={[appStyles.text, { fontSize: 14, fontWeight: 'bold' }]}>
              {item.nbOutings?.toString() || "0"}
              {item.lastOutingDate && (
                <Text style={[appStyles.text, { fontSize: 12, color: colorsTheme.inactiveText }]}>
                  {" (" + localeDate(item.lastOutingDate, { month: 'short', day: 'numeric' }) + ")"}
                </Text>
              )}
            </Text>
          </View>

          <Text style={{ color: colorsTheme.separator }}>|</Text>

          {/* Affûtage */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <AppIcon name={'affuteuse'} color={colorSharp} size={16} />
            {item.nbOutingsSinceLastSharp === 0 ? (
              <AppIcon name={'checkmark'} color={colorsTheme.primaryGreen} size={16} />
            ) : (
              <Text style={{ fontSize: 14, color: colorSharp }}>
                {item.nbOutingsSinceLastSharp?.toString() || "0"}
                <Text style={{ fontSize: 12 }}>
                  {needsSharp?.nbMaintains ? "(+" + needsSharp.nbMaintains.toString() + ")" : ""}
                </Text>
                {(item.lastSharpDate || item.begin) && (
                  <Text style={[appStyles.text, { fontSize: 12, color: colorsTheme.inactiveText }]}>
                    {" (" + localeDate(item.lastSharpDate || item.begin, { month: 'short', day: 'numeric' }) + ")"}
                  </Text>
                )}
              </Text>
            )}
          </View>

          <Text style={{ color: colorsTheme.separator }}>|</Text>

          {/* Fartage */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
            <AppIcon name={'fartage'} color={colorWax} size={16} />
            {item.nbOutingsSinceLastWax === 0 ? (
              <AppIcon name={'checkmark'} color={colorsTheme.primaryGreen} size={16} />
            ) : (
              <Text style={{ fontSize: 14, color: colorWax }}>
                {item.nbOutingsSinceLastWax?.toString() || "0"}
                <Text style={{ fontSize: 12 }}>
                  {needsWax?.nbMaintains ? "(+" + needsWax.nbMaintains.toString() + ")" : ""}
                </Text>
                {(item.lastWaxDate || item.begin) && (
                  <Text style={{ fontSize: 12, color: colorsTheme.inactiveText }}>
                    {" (" + localeDate(item.lastWaxDate || item.begin, { month: 'short', day: 'numeric' }) + ")"}
                  </Text>
                )}
              </Text>
            )}
          </View>
        </Row>

        {/* Icône de corbeille pour les skis archivés */}
        {isArchived && (
          <View style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            zIndex: 10
          }}>
            <AppIcon name={'bin'} color={'rgba(255, 0, 0, 0.7)'} size={20} />
          </View>
        )}
      </View>
    );
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
        <View style={{ width: 28, alignItems: 'flex-end', justifyContent: 'center' }}>
          {count === 0 ?
            <AppIcon name={"affuteuse"} color={colorsTheme.warning}
              styles={{ fontSize: 24 }} />
            :
            <>
              <AppIcon name={"affuteuse"} color={countColor} styles={{ fontSize: 20 }} />
              <Text numberOfLines={1}
                style={{ color: countColor, fontSize: 14, marginTop: -12 }}>
                +{count.toString()}
              </Text>
            </>
          }
        </View>

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
        <View style={{ width: 28, alignItems: 'flex-end', justifyContent: 'center' }}>
          {count === 0 ?
            <AppIcon name={"fartage"} color={colorsTheme.warning} styles={{ fontSize: 24 }} />
            :
            <>
              <AppIcon name={"fartage"} color={countColor}
                styles={{ fontSize: 20 }} />
              <Text numberOfLines={1}
                style={{ color: countColor, fontSize: 14, marginTop: -10 }}>
                +{count.toString()}
              </Text>
            </>
          }
        </View>

      </Row>
    )
  }
  const renderOutingSkis: ListRenderItem<Skis> = ({ item }) => {
    return (
      <TouchableOpacity key={item.id} onPress={() => {
        if (outing2write.idSkis === item.id) {
          const skis = filterOutingSkis(outing2write.idUser || "", outing2write.date);
          if (skis.length !== 1) {
            setOuting2Write({ ...outing2write, idSkis: undefined, idBoots: undefined, idOutingType: undefined });
          }
        } else {
          const boots = filterOutingBoots(outing2write.idUser || "", outing2write.date, item.id);
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
        const skis = filterOutingSkis(listUsers[0].id, outing2write.date || Date.now());
        if (skis.length === 1) {
          const boots = filterOutingBoots(listUsers[0].id, outing2write.date || Date.now(), skis[0].id);
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
      changeDate(PartOfDayUtils.setPartOfDayToDate(selectedDate, partOfDay), dateTimePickerVisible as "outing" | "maintain");
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
        <TileIconTitle littleIconName={
          order_by_topSkis === "order_by_outings" ? "star-full" :
          order_by_topSkis === "order_by_sharp" ? "affuteuse" :
          "fartage"
        } usersIconName={"skis"} textColor={colorsTheme.text}
          pastilleValue={filteredTopSkis.length.toString()} pastilleColor={colorsTheme.pastille} />
        {(filteredTopSkis) ?
          <FlatList data={filteredTopSkis}
            keyExtractor={(item) => item.id}
            style={{ width: "100%", padding: 0 }}
            renderItem={renderSkis}
            onRefresh={loadData}
            refreshing={false}
          /> : <></>
        }
      </Tile>

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
              <AppButton onPress={() => changeDate(PartOfDayUtils.setPartOfDayToDate(new Date(), "morning"), "outing")} caption={t('today')} />
              <AppButton onPress={() => changeDate(PartOfDayUtils.setPartOfDayToDate(new Date(Date.now() - 24 * 60 * 60 * 1000), "morning"), "outing")} caption={t('yesterday')} />
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
                        const skis = filterOutingSkis(item.id, outing2write.date || Date.now());
                        if (skis.length === 1) {
                          const boots = filterOutingBoots(item.id, outing2write.date || Date.now(), skis[0].id);
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
                    {filterOutingSkis(outing2write.idUser || "", outing2write.date || Date.now()).map((item) =>
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
                    {filterOutingBoots(outing2write.idUser || "", outing2write.date, outing2write.idSkis).map((item) =>
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
                    {(outing2write.listOfOffPistes ? listOffPistes.filter(offpiste => outing2write.listOfOffPistes?.find(op => op.id === offpiste.id)) : []).map((item) => {
                      const rating = outing2write.listOfOffPistes?.find(op => op.id === item.id)?.rating || 3;
                      return (
                      <Row key={item.id}>
                        <Text style={[appStyles.text, { flex: 1 }]}>{item.name}</Text>
                        <TouchableOpacity onPress={() => setSelectedOffPisteForRating(item.id)}>
                          <Text style={[appStyles.text, { fontSize: 24, marginRight: 8 }]}>{RatingUtils.ratingToEmoji(rating)}</Text>
                        </TouchableOpacity>
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
                    )
                    })}
                  
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
              <AppButton onPress={() => changeDate(PartOfDayUtils.setPartOfDayToDate(new Date(), "evening"), "maintain")} caption={t('today')} />
              <AppButton onPress={() => changeDate(PartOfDayUtils.setPartOfDayToDate(new Date(Date.now() - 24 * 60 * 60 * 1000), "evening"), "maintain")} caption={t('yesterday')} />
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
                {filterMaintainSkis(maintain2write.date).map((item) =>
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
      <ModalEditor visible={offPisteVisible} center={true} onRequestClose={() => {
        setOffPisteVisible(false);
      }}>
        <Row>
          <Text style={appStyles.title}>{t("offpiste")}</Text>
        </Row>
        <Tile>
          <ScrollView style={{ maxHeight: 400, width: '100%' }} nestedScrollEnabled={true}>
            {listOffPistes.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => {
                if (outing2write.listOfOffPistes?.find(offPiste => offPiste.id === item.id)) {
                  // Si déjà ajouté, on le retire
                  setOuting2Write({ ...outing2write, listOfOffPistes: outing2write.listOfOffPistes.filter(offPiste => offPiste.id !== item.id) });
                } else {
                  // Sinon, on ajoute avec rating par défaut (3)
                  setOuting2Write({ 
                    ...outing2write, 
                    listOfOffPistes: [...outing2write.listOfOffPistes || [], { id: item.id, nb: 1, rating: 3 }] 
                  });
                }
              }}>
                <Row>
                  <Text style={[appStyles.text, { flex: 1 }]}>{item.name}</Text>
                  {(item.count || 0) > 0 && (
                    <Text style={[appStyles.text]}>{item.count}</Text>
                  )}
                  {outing2write.listOfOffPistes?.find(offPiste => offPiste.id === item.id) && (
                    <AppIcon name={"checkmark"} color={colorsTheme.primaryGreen} styles={{ marginLeft: 8 }} />
                  )}
                </Row>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Tile>
        <AppButton onPress={() => setOffPisteVisible(false)} caption={t('ok')} color={colorsTheme.activeButton} style={{ marginTop: 16 }} />
      </ModalEditor>
      {/* Modal pour changer le rating d'un off-piste */}
      <ModalEditor visible={selectedOffPisteForRating !== null} center={true} onRequestClose={() => setSelectedOffPisteForRating(null)}>
        <Row>
          <Text style={appStyles.title}>{t("rating")}</Text>
        </Row>
        <Tile>
          <View style={{ marginTop: 16 }}>
            <Text style={[appStyles.text, { textAlign: 'center', marginBottom: 16, fontSize: 18 }]}>
              {listOffPistes.find(op => op.id === selectedOffPisteForRating)?.name}
            </Text>
            <View style={{ gap: 12 }}>
              {RatingUtils.allRatings.map((rating) => (
                <TouchableOpacity
                  key={rating.value}
                  onPress={() => {
                    // Trouver l'off-piste et modifier son rating
                    const updatedOffPistes = outing2write.listOfOffPistes?.map(op => 
                      op.id === selectedOffPisteForRating ? { ...op, rating: rating.value } : op
                    ) || [];
                    setOuting2Write({ ...outing2write, listOfOffPistes: updatedOffPistes });
                    setSelectedOffPisteForRating(null);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    backgroundColor: colorsTheme.cardBG,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colorsTheme.separator,
                  }}
                >
                  <Text style={{ fontSize: 32, marginRight: 12 }}>{rating.emoji}</Text>
                  <Text style={[appStyles.text, { flex: 1 }]}>{t(rating.label)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Tile>
        <AppButton 
          onPress={() => setSelectedOffPisteForRating(null)} 
          caption={t('cancel')} 
          color={colorsTheme.transparentGray} 
          style={{ marginTop: 16 }} 
        />
      </ModalEditor>
      {
      }
      <ModalEditor visible={toSharpVisible} center={true} onRequestClose={() => setToSharpVisible(false)}>
        <Row>
          <AppIcon name={"affuteuse"} color={colorsTheme.text} styles={{ marginRight: 8 }} size={32} />
          <Text style={appStyles.title}>{t("sharpening")}</Text>
        </Row>
        <Tile style={{ marginTop: 16 }}>
          <ScrollView style={{ maxHeight: 400, width: '100%' }} nestedScrollEnabled={true}>
            {filteredToSharp.map((item) => (
              <View key={item.id}>
                {renderToSharp({ item, index: 0, separators: { highlight: () => { }, unhighlight: () => { }, updateProps: () => { } } })}
              </View>
            ))}
          </ScrollView>
        </Tile>
        <AppButton onPress={() => setToSharpVisible(false)} caption={t('ok')} color={colorsTheme.activeButton} style={{ marginTop: 16 }} />
      </ModalEditor>
      {
      }
      <ModalEditor visible={toWaxVisible} center={true} onRequestClose={() => setToWaxVisible(false)}>
        <Row>
          <AppIcon name={"fartage"} color={colorsTheme.text} styles={{ marginRight: 8 }} size={32} />
          <Text style={appStyles.title}>{t("waxing")}</Text>
        </Row>
        <Tile style={{ marginTop: 16 }}>
          <ScrollView style={{ maxHeight: 400, width: '100%' }} nestedScrollEnabled={true}>
            {filteredToWax.map((item) => (
              <View key={item.id}>
                {renderToWax({ item, index: 0, separators: { highlight: () => { }, unhighlight: () => { }, updateProps: () => { } } })}
              </View>
            ))}
          </ScrollView>
        </Tile>
        <AppButton onPress={() => setToWaxVisible(false)} caption={t('ok')} color={colorsTheme.activeButton} style={{ marginTop: 16 }} />
      </ModalEditor>

      {/* Overlay semi-transparent quand le menu est ouvert */}
      {fabOpen && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
          }}
          onPress={() => setFabOpen(false)}
          activeOpacity={1}
        />
      )}

      {/* Menu principal (tri + ajout) */}
      {fabOpen && (
        <View style={{
          position: 'absolute',
          bottom: 90,
          right: 16,
          alignItems: 'flex-end',
          gap: 12,
        }}>
          {/* --- Section Tri --- */}
          {/* Bouton Sorties */}
          <TouchableOpacity
            onPress={() => { setOrderByTopSkis("order_by_outings"); setFabOpen(false); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <View style={{
              backgroundColor: colorsTheme.cardBG,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 4,
              borderColor: order_by_topSkis === "order_by_outings" ? colorsTheme.primary : colorsTheme.separator,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            }}>
              <Text style={[appStyles.text, { fontSize: 21 }]}>{t("sort_by_outings")}</Text>
            </View>
            <View style={{
              backgroundColor: order_by_topSkis === "order_by_outings" ? colorsTheme.primary : colorsTheme.cardBG,
              width: 72, height: 72, borderRadius: 36,
              borderWidth: 4,
              borderColor: order_by_topSkis === "order_by_outings" ? colorsTheme.primary : colorsTheme.separator,
              alignItems: 'center', justifyContent: 'center',
              elevation: 4, shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
            }}>
              <AppIcon name={"slope"} color={colorsTheme.text} size={36} />
            </View>
          </TouchableOpacity>

          {/* Bouton Affûtage */}
          <TouchableOpacity
            onPress={() => { setOrderByTopSkis("order_by_sharp"); setFabOpen(false); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <View style={{
              backgroundColor: colorsTheme.cardBG,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 4,
              borderColor: order_by_topSkis === "order_by_sharp" ? colorsTheme.primary : colorsTheme.separator,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
            }}>
              <Text style={[appStyles.text, { fontSize: 21 }]}>{t("sort_by_sharpening")}</Text>
            </View>
            <View style={{
              backgroundColor: order_by_topSkis === "order_by_sharp" ? colorsTheme.primary : colorsTheme.cardBG,
              width: 72, height: 72, borderRadius: 36,
              borderWidth: 4,
              borderColor: order_by_topSkis === "order_by_sharp" ? colorsTheme.primary : colorsTheme.separator,
              alignItems: 'center', justifyContent: 'center',
              elevation: 4, shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
            }}>
              <AppIcon name={"affuteuse"} color={colorsTheme.text} size={36} />
            </View>
          </TouchableOpacity>

          {/* Bouton Fartage */}
          <TouchableOpacity
            onPress={() => { setOrderByTopSkis("order_by_wax"); setFabOpen(false); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <View style={{
              backgroundColor: colorsTheme.cardBG,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 4,
              borderColor: order_by_topSkis === "order_by_wax" ? colorsTheme.primary : colorsTheme.separator,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
            }}>
              <Text style={[appStyles.text, { fontSize: 21 }]}>{t("sort_by_waxing")}</Text>
            </View>
            <View style={{
              backgroundColor: order_by_topSkis === "order_by_wax" ? colorsTheme.primary : colorsTheme.cardBG,
              width: 72, height: 72, borderRadius: 36,
              borderWidth: 4,
              borderColor: order_by_topSkis === "order_by_wax" ? colorsTheme.primary : colorsTheme.separator,
              alignItems: 'center', justifyContent: 'center',
              elevation: 4, shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
            }}>
              <AppIcon name={"fartage"} color={colorsTheme.text} size={36} />
            </View>
          </TouchableOpacity>

          {/* Séparateur */}
          <View style={{ height: 4, width: 260, backgroundColor: colorsTheme.primary, borderRadius: 2, alignSelf: 'flex-end', marginVertical: 8 }} />

          {/* --- Section Ajout --- */}
          {/* Bouton Ajouter sortie */}
          <TouchableOpacity
            onPress={() => {
              setFabOpen(false);
              setPartOfDay("morning");
              setAddOutingMode(true);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <View style={{
              backgroundColor: colorsTheme.cardBG,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 4,
              borderColor: colorsTheme.activeButton,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
            }}>
              <Text style={[appStyles.text, { fontSize: 21 }]}>{t('add_outing')}</Text>
            </View>
            <View style={{
              backgroundColor: colorsTheme.activeButton,
              width: 72, height: 72, borderRadius: 36,
              alignItems: 'center', justifyContent: 'center',
              elevation: 4, shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
            }}>
              <AppIcon name={"sortie"} color={colorsTheme.text} size={36} />
            </View>
          </TouchableOpacity>

          {/* Bouton Ajouter entretien */}
          <TouchableOpacity
            onPress={() => {
              setFabOpen(false);
              setPartOfDay("evening");
              setAddMaintainMode(true);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <View style={{
              backgroundColor: colorsTheme.cardBG,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 4,
              borderColor: colorsTheme.activeButton,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
            }}>
              <Text style={[appStyles.text, { fontSize: 21 }]}>{t('add_maintain')}</Text>
            </View>
            <View style={{
              backgroundColor: colorsTheme.activeButton,
              width: 72, height: 72, borderRadius: 36,
              alignItems: 'center', justifyContent: 'center',
              elevation: 4, shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
            }}>
              <AppIcon name={"entretien"} color={colorsTheme.text} size={36} />
            </View>
          </TouchableOpacity>
        </View>
      )}
      {/* Modale coulissante depuis la gauche */}
      {maintenanceDrawerOpen && (
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
            onPress={() => setMaintenanceDrawerOpen(false)}
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
            borderRightColor: colorsTheme.notification,
            borderTopWidth: 4,
            borderTopColor: colorsTheme.notification,
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
              {/* Liste des skis à affûter */}
              {filteredToSharp.length > 0 && (
                <Tile style={{ marginBottom: 16 }}>
                  <Row style={{ marginBottom: 12 }}>
                    <AppIcon name={"affuteuse"} color={colorsTheme.text} size={28} styles={{ marginRight: 8 }} />
                    <Text style={[appStyles.title, { flex: 1 }]}>{t("sharpening")}</Text>
                    <Pastille
                      size={24}
                      name={filteredToSharp.length.toString()}
                      color={colorsTheme.pastille}
                      textColor={colorsTheme.text}
                    />
                  </Row>
                  {filteredToSharp.map((item) => (
                    <View key={item.id} style={{ marginBottom: 8 }}>
                      {renderToSharp({ item, index: 0, separators: { highlight: () => { }, unhighlight: () => { }, updateProps: () => { } } })}
                    </View>
                  ))}
                </Tile>
              )}

              {/* Séparateur si les deux listes sont présentes */}
              {filteredToSharp.length > 0 && filteredToWax.length > 0 && (
                <Separator />
              )}

              {/* Liste des skis à farter */}
              {filteredToWax.length > 0 && (
                <Tile style={{ marginTop: filteredToSharp.length > 0 ? 16 : 0 }}>
                  <Row style={{ marginBottom: 12 }}>
                    <AppIcon name={"fartage"} color={colorsTheme.text} size={28} styles={{ marginRight: 8 }} />
                    <Text style={[appStyles.title, { flex: 1 }]}>{t("waxing")}</Text>
                    <Pastille
                      size={24}
                      name={filteredToWax.length.toString()}
                      color={colorsTheme.pastille}
                      textColor={colorsTheme.text}
                    />
                  </Row>
                  {filteredToWax.map((item) => (
                    <View key={item.id} style={{ marginBottom: 8 }}>
                      {renderToWax({ item, index: 0, separators: { highlight: () => { }, unhighlight: () => { }, updateProps: () => { } } })}
                    </View>
                  ))}
                </Tile>
              )}
            </ScrollView>
          </View>
        </>
      )}

      {/* Onglet latéral pour les notifications d'entretien - au-dessus de tout */}
      {(filteredToSharp.length > 0 || filteredToWax.length > 0) && (
        <TouchableOpacity
          onPress={() => setMaintenanceDrawerOpen(!maintenanceDrawerOpen)}
          style={{
            position: 'absolute',
            left: maintenanceDrawerOpen ? '80%' : 0,
            bottom: 16,
            backgroundColor: colorsTheme.notification,
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
          <AppIcon name={"entretien"} color={colorsTheme.text} size={22} />
          <Pastille
            size={28}
            name={(filteredToSharp.length + filteredToWax.length).toString()}
            color={colorsTheme.pastille}
            textColor={colorsTheme.text}
          />
        </TouchableOpacity>
      )}

      {/* FAB principal (droite) - visible seulement si la modale n'est pas ouverte */}
      {!maintenanceDrawerOpen && (
        <TouchableOpacity
          onPress={() => setFabOpen(!fabOpen)}
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            backgroundColor: colorsTheme.primary,
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.27,
            shadowRadius: 4.65,
          }}
        >
          <AppIcon
            name={fabOpen ? "cross" : "menu"}
            color={colorsTheme.text}
            size={24}
          />
        </TouchableOpacity>
      )}
    </Body>

  );
}