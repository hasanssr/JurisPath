import React from 'react';
import { StatusBar, View, Text, StyleSheet, Platform, Animated, Dimensions, TouchableOpacity, Keyboard, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

// Theme
import { colors, typography, spacing, radius } from './src/theme';

// Auth
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AIScreen from './src/screens/AIScreen';
import PlansScreen from './src/screens/PlansScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Detail Screens
import LawDetailScreen from './src/screens/LawDetailScreen';

// Fonts
import { useFonts, AlexBrush_400Regular } from '@expo-google-fonts/alex-brush';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const { width: screenWidth } = Dimensions.get('window');

// ─── CUSTOM TAB BAR WITH BUBBLE SLIDE ANIMATION ───────────
function CustomTabBar({ state, descriptors, navigation }) {
  const totalWidth = screenWidth - 40;
  const tabWidth = totalWidth / 4;
  
  const translateX = React.useRef(new Animated.Value(0)).current;
  const [isKeyboardVisible, setKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const showSubscription = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true))
      : Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false))
      : Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [state.index]);

  if (isKeyboardVisible) {
    return null;
  }

  return (
    <View style={styles.tabBarContainer}>
      <View style={[styles.tabBarFloating, { width: totalWidth }]}>
        {/* Animated sliding bubble (black circle) */}
        <Animated.View 
          style={[
            styles.bubbleIndicator, 
            { 
              width: tabWidth - 20, 
              left: 10,
              transform: [{ translateX }] 
            }
          ]} 
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const icons = {
            DashboardTab: 'home',
            AITab: 'message-circle',
            PlansTab: 'credit-card',
            ProfileTab: 'user',
          };

          const iconName = icons[route.name] || 'grid';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.8}
            >
              <Feather 
                name={iconName} 
                size={22} 
                color={isFocused ? '#ffffff' : '#485c74'} 
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── TAB NAVIGATOR ─────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} />
      <Tab.Screen name="AITab" component={AIScreen} />
      <Tab.Screen name="PlansTab" component={PlansScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── NAVIGATION BASED ON AUTH STATE ─────────────────────
function RootNavigator() {
  const { user, loading } = useAuth();

  // Show loading while checking stored session
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0084FF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // ── Authenticated routes ──
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="LawDetail" component={LawDetailScreen} />
        </>
      ) : (
        // ── Unauthenticated routes ──
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

// ─── APP ROOT ───────────────────────────────────────────
export default function App() {
  const [fontsLoaded] = useFonts({
    'AlexBrush': AlexBrush_400Regular,
    'Montserrat-Bold': Montserrat_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 20,
    right: 20,
    height: 64,
    backgroundColor: 'transparent',
    alignItems: 'center',
    zIndex: 999,
  },
  tabBarFloating: {
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0a1628',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
    paddingHorizontal: 0,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleIndicator: {
    position: 'absolute',
    top: 7,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0a1629',
  }
});