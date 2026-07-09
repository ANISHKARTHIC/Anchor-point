import { SafeAreaView,View,Platform } from "react-native";

export const ViewComponent = Platform.OS === 'ios' ? SafeAreaView : View;