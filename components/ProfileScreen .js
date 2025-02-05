import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';
import { AuthContext } from './AuthContext';
import auth from '@react-native-firebase/auth';
import EditProfileModal from './EditProfileModal';

// Separate component for info items
const InfoItem = ({ iconName, text }) => (
  <View style={styles.infoItem}>
    <Icon name={iconName} size={20} color="#000" />
    <Text style={styles.infoText}>{text || 'N/A'}</Text>
  </View>
);

// Constants
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || "2b7569691217e68cdf957b6f66d634e1";
const DEFAULT_PROFILE_IMAGE = require('../Resource/Images/profile-user.jpg');

const ProfileScreen = ({ navigation }) => {
  const { email, logout } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [userId, setUserId] = useState(auth().currentUser?.uid || null);

  // Fetch user data
  const fetchUserData = useCallback(async (uid) => {
    if (!uid) return;

    setLoading(true); 
    try {
      const userDoc = await firestore().collection('users').doc(uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        setUserData(data);
        setImageUri(data.profileImage || null);
        
        const createdAt = data.createdAt?.toDate();
        setDate(createdAt?.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) || 'Unknown Date');
      } else {
        setUserData(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
        fetchUserData(user.uid);
      } else {
        setUserData(null);
        setImageUri(null);
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [fetchUserData]);

  // Image handling functions
  const uploadToImgBB = useCallback(async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', includeBase64: true });
      if (result.didCancel || !result.assets?.[0]?.base64) return;

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ image: result.assets[0].base64 }).toString(),
      });

      const data = await response.json();
      if (!data.success) throw new Error('Upload failed');

      const imageUrl = data.data.url;
      setImageUri(imageUrl);
      await storeImageURLInFirestore(imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  }, []);

  const storeImageURLInFirestore = async (imageUrl) => {
    const userId = auth().currentUser?.uid;
    if (!userId || !imageUrl) return;

    try {
      await firestore().collection('users').doc(userId).update({ profileImage: imageUrl });
    } catch (error) {
      //console.error('Error storing profile image:', error);
      Alert.alert('Error', 'Failed to save profile image. Please try again.');
    }
  };

  // Action handlers
  const handleDeleteProfileImage = useCallback(() => {
    Alert.alert(
      "Delete Profile Picture",
      "Are you sure you want to remove your profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const userId = auth().currentUser?.uid;
              if (!userId) return;

              setImageUri(null);
              await firestore().collection('users').doc(userId).update({ profileImage: null });
            } catch (error) {
              //console.error("Error deleting profile image:", error);
              Alert.alert('Error', 'Failed to delete profile image. Please try again.');
            }
          },
        },
      ]
    );
  }, []);

  const handleDeleteAccount = useCallback(() => {
    
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) return;

      const snapshot = firestore()
        .collection('photoHistory')
        .where('userId', '==', userId)
        .get();

      const batch = firestore().batch();
      snapshot.forEach((doc) => batch.delete(doc.ref));
      batch.commit();

    } catch (error) {
      Alert.alert('Error', 'Failed to clear photo history. Please try again.');
      return;
    }
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const user = auth().currentUser;
              if (!user) return;

              await firestore().collection('users').doc(user.uid).delete();
              await user.delete();
              logout();
              navigation.replace("Login");
            } catch (error) {
              //console.error("Error deleting account:", error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  }, [logout, navigation]);

  const handleClearPhotoHistory = useCallback(() => {
    Alert.alert(
      "Clear Photo History", 
      "Are you sure you want to permanently delete all projects? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const userId = auth().currentUser?.uid;
              if (!userId) return;
  
              const snapshot = await firestore()
                .collection('photoHistory')
                .where('userId', '==', userId)
                .get();
  
              const batch = firestore().batch();
              snapshot.forEach((doc) => batch.delete(doc.ref));
              await batch.commit();
  
              await fetchUserData();
              Alert.alert('Success', 'Photo history has been cleared successfully.');
            } catch (error) {
              //console.error("Error clearing photo history:", error);
              Alert.alert('Error', 'Failed to clear photo history. Please try again.');
            }
          },
        },
      ]
    );
  }, [fetchUserData]);
  

  const handleSignOut = useCallback(async () => {
    try {
      await auth().signOut();
      logout();
      navigation.goBack();
    } catch (error) {
      //console.error("Error signing out:", error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  }, [logout, navigation]);

  if (loading) {
    return <ActivityIndicator size="large" color="#000" style={styles.loading} />;
  }

  return (
    <View style={styles.container}>
      <EditProfileModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        userData={userData}
        onUpdate={(updatedData) => setUserData(prev => ({ ...prev, ...updatedData }))}
      />

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image 
            source={imageUri ? { uri: imageUri } : DEFAULT_PROFILE_IMAGE}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.cameraIcon} onPress={uploadToImgBB}>
            <Icon name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{userData?.name || 'N/A'}</Text>
        <Text style={styles.activeSince}>Active since - {date}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <InfoItem iconName="mail" text={userData?.email} />
        <InfoItem iconName="call" text={userData?.phone} />
      </View>

      {imageUri && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.infoItem} onPress={handleDeleteProfileImage}>
            <Icon name="trash" color="#000" size={20} />
            <Text style={styles.infoText}>Remove Profile Picture</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.utilityItem} onPress={handleClearPhotoHistory}>
          <Icon name="trash-outline" size={20} color="#000" />
          <Text style={styles.infoText}>Clear project history</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.utilityItem} onPress={handleSignOut}>
          <Icon name="log-out" size={20} color="#000" />
          <Text style={styles.infoText}>Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.utilityItem} onPress={handleDeleteAccount}>
          <Icon name="trash" size={20} color="#000" />
          <Text style={styles.infoText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#FFA500',
    borderRadius: 15,
    padding: 5,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  activeSince: {
    fontSize: 12,
    color: 'gray',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editText: {
    fontSize: 14,
    color: '#007BFF',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
  },
  utilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
});

export default ProfileScreen;
