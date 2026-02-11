import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import Card from "@/components/Card";
import CheckButton from "@/components/CheckButton";
import ModalEditor from "@/components/ModalEditor";
import Pastille from "@/components/Pastille";
import Row from "@/components/Row";
import RowItem from "@/components/RowItem";
import Tile from "@/components/Tile";
import TileIconTitle from "@/components/TileIconTitle";
import AppStyles from "@/constants/AppStyles";
import AppContext from "@/context/AppContext";
import { ThemeContext } from "@/context/ThemeContext";
import { Boots, getAllBoots } from "@/hooks/dbBoots";
import { Friends, getAllFriends } from "@/hooks/dbFriends";
import { deleteMaintain, getAllMaintains, initMaintain, insertMaintain, Maintains, updateMaintain } from "@/hooks/dbMaintains";
import { getAllOffPistes, OffPistes } from "@/hooks/dbOffPistes";
import { deleteOuting, getAllOutings, initOuting, insertOuting, Outings, updateOuting } from "@/hooks/dbOutings";
import { getSeasonSkis, Skis } from "@/hooks/dbSkis";
import { getAllTypeOfOutings, TOO } from "@/hooks/dbTypeOfOuting";
import { getAllUsers, Users } from "@/hooks/dbUsers";
import { Logger, smDate, PartOfDay, PartOfDayUtils } from "@/hooks/ToolsBox";
import PartOfDaySelector from "@/components/PartOfDaySelector";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { Alert, Image, ListRenderItem, Text, TextInput, TouchableOpacity, View, FlatList, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

const iconSize = 32; // Size for icons in the filter row

// IDs spéciaux pour les locations et prêts
const RENTAL_SKIS_ID = "RENTAL-SKIS";
const RENTAL_BOOTS_ID = "RENTAL-BOOTS";
const LOAN_USER_ID = "LOAN-USER";

type EventsType = { type: "outing" | "maintain"; data: Outings | Maintains };
type ListItemType = EventsType | { type: "separator"; date: number; dateString: string };

const Events = () => {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const [dbState, setDbState] = useState("none");
  const db = useSQLiteContext();

  const [listEvents, setListEvents] = useState<EventsType[]>([]);
  const [tooFilter, setTooFilter] = useState<TOO | null>(null);
  const [viewTooFilter, setViewTooFilter] = useState<boolean>(false);
  const [userFilter, setUserFilter] = useState<Users | null>(null);
  const [viewUserFilter, setViewUserFilter] = useState<boolean>(false);
  const [skisFilter, setSkisFilter] = useState<Skis | null>(null);
  const [viewSkisFilter, setViewSkisFilter] = useState<boolean>(false);
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
  const [typeOfOutingVisible, setTypeOfOutingVisible] = useState<boolean>(false);
  const [maintainsVisible, setMaintainsVisible] = useState<boolean>(false);
  const [offPisteVisible, setOffPisteVisible] = useState<boolean>(false);
  const [partOfDay, setPartOfDay] = useState<PartOfDay>("morning");
  const [outingViewUser, setOutingViewUser] = useState<boolean>(false);
  const [outingViewSkis, setOutingViewSkis] = useState<boolean>(false);
  const [outingViewBoots, setOutingViewBoots] = useState<boolean>(false);
  const [outingViewToOuting, setOutingViewToOuting] = useState<boolean>(false);
  const [outingViewOffPiste, setOutingViewOffPiste] = useState<boolean>(false);
  const [outingViewFriends, setOutingViewFriends] = useState<boolean>(false);
  const [effectActive, setEffectActive] = useState<boolean>(false);
  const [maintainViewSharp, setMaintainViewSharp] = useState<boolean>(true);
  const [maintainViewWax, setMaintainViewWax] = useState<boolean>(true);
  const [maintainViewRepair, setMaintainViewRepair] = useState<boolean>(true);

  const { t, localeDate: localeDate, seasonDate, viewOuting, viewFriends, webDavSync, lastWebDavSync } = useContext(AppContext)!;

  const handleCancelFilters = () => {
    setViewUserFilter(false);
    setViewSkisFilter(false);
    setViewTooFilter(false);
  };

  const skis4filter = listSkis.filter(s => listEvents.some(o => o.data.idSkis === s.id));
  const users4filter = listUsers.filter(u => listEvents.some(o => 'idUser' in o.data && o.data.idUser === u.id));
  const too4filter = listOutingTypes.filter(t => listEvents.some(o => 'idOutingType' in o.data && o.data.idOutingType === t.id));
  const filteredEvents = listEvents.filter(s => {
    let ret = true;
    if ('idOutingType' in s.data && tooFilter) {
      ret = s.data.idOutingType === tooFilter.id;
    }
    if ('idUser' in s.data && userFilter) {
      ret = s.data.idUser === userFilter.id && ret;
    }
    if (skisFilter) {
      ret = ret && s.data.idSkis === skisFilter.id;
    }
    // Check if s is a Maintains object by checking for a property unique to Maintains
    if ('swr' in s.data) {
      if (tooFilter || userFilter) {
        ret = false;
      }
      if (s.data.swr !== "") {
        let ret2 = false;
        if (maintainViewSharp && /S/.test(s.data.swr)) {
          ret2 = true;
        }
        if (maintainViewWax && /W/.test(s.data.swr)) {
          ret2 = true;
        }
        if (maintainViewRepair && /R/.test(s.data.swr)) {
          ret2 = true;
        }
        if (!ret2) {
          ret = false;
        }
      }
    }
    return ret;
  }) || [];

  // Ajouter les séparateurs de jour
  const list2View: ListItemType[] = [];
  let lastDate: string | null = null;

  filteredEvents.forEach((event) => {
    const eventDate = new Date(event.data.date);
    const dateString = localeDate(event.data.date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (dateString !== lastDate) {
      list2View.push({
        type: "separator",
        date: event.data.date,
        dateString: dateString
      });
      lastDate = dateString;
    }

    list2View.push(event);
  });

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
  const filterMaintainSkis = () => listSkis.sort((a, b) => {
    const aNb = a.nbOutings || 0;
    const bNb = b.nbOutings || 0;
    return bNb - aNb;
  });

  const loadData = async () => {
    setDbState("loading");
    try {
      const outings = await getAllOutings(db, smDate(seasonDate));
      const maintains = await getAllMaintains(db, smDate(seasonDate));
      const events: EventsType[] = [];
      for (const outing of outings) {
        events.push({ type: "outing", data: outing });
      }
      for (const maintain of maintains) {
        events.push({ type: "maintain", data: maintain });
      }
      setListEvents(events.sort((a, b) => b.data.date - a.data.date));
      setListUsers(await getAllUsers(db, smDate(seasonDate)));
      setListSkis(await getSeasonSkis(db));
      setListBoots(await getAllBoots(db, smDate(seasonDate)));
      setListOutingTypes(await getAllTypeOfOutings(db));
      setListFriends(await getAllFriends(db));
      setListOffPistes(await getAllOffPistes(db));
    } catch (error) {
      Logger.error("Error loading data:", error);
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
        Logger.debug("OffPiste not found:", off.id);
        continue;
      }
      extractedOffPistes.push({ ...offPiste, count: off.nb });
    }
    return extractedOffPistes;
  };

  useFocusEffect(
    useCallback(() => {
      if (dbState === "loading") return;
      loadData();
    }, [])
  )

  // Refresh data after sync
  useEffect(() => {
    Logger.debug("events - lastWebDavSync changed, reloading data");
    if (lastWebDavSync > 0) {
      loadData();
    }
  }, [lastWebDavSync]);

  useEffect(() => {
    if (effectActive) {
      Logger.debug("useEffect active, skipping outing2write update");
      return;
    }
    setEffectActive(true);
    if (outing2write.date) {
      setOutingViewUser(true);
      const hours = new Date(outing2write.date).getHours();
      setPartOfDay(PartOfDayUtils.getPartOfDayFromHour(hours));
    }
    else {
      setOutingViewUser(false);
    }
    let outing = outing2write
    if (outing2write.idUser) {
      setOutingViewSkis(true);
      const skis = filterOutingSkis(outing2write.idUser || "", outing2write.date || Date.now());
      if (skis.length === 1 && !outing.idSkis) {
        outing = { ...outing, idSkis: skis[0].id };
      }
    }
    else {
      setOutingViewSkis(false);
    }
    if (outing2write.idSkis) {
      setOutingViewBoots(true);
      const boots = filterOutingBoots(outing2write.idUser || "", outing2write.date || Date.now(), outing2write.idSkis || "");
      if (boots.length === 1 && !outing.idBoots) {
        outing = { ...outing, idBoots: boots[0].id };
      }
    } else {
      setOutingViewBoots(false);
    }
    if (outing2write.idBoots) {
      if (viewOuting) {
        setOutingViewToOuting(true);
        const majorType = listSkis.find(ski => ski.id === outing2write.idSkis)?.majorTypeOfOuting;
        if (majorType && !outing.idOutingType) {
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
          if (boots.length === 1) {
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

  function openDateTimeModal(type: "outing" | "maintain") {
    setDateTimePickerVisible(type);
  }

  function onDateChange(event: any, selectedDate: Date | undefined) {
    if (event.type === "set" && selectedDate) {
      const currentEventDate = new Date(dateTimePickerVisible === "outing" ? outing2write.date || Date.now() : maintain2write.date || Date.now());

      // Mise à jour de la date en gardant l'heure actuelle
      const finalDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        currentEventDate.getHours(),
        currentEventDate.getMinutes()
      );
      changeDate(finalDate, dateTimePickerVisible as "outing" | "maintain");
    }
    setDateTimePickerVisible("none");
  }

  const cancelAction = async () => {
    setMaintainsVisible(false);
    setMaintain2Write(initMaintain());
    setOutingVisible(false);
    setOuting2Write(initOuting());
    setDateTimePickerVisible("none");
    setViewSkisFilter(false);
    setViewTooFilter(false);
    setViewUserFilter(false);
    setOutingViewBoots(false);
    setOutingViewFriends(false);
    setOutingViewOffPiste(false);
    setOutingViewSkis(false);
    setOutingViewToOuting(false);
    setOutingViewUser(false);
    setOffPisteVisible(false);
    setFriendsVisible(false);
    setTypeOfOutingVisible(false);
    await loadData(); // Reload data after cancelling
  }

  const saveOuting = async () => {
    if (outing2write.id === "not-an-id") {
      await insertOuting(db, outing2write);
    } else {
      await updateOuting(db, outing2write);
    }
    setOutingVisible(false);
    setOuting2Write(initOuting());
    webDavSync();
    await loadData(); // Reload data after saving
  }
  const handleDeleteOuting = (outing: Outings) => {
    Alert.alert(
      t('delete'),
      t("del_outing"),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('ok'),
          onPress: () => {
            if (outing?.id) {
              deleteOuting(db, outing.id).then(() => {
                webDavSync();
                loadData();
              });
            }
          },
        }
      ]
    );
    setMaintainsVisible(false);
    setOutingVisible(false);
  }

  const saveMaintain = async () => {
    if (maintain2write.id === "not-an-id") {
      await insertMaintain(db, maintain2write);
    } else {
      await updateMaintain(db, maintain2write);
    }
    setMaintainsVisible(false);
    setMaintain2Write(initMaintain());
    await loadData(); // Reload data after saving
    webDavSync();
  }
  const handleDeleteMaintain = (maintain: Maintains) => {
    Alert.alert(
      t('delete'),
      t("del_maintain"),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('ok'),
          onPress: () => {
            if (maintain?.id) {
              deleteMaintain(db, maintain.id).then(
                () => {
                  webDavSync();
                  loadData()
                }
              )
            }
          },
        }
      ]
    );
    setMaintainsVisible(false);
    setOutingVisible(false);
  }

  const renderOutingSkis: ListRenderItem<Skis> = ({ item }) => {
    return (
      <TouchableOpacity key={item.id} onPress={() => {
        if (outing2write.idSkis === item.id) {
          const skis = filterOutingSkis(outing2write.idUser || "", outing2write.date || Date.now());
          if (skis.length !== 1) {
            setOuting2Write({ ...outing2write, idSkis: undefined, idBoots: undefined, idOutingType: undefined });
          }
        } else {
          const boots = filterOutingBoots(outing2write.idUser || "", outing2write.date || Date.now(), item.id);
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
        </Row>
      </TouchableOpacity>
    )
  }

  const renderItem: ListRenderItem<any> = ({ item }) => {
    if (item.type === "separator") {
      return (
        <View style={{
          paddingTop: 0,
          paddingBottom: 0,
          paddingHorizontal: 0,
          borderTopWidth: 1,
          borderTopColor: colorsTheme.separator,
          marginTop: 16
        }}>
          <Text style={appStyles.textItalic}>
            {item.dateString}
          </Text>
        </View>
      );
    }
    if (item.type === "outing") {
      const outingSkis: Skis | undefined = listSkis.find(s => s.id === item.data.idSkis);
      const isRentalSkis = item.data.idSkis === RENTAL_SKIS_ID;
      if (!outingSkis && !isRentalSkis) {
        Logger.debug("No skis found for outing:", item.id, item.idSkis);
        return null;
      }
      const outingBoots: Boots | undefined = listBoots.find(b => b.id === item.data.idBoots);
      const isRentalBoots = item.data.idBoots === RENTAL_BOOTS_ID;
      if (!outingBoots && !isRentalBoots) {
        Logger.debug("No boots found for outing:", item.id, item.data.idBoots);
        return null;
      }
      const outingType: TOO | undefined = listOutingTypes.find(t => t.id === item.data.idOutingType);
      const outingUser: Users | undefined = listUsers.find(u => u.id === item.data.idUser);
      const isLoan = item.data.idUser === LOAN_USER_ID;
      if (!outingUser && !isLoan) {
        Logger.debug("No user found for outing:", item.id);
        return null;
      }
      const outingFriends: Friends[] = listFriends.filter(f => item.data.idFriends?.includes(f.id));
      const outingOffPistes: OffPistes[] = extractOffPistes(item.data.listOfOffPistes);
      return (
        <RowItem
          key={item.data.id}
          isActive={outing2write.id === item.data.id}
          onSelect={() => {
            setMaintain2Write(initMaintain());
            if (outing2write.id === item.data.id) {
              setOuting2Write(initOuting());
            } else {
              setOuting2Write(item.data);
            }
          }}
          onDelete={() => handleDeleteOuting(item.data)}
          onEdit={() => {
            setOuting2Write(item.data);
            setOutingVisible(true);
          }}
          style={{ backgroundColor: colorsTheme.transparentBlue }}

        >
          <Row>
            <Feather
              name={PartOfDayUtils.getPartOfDayIcon(PartOfDayUtils.getPartOfDayFromHour(new Date(item.data.date).getHours()))}
              size={16}
              color={colorsTheme.text}
              style={{ position: 'absolute', right: 4, bottom: 2 }}
            />
            <AppIcon name={"sortie"} color={colorsTheme.primary} styles={{ marginLeft: 4 }} />
            <View style={{ flex: 1 }}>

              {!skisFilter &&
                <Row>
                  <AppIcon name={"skis"} color={colorsTheme.text} />
                  {isRentalSkis ? (
                    <>
                      <AppIcon name={"credit-card"} color={colorsTheme.text} size={20} />
                      <Text numberOfLines={1}
                        style={{ color: colorsTheme.text, fontSize: 20, flex: 1, fontStyle: 'italic' }}
                      >
                        {t('rental_skis')}
                      </Text>
                    </>
                  ) : outingSkis ? (
                    <>
                      {outingSkis.icoTypeOfSkisUri ?
                        <Image source={{ uri: outingSkis.icoTypeOfSkisUri }} style={{ width: iconSize, height: iconSize }} /> :
                        <Pastille size={iconSize} name={outingSkis.typeOfSkis || ""} />
                      }
                      <Image source={{ uri: outingSkis.icoBrandUri }}
                        style={{ width: iconSize, height: iconSize }} />
                      <Text numberOfLines={1}
                        style={{ color: colorsTheme.text, fontSize: 20, flex: 1, fontWeight: 'bold' }}
                      >
                        {outingSkis.size ? outingSkis.size + " " : ""}{outingSkis.radius ? outingSkis.radius + "m " : ""}{outingSkis.name}
                      </Text>
                    </>
                  ) : null}
                  {!userFilter && (
                    isLoan ? (
                      <Text style={[appStyles.text, { fontStyle: 'italic', fontSize: 16 }]}>{t('loan_equipment')}</Text>
                    ) : (
                      <Pastille size={iconSize} name={outingUser?.name || ""} color={outingUser?.pcolor} />
                    )
                  )}
                </Row>
              }
              <Row>
                <AppIcon name={"ski-boot"} color={colorsTheme.text} />
                {isRentalBoots ? (
                  <>
                    <AppIcon name={"credit-card"} color={colorsTheme.text} size={20} />
                    <Text style={{ color: colorsTheme.text, fontSize: 20, flex: 1, fontStyle: 'italic' }}>
                      {t('rental_boots')}
                    </Text>
                  </>
                ) : outingBoots ? (
                  <>
                    <Image source={{ uri: outingBoots.icoBrandUri }}
                      style={{ width: iconSize, height: iconSize }} />
                    <Text style={{ color: colorsTheme.text, fontSize: 20, flex: 1, fontWeight: 'bold' }}>
                      {outingBoots.flex ? outingBoots.flex + " " : ""}
                      {outingBoots.size ? "T" + outingBoots.size + " " : ""}
                      {outingBoots.name}
                    </Text>
                  </>
                ) : null}
                {outingFriends.length > 0 && (
                  <Card>
                    <AppIcon name={"accessibility"} color={colorsTheme.text} />
                    {outingFriends.map(friend => (
                      <Pastille key={friend.id} name={friend.name} />
                    ))}
                  </Card>
                )}
              </Row>
              {outingType && !tooFilter &&
                <Row>
                  <AppIcon name={"slope"} color={colorsTheme.text} />
                  <Text style={{ color: colorsTheme.text, fontSize: 20, flex: 1, fontStyle: 'italic' }}>
                    {outingType?.name || ""}
                    {outingOffPistes.length > 0 && `(${outingOffPistes.reduce((sum, off) => sum + (off.count || 0), 0)})`}
                  </Text>
                </Row>
              }
              {outingOffPistes.length > 0 &&
                <Row>
                  <AppIcon name={"hors-piste"} color={colorsTheme.text} />
                  <Text style={[appStyles.text, { fontSize: 18, flex: 1 }]}>
                    {outingOffPistes.map(off => `${off.name} (${off.count})`).join(', ')}
                  </Text>
                </Row>
              }

            </View>
          </Row>
        </RowItem>
      );
    }
    if (item.type === "maintain") {
      const maintainSkis: Skis | undefined = listSkis.find(s => s.id === item.data.idSkis);
      if (!maintainSkis) {
        Logger.debug("No skis found for maintain", item.data.idSkis);
        return null;
      }
      const description = () => {
        if (item.data.description) return item.data.description;
        if (item.data.swr) {
          const swrParts = [];
          if (/S/.test(item.data.swr)) swrParts.push(t("sharpening"));
          if (/W/.test(item.data.swr)) swrParts.push(t("waxing"));
          if (/R/.test(item.data.swr)) swrParts.push(t("repair"));
          return swrParts.join(", ");
        }
        return "Pas de description";
      }
      const maintainIconSize = item.data.swr && item.data.swr.length > 2 ? iconSize * 0.6 : item.data.swr && item.data.swr.length > 1 ? iconSize * 0.8 : iconSize;
      return (
        <RowItem
          key={item.data.id}
          isActive={maintain2write.id === item.data.id}
          onSelect={() => {
            setOuting2Write(initOuting());
            if (maintain2write.id === item.data.id) {
              setMaintain2Write(initMaintain());
            } else {
              setMaintain2Write(item.data);
            }
          }}
          onDelete={() => handleDeleteMaintain(item.data)}
          onEdit={() => {
            setPartOfDay(PartOfDayUtils.getPartOfDayFromHour(new Date(item.data.date).getHours()));
            setMaintain2Write(item.data);
            setMaintainsVisible(true);
          }}
          style={{ backgroundColor: colorsTheme.transparentGreen }}
        >
          <Row>
            <Feather
              name={PartOfDayUtils.getPartOfDayIcon(PartOfDayUtils.getPartOfDayFromHour(new Date(item.data.date).getHours()))}
              size={16}
              color={colorsTheme.text}
              style={{ position: 'absolute', right: 4, bottom: 2 }}
            />
            <View style={{ width: iconSize, alignItems: 'center' }}>
              {/S/.test(item.data.swr) && <AppIcon name={"affuteuse"} color={colorsTheme.primaryGreen} size={maintainIconSize} />}
              {/W/.test(item.data.swr) && <AppIcon name={"fartage"} color={colorsTheme.primaryGreen} size={maintainIconSize} />}
              {/R/.test(item.data.swr) && <AppIcon name={"aid-kit"} color={colorsTheme.warning} size={maintainIconSize} />}
            </View>
            <View style={{ flex: 1 }}>


              {!skisFilter &&
                <Row>
                  {maintainSkis.icoTypeOfSkisUri ?
                    <Image source={{ uri: maintainSkis.icoTypeOfSkisUri }} style={{ width: iconSize, height: iconSize }} /> :
                    <Pastille size={iconSize} name={maintainSkis.typeOfSkis || ""} />
                  }
                  <Image source={{ uri: maintainSkis.icoBrandUri }}
                    style={{ width: iconSize, height: iconSize }} />
                  <Text numberOfLines={1}
                    style={{ color: colorsTheme.text, fontSize: 20, flex: 4, fontWeight: 'bold' }}
                  >
                    {maintainSkis.size ? maintainSkis.size + " " : ""}{maintainSkis.radius ? maintainSkis.radius + "m " : ""}{maintainSkis.name}
                  </Text>
                </Row>
              }
              <Row isFlex={true}>
                <AppIcon name={"entretien"} color={colorsTheme.primaryGreen} />
                <Text style={{ color: colorsTheme.text, fontSize: 20, flex: 4, fontStyle: 'italic' }}>{description()}</Text>
              </Row>
            </View>
          </Row>
        </RowItem>
      );
    }
    return null; // Fallback if no type matches
  }

  if (dbState !== "done" && listEvents.length === 0) {
    return <Body><Text>Loading...</Text></Body>;
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
      <Row>
        <AppIcon name={"sortie"} color={colorsTheme.text} size={iconSize} styles={{ width: iconSize + 2, height: iconSize + 2 }} />
        <View style={{ flex: 1 }} >
          <Tile >
            <Row>
              <AppIcon name={"users"} color={colorsTheme.text} size={iconSize} />
              <TouchableOpacity onPress={toggleUsersFilter}>
                {(userFilter) ?
                  <Row>
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
            <Row>
              <AppIcon name={"slope"} color={colorsTheme.text} size={iconSize} />
              <TouchableOpacity onPress={toggleTooFilter}>
                {(tooFilter) ?
                  <Row>
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
        </View>
      </Row>
      <Row>
        <AppIcon name={"entretien"} color={colorsTheme.text} size={iconSize} styles={{ width: iconSize + 2, height: iconSize + 2 }} />
        <Row isFlex={true}>
          <Tile flex={1} >
            <TouchableOpacity onPress={() => setMaintainViewSharp(!maintainViewSharp)}>
              <Row>
                <AppIcon name={"affuteuse"} color={maintainViewSharp ? colorsTheme.primary : colorsTheme.inactiveText} size={iconSize} />
                <AppIcon name={maintainViewSharp ? "eye" : "eye-blocked"} color={maintainViewSharp ? colorsTheme.text : colorsTheme.inactiveText} size={iconSize} />
              </Row>
            </TouchableOpacity>
          </Tile>
          <Tile flex={1}>
            <TouchableOpacity onPress={() => setMaintainViewWax(!maintainViewWax)}>
              <Row style={{ marginHorizontal: 'auto', gap: 16 }}>
                <AppIcon name={"fartage"} color={maintainViewWax ? colorsTheme.primary : colorsTheme.inactiveText} size={iconSize} />
                <AppIcon name={maintainViewWax ? "eye" : "eye-blocked"} color={maintainViewWax ? colorsTheme.text : colorsTheme.inactiveText} size={iconSize} />
              </Row>
            </TouchableOpacity>
          </Tile>
          <Tile flex={1}>
            <TouchableOpacity onPress={() => setMaintainViewRepair(!maintainViewRepair)}>
              <Row>
                <AppIcon name={"aid-kit"} color={maintainViewRepair ? colorsTheme.primary : colorsTheme.inactiveText} size={iconSize} />
                <AppIcon name={maintainViewRepair ? "eye" : "eye-blocked"} color={maintainViewRepair ? colorsTheme.text : colorsTheme.inactiveText} size={iconSize} />
              </Row>
            </TouchableOpacity>
          </Tile>
        </Row>
      </Row>

      <Tile flex={1} style={{ marginTop: 16, marginBottom: 8 }} >
        <TileIconTitle
          littleIconName={"calendar"}
          usersIconName={"slope"}
          pastilleColor={colorsTheme.pastille}
          pastilleValue={filteredEvents.length.toString()}
          textColor={colorsTheme.text}
        />

        <FlatList
          data={list2View}
          renderItem={renderItem}
          onRefresh={loadData}
          refreshing={false}
          keyExtractor={(item) => item.type === "separator" ? `sep-${item.date}` : item.data.id}
        />

      </Tile>
      {
      }
      <ModalEditor visible={viewSkisFilter}>
        <Text style={appStyles.title}>{t("filter_skis")}</Text>
        <Tile style={{ marginBottom: 16 }}>
          <ScrollView style={{ maxHeight: 400, width: '100%' }} nestedScrollEnabled={true}>
            {(skis4filter || []).map((item) => (
              <TouchableOpacity key={item.id} onPress={() => {
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
            ))}
          </ScrollView>
        </Tile>
        <AppButton onPress={handleCancelFilters} caption={t("cancel")} />
      </ModalEditor>
      {
      }
      <ModalEditor visible={viewUserFilter}>
        <Text style={appStyles.title}>{t("filter_users")}</Text>
        <Tile style={{ marginBottom: 16 }}>
          <ScrollView style={{ maxHeight: 400, width: '100%' }} nestedScrollEnabled={true}>
            {(users4filter || []).map((item) => (
              <TouchableOpacity key={item.id} onPress={() => {
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
            ))}
          </ScrollView>
        </Tile>
        <AppButton onPress={handleCancelFilters} caption={t("cancel")} />
      </ModalEditor>
      {
      }
      <ModalEditor visible={viewTooFilter}>
        <Text style={appStyles.title}>{t("filter_too")}</Text>
        <Tile style={{ marginBottom: 16 }}>
          <ScrollView style={{ maxHeight: 400, width: '100%' }} nestedScrollEnabled={true}>
            {(too4filter || []).map((item) => (
              <TouchableOpacity key={item.id} onPress={() => {
                setTooFilter(item);
                setViewTooFilter(false);
              }}>
                <Row>
                  <Text numberOfLines={1} style={{ color: colorsTheme.text, fontSize: 20, flex: 1 }}>
                    {item.name}
                  </Text>
                </Row>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Tile>
        <AppButton onPress={handleCancelFilters} caption={t("cancel")} />
      </ModalEditor>
      {
      }
      <ModalEditor visible={outingVisible}>
        <Row>
          <Text style={appStyles.title}>
            {t("modify_outing")}
          </Text>
        </Row>
        <Row>
          <AppIcon name="calendar" color={colorsTheme.text} styles={{ marginRight: 8 }} />
          <Tile flex={1}>
            <TouchableOpacity onPress={() => openDateTimeModal("outing")} >
              <Text style={[appStyles.text, { textAlign: 'center' }]}>
                {localeDate(outing2write.date, { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
          </Tile>
        </Row>
        <Row style={{ marginTop: 8 }}>
          <AppIcon name="clock" color={colorsTheme.text} styles={{ marginRight: 8 }} />
          <PartOfDaySelector
            selectedPart={partOfDay}
            onSelect={(part) => changePartOfDay(part, "outing")}
            style={{ flex: 1 }}
          />
        </Row>

        {outingViewUser &&
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
                          if (boots.length === 1) {
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
        {outingViewSkis &&
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
        {outingViewBoots &&
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
                    {filterOutingBoots(outing2write.idUser || "", outing2write.date || Date.now(), outing2write.idSkis).map((item) =>
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
              <TouchableOpacity onPress={() => setTypeOfOutingVisible(!typeOfOutingVisible)}>
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
            <AppButton onPress={saveOuting} color={colorsTheme.activeButton} flex={1} caption={t('modify')} />
          ) : null}
          <AppButton onPress={cancelAction} color={colorsTheme.transparentGray} flex={1} caption={t('cancel')} />
        </Row>

      </ModalEditor>
      {
      }
      <ModalEditor visible={maintainsVisible}>
        <Row>
          <Text style={appStyles.title}>
            {t("modify_maintain")}
          </Text>
        </Row>
        <Row>
          <AppIcon name="calendar" color={colorsTheme.text} styles={{ marginRight: 8 }} />
          <Tile flex={1}>
            <TouchableOpacity onPress={() => openDateTimeModal("maintain")} style={{ flex: 1 }}>
              <Text style={[appStyles.text, { textAlign: 'center' }]}>
                {localeDate(maintain2write.date, { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
          </Tile>
        </Row>
        <Row style={{ marginTop: 8 }}>
          <AppIcon name="clock" color={colorsTheme.text} styles={{ marginRight: 8 }} />
          <PartOfDaySelector
            selectedPart={partOfDay}
            onSelect={(part) => changePartOfDay(part, "maintain")}
            style={{ flex: 1 }}
          />
        </Row>
        {maintain2write.date ? <Row>
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
        {maintain2write.idSkis !== "not-an-id" && <>
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
            <AppButton onPress={saveMaintain} color={colorsTheme.activeButton} flex={1} caption={t('modify')} />
            : null}
          <AppButton onPress={cancelAction} color={colorsTheme.transparentGray} flex={1} caption={t('cancel')} />
        </Row>
      </ModalEditor>
      {
      }
      {dateTimePickerVisible !== "none" &&
        <DateTimePicker
          value={dateTimePickerVisible === "outing" ? new Date(outing2write.date || Date.now()) : new Date(maintain2write.date || Date.now())}
          maximumDate={new Date()}
          minimumDate={seasonDate}
          mode="date"
          display="calendar"
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
      <ModalEditor visible={typeOfOutingVisible} center={true} onRequestClose={() => setTypeOfOutingVisible(false)}>
        <Row>
          <Text style={appStyles.title}>{t("modify_outing")}</Text>
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
                setTypeOfOutingVisible(false);
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
        <AppButton onPress={() => setTypeOfOutingVisible(false)} caption={t('cancel')} color={colorsTheme.transparentGray} style={{ marginTop: 16 }} />
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

export default Events;