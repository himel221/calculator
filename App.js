// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import { createTables, initializeDefaultData } from './src/database/Database';

const Stack = createStackNavigator();

const App = () => {
  useEffect(() => {
    // ডেটাবেস টেবিল তৈরি করুন
    createTables();
    
    // ডিফল্ট ডাটা যোগ করুন
    setTimeout(() => {
      initializeDefaultData();
    }, 500);
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;