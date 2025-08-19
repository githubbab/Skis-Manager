import {View} from "react-native";

export default function Separator () {
  return (
    <View style={{
        height: 1,
        width: '80%',
        alignItems: 'center',
        marginHorizontal: 'auto',
        marginVertical: 8,
        backgroundColor: "#ccc",
      }} />
  );
}
