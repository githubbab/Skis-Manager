import AddButton from "@/components/AddButton";
import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import Card from "@/components/Card";
import ModalEditor from "@/components/ModalEditor";
import Row from "@/components/Row";
import RowItem from "@/components/RowItem";
import Tile from "@/components/Tile";
import TileIconTitle from "@/components/TileIconTitle";
import AppStyles from "@/constants/AppStyles";
import AppContext from "@/context/AppContext";
import { ThemeContext } from "@/context/ThemeContext";
import { OffPistes, deleteOffPiste, getAllOffPistes, initOffPiste, insertOffPiste, updateOffPiste } from "@/hooks/dbOffPistes";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Alert, FlatList, Text, TextInput } from "react-native";

export default function OffpistesManagement() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();

  const [offpistes, setOffpistes] = useState<OffPistes[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOffpiste, setEditingOffpiste] = useState<OffPistes>(initOffPiste());
  const [name, setName] = useState("");
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
    const res: OffPistes[] = await getAllOffPistes(db);
    setOffpistes(res);
  }

  function openAddModal() {
    setEditingOffpiste(initOffPiste());
    setName("");
    setModalVisible(true);
  }

  function openEditModal(offpiste: OffPistes) {
    setEditingOffpiste(offpiste);
    setName(offpiste.name);
    setModalVisible(true);
  }

  async function saveAction() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (editingOffpiste.id !== "not-an-id") {
      await updateOffPiste(db, { id: editingOffpiste.id, name: trimmedName, count: 0 });
    } else {
      await insertOffPiste(db, { name: trimmedName });
    }
    setModalVisible(false);
    setEditingOffpiste(initOffPiste());
    setName("");
    inputRef.current?.blur();
    webDavSync();
    loadData();
  }

  function handleDelete(offpiste: OffPistes) {
    Alert.alert(
      t('delete'),
      t('del_offpiste'),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('ok'),
          onPress: async () => {
            await deleteOffPiste(db, offpiste.id);
            loadData();
            webDavSync();
          },
        }
      ]
    );
  }

  function cancelAction() {
    setModalVisible(false);
    setEditingOffpiste(initOffPiste());
    setName("");
    inputRef.current?.blur();
  }

  function renderItem(item: OffPistes) {
    const nbActions = item.count || 0;

    return (
      <RowItem
        onSelect={() => {
          if (item.id === editingOffpiste.id) {
            setEditingOffpiste(initOffPiste());
          } else {
            setEditingOffpiste(item);
          }
        }}
        onEdit={() => openEditModal(item)}
        onDelete={nbActions === 0 ? () => handleDelete(item) : undefined}
        isActive={item.id === editingOffpiste.id}
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
    )
  }

  return (
    <Body>
      <Text style={[appStyles.title, { marginBottom: 8 }]}>
        {t("menu_offpistes")}
      </Text>
      <Tile flex={1}>
        <TileIconTitle littleIconName={"star-full"} usersIconName={"hors-piste"} textColor={colorsTheme.text} />
        <FlatList
          data={offpistes}
          onRefresh={loadData}
          refreshing={false}
          keyExtractor={o => o.id}
          renderItem={({ item }) => renderItem(item)}
        />
      </Tile>
      <AddButton onPress={openAddModal} disabled={false} />
      {
      }
      <ModalEditor visible={modalVisible}>
        <Row>
          <Text style={[appStyles.title, { flex: 1, textAlign: 'center' }]}>
            {editingOffpiste.id !== "not-an-id" ? t("modify") : t("add")}
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
          <AppButton caption={editingOffpiste.id !== "not-an-id" ? t("modify") : t("add")} onPress={saveAction} color={colorsTheme.primary} flex={1} textColor={colorsTheme.text} />
          <AppButton caption={t("cancel")} onPress={cancelAction} color={colorsTheme.inactiveText} flex={1} textColor={colorsTheme.text} />
        </Row>
      </ModalEditor>
    </Body>
  );
}