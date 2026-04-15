import AddButton from "@/components/AddButton";
import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import Card from "@/components/Card";
import ModalEditor from "@/components/ModalEditor";
import Row from "@/components/Row";
import RowItem from "@/components/RowItem";
import Separator from "@/components/Separator";
import Tile from "@/components/Tile";
import TileIconTitle from "@/components/TileIconTitle";
import AppStyles from "@/constants/AppStyles";
import AppContext from "@/context/AppContext";
import { ThemeContext } from "@/context/ThemeContext";
import { Friends, deleteFriend, getFriendsWithOutingsCount, initFriend, insertFriend, updateFriend } from "@/hooks/dbFriends";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Alert, FlatList, Text, TextInput, TouchableOpacity } from "react-native";

export default function FriendsManagement() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();

  const [friends, setFriends] = useState<Friends[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friends>(initFriend());
  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");
  const inputRef = useRef<TextInput>(null);

  const { t, webDavSync, lastWebDavSync } = useContext(AppContext);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Refresh data after sync
  useEffect(() => {
    if (lastWebDavSync > 0) {
      loadData();
    }
  }, [lastWebDavSync]);

  async function loadData() {
    // Ajoute itemCount si tu veux afficher le nombre d'utilisations (exemple : sorties associées)
    const res: Friends[] = await getFriendsWithOutingsCount(db);
    setFriends(res);
  }

  function openAddModal() {
    setEditingFriend(initFriend());
    setName("");
    setModalVisible(true);
  }

  function openEditModal(friend: Friends) {
    setEditingFriend(friend);
    setName(friend.name);
    setModalVisible(true);
  }

  async function saveAction() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (editingFriend.id !== "not-an-id") {
      await updateFriend(db, { id: editingFriend.id, name: trimmedName, nbOutings: 0 });
    } else {
      await insertFriend(db, { name: trimmedName });
    }
    setModalVisible(false);
    setEditingFriend(initFriend());
    setName("");
    inputRef.current?.blur();
    webDavSync();
    loadData();
  }

  function handleDelete(friend: Friends) {
    Alert.alert(
      t('delete'),
      t('del_friend') || 'Supprimer cet ami ?',
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('ok'),
          onPress: async () => {
            await deleteFriend(db, friend.id);
            loadData();
            webDavSync();
          },
        }
      ]
    );
  }

  function cancelAction() {
    setModalVisible(false);
    setEditingFriend(initFriend());
    setName("");
    inputRef.current?.blur();
  }

  function renderItem(item: Friends) {
    const nbActions = item.nbOutings || 0;

    return (
      <RowItem
        isActive={item.id === editingFriend.id}
        onSelect={() => {
          if (item.id === editingFriend.id) {
            setEditingFriend(initFriend());
          } else {
            setEditingFriend(item);
          }
        }}
        onEdit={() => openEditModal(item)}
        onDelete={nbActions === 0 ? () => handleDelete(item) : undefined}
        deleteMode="delete"
      >
        <Row>
          <Text style={appStyles.title}>
            {item.name}
          </Text>
          {(nbActions) > 0 && (
            <Card>
              <AppIcon name="sortie" color={colorsTheme.text} />
              <Text style={[appStyles.text]}>{nbActions}</Text>
            </Card>
          )}
        </Row>
      </RowItem>
    );
  }

  const normalizedKeyword = keyword
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const filteredFriends = friends.filter((friend) =>
    friend.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .includes(normalizedKeyword)
  );

  return (
    <Body>
      <Text style={[appStyles.title, { marginBottom: 8 }]}>
        {t("menu_friends")}
      </Text>
      <Tile>
        <Row>
          <AppIcon name={"search"} color={colorsTheme.text} styles={{ fontSize: 28, width: "auto" }} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            style={{ color: colorsTheme.text, fontSize: 20, flex: 1 }}
            placeholder={t("name")}
            placeholderTextColor={colorsTheme.inactiveText}
          />
          <TouchableOpacity onPress={() => setKeyword("")}>
            <AppIcon name={"cancel-circle"} color={colorsTheme.inactiveText} styles={{ fontSize: 20 }} />
          </TouchableOpacity>
        </Row>
      </Tile>
      <Separator />
      <Tile flex={1}>
        <TileIconTitle
          littleIconName={"star-full"}
          usersIconName={"accessibility"}
          textColor={colorsTheme.text}
          pastilleColor={colorsTheme.pastille}
          pastilleValue={filteredFriends.length.toString()}
        />
        <FlatList
          data={filteredFriends}
          onRefresh={loadData}
          refreshing={false}
          keyExtractor={f => f.id}
          renderItem={({ item }) => renderItem(item)}
        />
      </Tile>
      <AddButton onPress={openAddModal} disabled={false} />
      {
      }
      <ModalEditor visible={modalVisible}>
        <Row>
          <Text style={[appStyles.title, { flex: 1, textAlign: 'center' }]}>
            {editingFriend.id !== "not-an-id" ? t("modify_friend") : t("add_friend")}
          </Text>
        </Row>
        <Row>
          <TextInput
            placeholder={t("name")}
            value={name}
            onChangeText={setName}
            style={[appStyles.editField, { fontSize: 28 }]}
            placeholderTextColor={colorsTheme.inactiveText}
            ref={inputRef}
          />
        </Row>
        <Row>
          <AppButton caption={editingFriend.id !== "not-an-id" ? t("modify") : t("add")} onPress={saveAction} color={colorsTheme.primary} flex={1} textColor={colorsTheme.text} />
          <AppButton caption={t("cancel")} onPress={cancelAction} color={colorsTheme.inactiveText} flex={1} textColor={colorsTheme.text} />
        </Row>
      </ModalEditor>
    </Body>
  );
}