import React from 'react';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import EditPhoto from './components/EditPhoto';
import Filter from './components/Filter';
import Effect from './components/Effect';
import Paint from './components/Paint';
import ProfileScreen from './components/ProfileScreen '
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { AuthProvider } from "./components/AuthContext";
import ProjectList from './components/ProjectList';
import ImageFlip from './components/ImageFlip';

const Stack = createStackNavigator();

export default function App() {
  return (
    <>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Dashboard">
            <Stack.Screen name="Dashboard" component={Dashboard} />
            <Stack.Screen name="Login" component={Home} />
            <Stack.Screen name="EditPhoto" component={EditPhoto} options={{ headerShown: false }}/>
            <Stack.Screen name="ImageFlip" component={ImageFlip} options={{ headerShown: false }}/>
            <Stack.Screen name="Filter" component={Filter} options={{ headerShown: false }}/>
            <Stack.Screen name="Effect" component={Effect} options={{ headerShown: false }}/>
            <Stack.Screen name="Paint" component={Paint} options={{ headerShown: false }}/>
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{title: 'Profile', headerTitleAlign: 'center' }} />
            <Stack.Screen name="ProjectList" component={ProjectList} options={{ headerShown: false }}/>   
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>    
    </>
  );
}
