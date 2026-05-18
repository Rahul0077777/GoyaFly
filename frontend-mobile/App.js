import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { NativeWindStyleSheet } from "nativewind";

import { ThemeProvider } from './src/context/ThemeContext';
import Toast from 'react-native-toast-message';

NativeWindStyleSheet.setOutput({
  default: "native",
});

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style="auto" />
        <Toast />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
