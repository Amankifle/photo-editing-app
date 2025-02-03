import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const loadLoginState = async () => {
      try {
        const storedLoginState = await AsyncStorage.getItem("isLoggedIn");
        if (storedLoginState !== null) {
          setIsLoggedIn(JSON.parse(storedLoginState));
        }
      } catch (error) {
        console.error("Error loading login state from AsyncStorage", error);
      }
    };
    loadLoginState();
  }, []);
  useEffect(() => {
    const loadEmailState = async () => {
      try {
        const storedEmailState = await AsyncStorage.getItem("email");
        if (storedEmailState !== null) {
          setEmail(JSON.parse(storedEmailState));
        }
      } catch (error) {
        console.error("Error loading email state from AsyncStorage", error);
      }
    };
    loadEmailState();
  }, []);

  const SetEmail = async (email) => {
    setEmail(email);
    try {
      await AsyncStorage.setItem("email", JSON.stringify(email));
    } catch (error) {
      console.error("Error storing login state in AsyncStorage", error);
    }
  };

  const login = async () => {
    setIsLoggedIn(true);
    try {
      await AsyncStorage.setItem("isLoggedIn", JSON.stringify(true));
    } catch (error) {
      console.error("Error storing login state in AsyncStorage", error);
    }
  };

  const logout = async () => {
    setIsLoggedIn(false);
    try {
      await AsyncStorage.setItem("isLoggedIn", JSON.stringify(false));
    } catch (error) {
      console.error("Error storing logout state in AsyncStorage", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, email, login, logout,SetEmail }}>
      {children}
    </AuthContext.Provider>
  );
};
