import { ReactNode, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import AppButton from "./AppButton";
import Row from "./Row";

const RowItem = ({
  children,
  onSelect,
  onEdit,
  onDelete,
  deleteMode = "delete",
  isActive,
  style,
}:
  {
    children: ReactNode;
    onSelect: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    deleteMode?: "archive" | "delete" | "restore";
    isActive: boolean;
    style?: any;
  }) => {


  return (
    <View>
      <TouchableOpacity onPress={onSelect} style={[{
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        paddingVertical: 4,
      }, style]}>
        {children}
        {isActive && (onEdit || onDelete) && (
          <Row style={{ marginHorizontal: 4 }}>
            {onEdit && (
              <AppButton onPress={onEdit} icon="pencil" color="#4CAF50" flex={1} textColor="#fff" />
            )}
            {onDelete ? (
              <AppButton
                onPress={onDelete}
                icon={deleteMode === "restore" ? "box-add" : deleteMode === "archive" ? "box-remove" : "bin"}
                color={deleteMode === "delete" ? "#f44336" : "#ff6a07ff"}
                flex={1}
                textColor="#fff"
              />
            ) :
              <AppButton
                onPress={() => { }}
                disabled={true}
                icon={"bin"}
                color={"#ccc"}
                flex={1}
                textColor="#fff"
              />
            }
          </Row>
        )}
      </TouchableOpacity>

    </View>
  );
}
export default RowItem;