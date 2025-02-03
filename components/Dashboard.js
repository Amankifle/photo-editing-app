import React, { useContext, useEffect } from 'react';
import { createStackNavigator } from "@react-navigation/stack";
import { AuthContext } from './AuthContext';
import auth from '@react-native-firebase/auth';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, launchCamera } from "react-native-image-picker";

const tools = [
  { id: 1, name: 'Photo editor', icon: 'image' },
  { id: 2, name: 'AutoCut', icon: 'cut' },
  { id: 3, name: 'Product photos', icon: 'camera' },
  { id: 4, name: 'AI poster', icon: 'star' },
  { id: 5, name: 'Expand', icon: 'chevron-down' },
];

const Stack = createStackNavigator();

export default function Dashboard({ navigation }) {
  const { isLoggedIn } = useContext(AuthContext);
  const { logout } = useContext(AuthContext);

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

  const signOut = async () => {
/*      await auth().signOut();
    logout();  */
    navigation.navigate('ProfileScreen');
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.header}>
          <TouchableOpacity>
            {isLoggedIn ? (
              <Text style={{ color: 'black' }} onPress={() => signOut()}>
                Logout
              </Text>
            ) : (
              <Ionicons
                name="person-outline"
                size={24}
                color="black"
                onPress={() => navigation.navigate('Login')}
              />
            )}
          </TouchableOpacity>
          <View>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="notifications-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      ),
    });
  }, [isLoggedIn, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

<View style={styles.toolsContainer}>
        {tools.map((tool) => (
          <TouchableOpacity key={tool.id} style={styles.toolItem}>
            <View style={styles.toolIcon}>
              <Ionicons name={tool.icon} size={24} color="black" />
            </View>
            <Text style={styles.toolText}>{tool.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

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

      <View style={styles.emptyState}>
        <View style={styles.emptyStateIcon}>
          <Ionicons name="play" size={24} color="gray" />
          <Ionicons name="cut" size={24} color="gray" />
        </View>
        <Text style={styles.emptyStateText}>Your projects will appear here.</Text>
        <Text style={styles.emptyStateSubtext}>Start creating now.</Text>
      </View>
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
  },
  headerIcon: {
    marginLeft: 20,
  },
  toolsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 25,
  },
  toolItem: {
    alignItems: 'center',
    width: 70,
  },
  toolIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolText: {
    fontSize: 12,
    textAlign: 'center',
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
});
