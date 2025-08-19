import { ThemeContext } from "@/context/ThemeContext";
import { ReactNode, useContext } from "react";
import { Modal, StyleSheet, View } from "react-native";

export default function ModalEditor({ children, visible, center, onRequestClose }: { children: ReactNode; visible: boolean; center?: boolean; onRequestClose?: () => void; }) {
    const { colorsTheme } = useContext(ThemeContext);
    const modalStyle = StyleSheet.create({
        modalOverlay: {
            flex: 1,
            backgroundColor: colorsTheme.modalTransparent,
            alignItems: "center",
            paddingVertical: "5%",
            justifyContent: center ? "center" : "flex-start",
        },
        modalContent: {
            backgroundColor: colorsTheme.modalBackground,
            borderRadius: 8,
            padding: 16,
            width: "95%"
        },
    });
    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onRequestClose}>
            <View style={modalStyle.modalOverlay}>
                <View style={modalStyle.modalContent}>
                    {children}
                </View>
            </View>
        </Modal>
    );
}
