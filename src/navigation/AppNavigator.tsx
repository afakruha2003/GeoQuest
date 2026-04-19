import React from 'react';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { colors } from '../theme';
import { Ionicons } from '@expo/vector-icons'; 

import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import QuizMenuScreen from '../screens/QuizMenuScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CountryDetailScreen from '../screens/CountryDetailScreen';
import QuizScreen from '../screens/QuizScreen';
import QuizResultScreen from '../screens/QuizResultScreen';
import LoginScreen from '../screens/LoginScreen';
import RegionQuizScreen from '../screens/RegionQuizScreen';
import ShapeQuizScreen from '../screens/Shapequizscreen';


type RootTabParamList = {
  HomeStack: undefined;
  ExploreStack: undefined;
  QuizStack: undefined;
  MapStack: undefined;
  ProfileStack: undefined;
};

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

type HomeStackParamList = {
  Home: undefined;
  CountryDetail: { code: string };
};

type ExploreStackParamList = {
  Explore: { region?: string } | undefined;
  CountryDetail: { code: string };
};

type QuizStackParamList = {
  QuizMenu: undefined;
  Quiz: {
    mode: 'flag' | 'capital' | 'guess';
    difficulty?: 'easy' | 'medium' | 'hard';
    region?: string;
    countryCode?: string;
    reviewWrong?: boolean;
  };
  QuizResult: { result: object; mode: string } | undefined;
  RegionQuiz: { quizType: 'region_color' | 'region_name'; questionCount?: number };
  ShapeQuiz: { questionCount?: number };
};

type MapStackParamList = {
  Map: undefined;
  ExploreFromMap: { region: string };
  CountryDetail: { code: string };
};

type ProfileStackParamList = {
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const ExploreStack = createStackNavigator<ExploreStackParamList>();
const QuizStack = createStackNavigator<QuizStackParamList>();
const MapStack = createStackNavigator<MapStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    primary: colors.primary,
    text: colors.text,
    border: colors.border,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator

      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.primary,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        
    
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'HomeStack') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ExploreStack') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'QuizStack') {
            iconName = focused ? 'game-controller' : 'game-controller-outline';
          } else if (route.name === 'MapStack') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'ProfileStack') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Ana Sayfa" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ExploreStack"
        component={ExploreStackNavigator}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Keşfet" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="QuizStack"
        component={QuizStackNavigator}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Quiz" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MapStack"
        component={MapStackNavigator}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="İlerleme" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileStack"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Profil" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}


function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background, elevation: 0, shadowOpacity: 0 },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: 16, fontWeight: '600' },
      }}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="CountryDetail" component={CountryDetailScreen} options={{ title: 'Ülke Detayı' }} />
    </HomeStack.Navigator>
  );
}

function ExploreStackNavigator() {
  return (
    <ExploreStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background, elevation: 0, shadowOpacity: 0 },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: 16, fontWeight: '600' },
      }}
    >
      <ExploreStack.Screen name="Explore" component={ExploreScreen} options={{ headerShown: false }} />
      <ExploreStack.Screen name="CountryDetail" component={CountryDetailScreen} options={{ title: 'Ülke Detayı' }} />
    </ExploreStack.Navigator>
  );
}

function QuizStackNavigator() {
  return (
    <QuizStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background, elevation: 0, shadowOpacity: 0 },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: 16, fontWeight: '600' },
      }}
    >
      <QuizStack.Screen name="QuizMenu" component={QuizMenuScreen} options={{ headerShown: false }} />
      <QuizStack.Screen name="Quiz" component={QuizScreen} options={{ title: 'Quiz' }} />
      <QuizStack.Screen name="QuizResult" component={QuizResultScreen} options={{ title: 'Quiz Sonucu' }} />
      <QuizStack.Screen name="RegionQuiz" component={RegionQuizScreen} options={{ title: 'Kıta Quizi' }} />
      <QuizStack.Screen name="ShapeQuiz" component={ShapeQuizScreen} options={{ title: 'Ülkeyi Bul' }} />
    </QuizStack.Navigator>
  );
}

function MapStackNavigator() {
  return (
    <MapStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background, elevation: 0, shadowOpacity: 0 },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: 16, fontWeight: '600' },
      }}
    >
      <MapStack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
      <MapStack.Screen name="ExploreFromMap" component={ExploreScreen} options={{ title: 'Ülkeleri Keşfet' }} />
      <MapStack.Screen name="CountryDetail" component={CountryDetailScreen} options={{ title: 'Ülke Detayı' }} />
    </MapStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background, elevation: 0, shadowOpacity: 0 },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: 16, fontWeight: '600' },
      }}
    >
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </ProfileStack.Navigator>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[styles.tabLabel, { color: focused ? colors.primary : colors.textSecondary }]}>
      {label}
    </Text>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Auth" component={LoginScreen} />
        <RootStack.Screen name="Main" component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 12,
  },
});