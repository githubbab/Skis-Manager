import AddButton from "@/components/AddButton";
import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import Card from "@/components/Card";
import ModalEditor from "@/components/ModalEditor";
import Pastille from "@/components/Pastille";
import Row from "@/components/Row";
import RowItem from "@/components/RowItem";
import Tile from "@/components/Tile";
import AppStyles from "@/constants/AppStyles";
import AppContext from "@/context/AppContext";
import { ThemeContext } from "@/context/ThemeContext";
import { deleteTypeOfSkis, getAllTypeOfSkis, initTypeOfSkis, insertTypeOfSkis, TOS, updateTypeOfSkis } from "@/hooks/dbTypeOfSkis";
import { useSQLiteContext } from "expo-sqlite";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, FlatList, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as DocumentPicker from 'expo-document-picker';
import { ImageManipulator } from 'expo-image-manipulator';
import { copyToSIco, delToSIco, getToSIcoURI } from "@/hooks/DataManager";

export default function TypeOfSkisManagementScreen() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();
  const { t, webDavSync } = useContext(AppContext);

  const [types, setTypes] = useState<TOS[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTOS, setEditingTOS] = useState<TOS>(initTypeOfSkis());
  const [name, setName] = useState("");
  const [waxNeed, setWaxNeed] = useState<number>(0);
  const [sharpNeed, setSharpNeed] = useState<number>(0);
  const inputRef = useRef<TextInput>(null);
  const [tosImage, setTosImage] = useState<string | undefined>(undefined);
  const [imageChanged, setImageChanged] = useState(false);

  const iconSize = 48;

  //                      #######                                  
  // #    #  ####  ###### #       ###### ###### ######  ####  #####
  // #    # #      #      #       #      #      #      #    #   #  
  // #    #  ####  #####  #####   #####  #####  #####  #        #  
  // #    #      # #      #       #      #      #      #        #  
  // #    # #    # #      #       #      #      #      #    #   #  
  //  ####   ####  ###### ####### #      #      ######  ####    #  
  useEffect(() => {
    loadData();
  }, []);

  //                             ######                     
  // #       ####    ##   #####  #     #   ##   #####   ##  
  // #      #    #  #  #  #    # #     #  #  #    #    #  # 
  // #      #    # #    # #    # #     # #    #   #   #    #
  // #      #    # ###### #    # #     # ######   #   ######
  // #      #    # #    # #    # #     # #    #   #   #    #
  // ######  ####  #    # #####  ######  #    #   #   #    #
  async function loadData() {
    const res: TOS[] = await getAllTypeOfSkis(db);
    setTypes(res);
  }

  //                                #                  #     #                            
  //  ####  #####  ###### #    #   # #   #####  #####  ##   ##  ####  #####    ##   #     
  // #    # #    # #      ##   #  #   #  #    # #    # # # # # #    # #    #  #  #  #     
  // #    # #    # #####  # #  # #     # #    # #    # #  #  # #    # #    # #    # #     
  // #    # #####  #      #  # # ####### #    # #    # #     # #    # #    # ###### #     
  // #    # #      #      #   ## #     # #    # #    # #     # #    # #    # #    # #     
  //  ####  #      ###### #    # #     # #####  #####  #     #  ####  #####  #    # ######
  function openAddModal() {
    setEditingTOS(initTypeOfSkis());
    setName("");
    setWaxNeed(1);
    setSharpNeed(1);
    setModalVisible(true);
  }

  //                             #######                #     #                            
  //  ####  #####  ###### #    # #       #####  # ##### ##   ##  ####  #####    ##   #     
  // #    # #    # #      ##   # #       #    # #   #   # # # # #    # #    #  #  #  #     
  // #    # #    # #####  # #  # #####   #    # #   #   #  #  # #    # #    # #    # #     
  // #    # #####  #      #  # # #       #    # #   #   #     # #    # #    # ###### #     
  // #    # #      #      #   ## #       #    # #   #   #     # #    # #    # #    # #     
  //  ####  #      ###### #    # ####### #####  #   #   #     #  ####  #####  #    # ######
  function openEditModal(tos: TOS) {
    setEditingTOS(tos);
    setName(tos.name);
    setWaxNeed(tos.waxNeed);
    setSharpNeed(tos.sharpNeed);
    setModalVisible(true);

  }

  //                                #                                
  //  ####    ##   #    # ######   # #    ####  ##### #  ####  #    #
  // #       #  #  #    # #       #   #  #    #   #   # #    # ##   #
  //  ####  #    # #    # #####  #     # #        #   # #    # # #  #
  //      # ###### #    # #      ####### #        #   # #    # #  # #
  // #    # #    #  #  #  #      #     # #    #   #   # #    # #   ##
  //  ####  #    #   ##   ###### #     #  ####    #   #  ####  #    #
  async function saveAction() {
    if (!name.trim()) return;
    if (editingTOS.id !== "not-an-id") {
      await updateTypeOfSkis(db, { ...initTypeOfSkis(), id: editingTOS.id, name, waxNeed, sharpNeed });
    } else {
      await insertTypeOfSkis(db, { name, waxNeed, sharpNeed });
    }
    if (imageChanged && tosImage && tosImage.startsWith("file://")) {
      copyToSIco(editingTOS.id, tosImage);
    } else if (imageChanged && (!tosImage || !tosImage?.startsWith("file://"))) {
      delToSIco(editingTOS.id);
    }
    setModalVisible(false);
    setEditingTOS(initTypeOfSkis());
    setImageChanged(false);
    setTosImage(undefined);
    loadData();
    setName("");
    inputRef.current?.blur();
    webDavSync();
  }

  //                                           ######                                   
  // #    #   ##   #    # #####  #      ###### #     # ###### #      ###### ##### ######
  // #    #  #  #  ##   # #    # #      #      #     # #      #      #        #   #     
  // ###### #    # # #  # #    # #      #####  #     # #####  #      #####    #   ##### 
  // #    # ###### #  # # #    # #      #      #     # #      #      #        #   #     
  // #    # #    # #   ## #    # #      #      #     # #      #      #        #   #     
  // #    # #    # #    # #####  ###### ###### ######  ###### ###### ######   #   ######
  function handleDelete(tos: TOS) {
    Alert.alert(
      tos.itemCount > 0 ? t('archive') : t('delete'),
      tos.itemCount > 0 ? t('archive_tos') : t('del_tos'),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('ok'),
          onPress: async () => {
            await deleteTypeOfSkis(db, tos.id);
            loadData();
            webDavSync();
          },
        }
      ]
    );
  }

  //                                              #                                
  //  ####    ##   #    #  ####  ###### #        # #    ####  ##### #  ####  #    #
  // #    #  #  #  ##   # #    # #      #       #   #  #    #   #   # #    # ##   #
  // #      #    # # #  # #      #####  #      #     # #        #   # #    # # #  #
  // #      ###### #  # # #      #      #      ####### #        #   # #    # #  # #
  // #    # #    # #   ## #    # #      #      #     # #    #   #   # #    # #   ##
  //  ####  #    # #    #  ####  ###### ###### #     #  ####    #   #  ####  #    #
  function cancelAction() {
    setModalVisible(false);
    setEditingTOS(initTypeOfSkis());
    setName("");
    setImageChanged(false);
    setTosImage(undefined);
    inputRef.current?.blur();
  }

  // Ouvre le sélecteur d'image, croppe en carré et redimensionne à 256x256
  async function pickImage() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const img = result.assets[0];
      // Redimensionne à 256x256
      const manipulator = ImageManipulator.manipulate(img.uri).resize({ width: 256, height: 256 });
      const manipResult = await (await manipulator.renderAsync()).saveAsync();
      setTosImage(manipResult.uri);
      setImageChanged(true);
    }
  }
  //                                           ###                    
  // #####  ###### #    # #####  ###### #####   #  ##### ###### #    #
  // #    # #      ##   # #    # #      #    #  #    #   #      ##  ##
  // #    # #####  # #  # #    # #####  #    #  #    #   #####  # ## #
  // #####  #      #  # # #    # #      #####   #    #   #      #    #
  // #   #  #      #   ## #    # #      #   #   #    #   #      #    #
  // #    # ###### #    # #####  ###### #    # ###   #   ###### #    #
  function renderItem({ item }: { item: TOS }) {
    const nbActions = item.itemCount || 0;

    return (
      <RowItem
        isActive={item.id === editingTOS.id}
        onSelect={() => {
          if (item.id === editingTOS.id) {
            setEditingTOS(initTypeOfSkis());
          } else {
            setEditingTOS(item);
          }
        }}
        onEdit={() => openEditModal(item)}
        onDelete={() => handleDelete(item)}
        deleteMode={nbActions > 0 ? "archive" : "delete"}
      >
        <Row >
          {item.icoUri ? (
            <Image source={{ uri: item.icoUri }}
              style={{ width: iconSize, height: iconSize, marginRight: 8, borderRadius: 8 }} />
          ) : <Pastille name={item.name} size={iconSize} />}
          <Text style={[appStyles.title, { flex: 1 }]}>
            {item.name}{item.itemCount > 0 && <Text style={[appStyles.text, { color: colorsTheme.inactiveText }]}> ({item.itemCount.toString()})</Text>}
          </Text>
          {item.sharpNeed ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <AppIcon name="affuteuse" color={colorsTheme.primary} styles={{ fontSize: 20, marginRight: 2 }} />
              <Text style={[appStyles.text, { color: colorsTheme.inactiveText, fontSize: 18 }]}>{item.sharpNeed}</Text>
            </View>
          ) : null}
          {item.waxNeed ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <AppIcon name="fartage" color={colorsTheme.primary} styles={{ fontSize: 20, marginRight: 2 }} />
              <Text style={[appStyles.text, { color: colorsTheme.inactiveText, fontSize: 18 }]}>{item.waxNeed}</Text>
            </View>
          ) : null}
        </Row>
      </RowItem>
    )
  }


  // #####  ###### ##### #    # #####  #    #
  // #    # #        #   #    # #    # ##   #
  // #    # #####    #   #    # #    # # #  #
  // #####  #        #   #    # #####  #  # #
  // #   #  #        #   #    # #   #  #   ##
  // #    # ######   #    ####  #    # #    #
  return (
    <Body>
      <Text style={[appStyles.title, { marginVertical: 8 }]}>
        {t("menu_tos")}
      </Text>
      <Tile flex={1}>
        <FlatList
          data={types}
          onRefresh={loadData}
          refreshing={false}
          keyExtractor={t => t.id}
          renderItem={({ item }) => renderItem({ item })}
        />
      </Tile>
      <AddButton onPress={openAddModal} disabled={false} />
      {
        // #     #                             #######                             
        // ##   ##  ####  #####    ##   #      #       #####  # #####  ####  ##### 
        // # # # # #    # #    #  #  #  #      #       #    # #   #   #    # #    #
        // #  #  # #    # #    # #    # #      #####   #    # #   #   #    # #    #
        // #     # #    # #    # ###### #      #       #    # #   #   #    # ##### 
        // #     # #    # #    # #    # #      #       #    # #   #   #    # #   # 
        // #     #  ####  #####  #    # ###### ####### #####  #   #    ####  #    #
      }
      <ModalEditor visible={modalVisible}>
        <Row>
          <Text style={[appStyles.title, { flex: 1, textAlign: 'center' }]}>
            {editingTOS.id !== "not-an-id" ? t("modify_tos") : t("add_tos")}
          </Text>
        </Row>

        <Row style={{ justifyContent: 'center', alignItems: 'center', marginVertical: 8 }}>
          <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center' }}>
            {tosImage || editingTOS?.icoUri ? (
              <Image source={{ uri: tosImage || editingTOS?.icoUri }}
                style={{ width: 64, height: 64, marginBottom: 8 }} />
            ) : (
              <Pastille name={editingTOS?.name || "?"} size={64} style={{ marginBottom: 8 }} />
            )}
            <Text style={{ color: colorsTheme.primary, fontSize: 12 }}>{t('choose_image')}</Text>
          </TouchableOpacity>
        </Row>
        {
          editingTOS.id.startsWith("init-") && editingTOS.icoUri?.startsWith("file://") && (
            <TouchableOpacity onPress={() => {
              setTosImage(getToSIcoURI(editingTOS.id, true));
              setImageChanged(true);
            }} style={{ alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: colorsTheme.primary, fontSize: 12 }}>{t('default_image')}</Text>
            </TouchableOpacity>
          )
        }
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
        <Row style={{ marginVertical: 8, alignItems: 'center', justifyContent: 'space-around' }}>
          {/* SharpNeed */}
          <Card borderColor={sharpNeed ? colorsTheme.primary : undefined}>

            <TouchableOpacity onPress={() => setSharpNeed(sharpNeed === 0 ? 1 : 0)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppIcon name="affuteuse" color={sharpNeed ? colorsTheme.text : colorsTheme.inactiveText} styles={{ fontSize: 32, marginRight: 4 }} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { if (sharpNeed !== 0) setSharpNeed(Math.max(1, sharpNeed - 1)) }}
              style={{ paddingHorizontal: 8 }}
              disabled={sharpNeed === 0}
            >
              <Text style={{ fontSize: 32, color: sharpNeed ? colorsTheme.primary : colorsTheme.inactiveText }}>-</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 28, color: sharpNeed ? colorsTheme.text : colorsTheme.inactiveText, minWidth: 24, textAlign: 'center' }}>{sharpNeed === 0 ? '' : sharpNeed}</Text>
            <TouchableOpacity
              onPress={() => { if (sharpNeed !== 0) setSharpNeed((sharpNeed || 1) + 1) }}
              style={{ paddingHorizontal: 8 }}
              disabled={sharpNeed === 0}
            >
              <Text style={{ fontSize: 32, color: sharpNeed ? colorsTheme.primary : colorsTheme.inactiveText }}>+</Text>
            </TouchableOpacity>
          </Card>

          {/* WaxNeed */}
          <Card borderColor={waxNeed ? colorsTheme.primary : undefined}>
            <TouchableOpacity onPress={() => setWaxNeed(waxNeed === 0 ? 1 : 0)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppIcon name="fartage" color={waxNeed ? colorsTheme.text : colorsTheme.inactiveText} styles={{ fontSize: 32, marginRight: 4 }} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { if (waxNeed !== 0) setWaxNeed(Math.max(1, waxNeed - 1)) }}
              style={{ paddingHorizontal: 8 }}
              disabled={waxNeed === 0}
            >
              <Text style={{ fontSize: 32, color: waxNeed ? colorsTheme.primary : colorsTheme.inactiveText }}>-</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 28, color: waxNeed ? colorsTheme.text : colorsTheme.inactiveText, minWidth: 24, textAlign: 'center' }}>{waxNeed === 0 ? '' : waxNeed}</Text>
            <TouchableOpacity
              onPress={() => { if (waxNeed !== 0) setWaxNeed((waxNeed || 1) + 1) }}
              style={{ paddingHorizontal: 8 }}
              disabled={waxNeed === 0}
            >
              <Text style={{ fontSize: 32, color: waxNeed ? colorsTheme.primary : colorsTheme.inactiveText }}>+</Text>
            </TouchableOpacity>
          </Card>
        </Row>
        <Row style={{ marginTop: 8, gap: 16, justifyContent: 'space-between' }}>
          <AppButton
            onPress={saveAction}
            color={name.trim() ? colorsTheme.activeButton : colorsTheme.inactiveButton}
            flex={true}
            caption={editingTOS.id === "not-an-id" ? t('add') : t('modify')}
            disabled={!name.trim()}
          />
          <AppButton onPress={cancelAction} color={colorsTheme.transparentGray} flex={true} style={{ flex: 1 }} caption={t('cancel')} />
        </Row>
      </ModalEditor>
    </Body>
  );
}