import Body from "@/components/Body";
import Separator from "@/components/Separator";
import Tile from "@/components/Tile";
import TileIconTitle from "@/components/TileIconTitle";
import AppStyles from "@/constants/AppStyles";
import AppContext from "@/context/AppContext";
import { ThemeContext } from "@/context/ThemeContext";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useContext, useState } from "react"
import { useFocusEffect } from "expo-router";
import { Pressable, Text } from 'react-native';
import RowItem from "@/components/RowItem";
import Row from "@/components/Row";
import { FlatList } from "react-native-gesture-handler";
import { Friends, getFriendsWithOutingsCountByTypeOfOuting } from "@/hooks/dbFriends";
import { getAllTypeOfOutings, initTypeOfOutings, TOO } from "@/hooks/dbTypeOfOuting";
import AppIcon from "@/components/AppIcon";
import ModalEditor from "@/components/ModalEditor";
import AppButton from "@/components/AppButton";

export default function tabFriends() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();

  const { t } = useContext(AppContext);

  const [listFriends, setListFriends] = useState<Friends[]>([]);
  const [typeOfOuting, setTypeOfOuting] = useState<TOO[]>([]);
  const [typeOfOutingFilter, setTypeOfOutingFilter] = useState<TOO>(initTypeOfOutings());
  const [modaleVisible, setModaleVisible] = useState<boolean>(false);

  //filteredFriends
  const filteredFriends = listFriends.filter(friend => friend.typeOfOuting === typeOfOutingFilter.id || typeOfOutingFilter.id === "not-an-id");
  //extract list of distinct friends (by id) from filteredFriends
  const uniqueFriendIds = Array.from(new Set(filteredFriends.map(f => f.id)));

  // Fetch friends with outings count
  const fetchFriends = async () => {
    try {
      const friendsData = await getFriendsWithOutingsCountByTypeOfOuting(db);
      console.log("Fetched friends:", friendsData);
      setListFriends(friendsData);
      const tooData = await getAllTypeOfOutings(db);
      // Supprime les types de sorties non utilisés
      const usedTooIds = new Set(friendsData.map(f => f.typeOfOuting).filter(id => id !== undefined));
      const filteredTooData = tooData.filter(too => usedTooIds.has(too.id));
      console.log("Fetched type of outings:", filteredTooData);
      setTypeOfOuting(filteredTooData);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFriends();
    }, [])
  );

  return (
    <Body inTabs={true}>
      <Text style={appStyles.title}>{t("menu_friends")}</Text>
      <Separator />
      <Tile>
        <Row>
          <AppIcon name="filter" size={24} color={colorsTheme.text} />
          <Pressable style={{ flex: 1, marginLeft: 8 }} onPress={() => setModaleVisible(true)}>
            {typeOfOutingFilter.id !== "not-an-id" ? (
              <Text style={appStyles.text}>{typeOfOutingFilter.name}</Text>
            ) : (
              <Text style={appStyles.inactiveText}>{t("choose_filter")}</Text>
            )}
          </Pressable>
        </Row>
      </Tile>
      <Separator />
      {/* Friends list with outings count */}
      <Tile flex={1}>
        <TileIconTitle usersIconName={"accessibility"} littleIconName={"star-full"} textColor={colorsTheme.text} />
        <FlatList
          data={uniqueFriendIds} //only show unique friends
          keyExtractor={(item) => item}
          onRefresh={fetchFriends}
          refreshing={false}
          renderItem={({ item }) => (
            <RowItem isActive={false} onSelect={() => { }}>
              {filteredFriends.filter(f => f.id === item).map((f, index) => (
                <Row key={f.typeOfOuting ?? "no-type"}>
                  {<Text style={[appStyles.text, { marginHorizontal: 4, flex: 1 }]}>{index === 0 ? listFriends.find(f => f.id === item)?.name : ""}</Text>}
                  <Text style={[appStyles.text, { flex: 2 }]}>{(f.typeOfOuting ? typeOfOuting.find(too => too.id === f.typeOfOuting)?.name : t("type_of_outing_all"))}</Text>
                  <Text style={appStyles.text}>{f.nbOutings}</Text>
                </Row>
              ))}
            </RowItem>
          )}
        />
      </Tile>
      <ModalEditor visible={modaleVisible}>
        <Text style={appStyles.title}>{t('choose_filter')}</Text>
        <Tile>
          <FlatList
            data={typeOfOuting}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RowItem isActive={typeOfOutingFilter.id === item.id} onSelect={() => {
                if (item.id === typeOfOutingFilter.id) {
                  setTypeOfOutingFilter(initTypeOfOutings());
                  setModaleVisible(false);
                  return;
                }
                setTypeOfOutingFilter(item);
                setModaleVisible(false);
              }}>
                <Text style={[appStyles.text, {backgroundColor: typeOfOutingFilter.id === item.id ? colorsTheme.activeBackground : 'transparent'}]}>{item.name}</Text>
              </RowItem>
            )}
          />
        </Tile>
        <AppButton onPress={() => setModaleVisible(false)} color={colorsTheme.activeButton} caption={t('cancel')} />
      </ModalEditor>
    </Body>
  );
}