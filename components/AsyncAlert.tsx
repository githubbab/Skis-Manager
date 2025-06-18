import { Alert as NativeAlert } from 'react-native';

const defaultButtons = (resolve: any) => [
  {
    text: 'OK',
    onPress: () => {
      resolve();
    },
  },
];

const AsyncAlert = (title: string, msg: string, getButtons = defaultButtons) =>
  new Promise((resolve) => {
    NativeAlert.alert(title, msg, getButtons(resolve), { cancelable: false });
  });

export default AsyncAlert;