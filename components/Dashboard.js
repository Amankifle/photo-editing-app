import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from "@react-navigation/stack";
import { AuthContext } from './AuthContext';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, launchCamera } from "react-native-image-picker";
import ProjectList from './ProjectList';

const Stack = createStackNavigator();

export default function Dashboard({ navigation }) {
  const { isLoggedIn } = useContext(AuthContext);
  const { logout } = useContext(AuthContext);
  const [imageUri, setImageUri] = useState(null);

  const pickImage = () => {
    const options = {
      mediaType: "photo",
      quality: 1,
    };

    Alert.alert(
      'Select Image',
      'Choose from Gallery or Take a Photo',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Camera',
          onPress: () => {
            launchCamera(options, (response) => {
              handleImageResponse(response);
            });
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            launchImageLibrary(options, (response) => {
              handleImageResponse(response);
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleImageResponse = (response) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.errorMessage) {
      console.log('Error: ', response.errorMessage);
    } else if (response.assets && response.assets.length > 0) {
      const image = response.assets[0];
      navigation.navigate('EditPhoto', { imageUri: image.uri });
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          const currentUser = auth().currentUser;
          if (currentUser) {
            const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              setImageUri(userData.profileImage || null);
            } else {
              console.log('User document not found');
            }
          }
        } catch (error) {
          //console.error('Error fetching user data:', error);
        }
      };

      fetchUserData();
    }, [])
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen')}>
            {isLoggedIn ? (
              <Image 
                source={imageUri ? { uri: imageUri } : require('../Resource/Images/profile-user.jpg')} 
                style={styles.avatar} 
              />
            ) : (
              <Ionicons
                name="person-outline"
                size={24}
                color="black"
                onPress={() => navigation.navigate('Login')}
              />
            )}
          </TouchableOpacity>
        </View>
      ),
    });
  }, [isLoggedIn, navigation, imageUri]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <TouchableOpacity style={styles.newProjectButton} onPress={pickImage}>
        <Ionicons name="add" size={24} color="black" />
        <Text style={styles.newProjectText}>New project</Text>
      </TouchableOpacity>

      <View style={styles.projectsHeader}>
        <Text style={styles.projectsTitle}>Projects</Text>
        <TouchableOpacity>
          <Ionicons name="menu" size={24} color="black" />
        </TouchableOpacity>
      </View>
      {isLoggedIn?
      <ProjectList navigation={navigation}/>:
            <View style={styles.emptyState}>
        <Text style={styles.emptyStateSubtext}>Login to see history!</Text>
      </View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginRight: 10
  },
  newProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F7FF',
    padding: 16,
    borderRadius: 12,
    height: 100,
    marginVertical: 24,
    justifyContent: 'center'
  },
  newProjectText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  projectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  projectsTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyStateIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#666',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 50,
  },
});
