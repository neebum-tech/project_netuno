import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Treino',
          tabBarIcon: ({ color }) => (
            <Image 
              source={require('@/assets/icons/dumbbellFill.png')} 
              style={{ width: 28, height: 28, tintColor: color }} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="workout-control"
        options={{
          title: 'Controle Trienos',
          tabBarIcon: ({ color }) => (
            <Image 
              source={require('@/assets/icons/checklist.png')} 
              style={{ width: 28, height: 28, tintColor: color }} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
