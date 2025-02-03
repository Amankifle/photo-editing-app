import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';
import { AuthContext } from './AuthContext'; 
import auth from '@react-native-firebase/auth';
import EditProfileModal from './EditProfileModal';

const ProfileScreen = ({ navigation }) => {
  const { email, logout } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  const API_KEY = "2b7569691217e68cdf957b6f66d634e1";

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth().currentUser;
        
        if (currentUser) {
          const userDoc = await firestore().collection('users').doc(currentUser.uid).get();

          if (userDoc.exists) {
            const userData = userDoc.data();
            setUserData(userData);
            setImageUri(userData.profileImage || null);

            const createdAt = userData.createdAt ? userData.createdAt.toDate() : null;
            const formattedDate = createdAt
              ? createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
              : 'Unknown Date';
            setDate(formattedDate);
          } else {
            console.log('User document not found');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Upload Image and Update Immediately
  const uploadToImgBB = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', includeBase64: true });

    if (result.didCancel || !result.assets || !result.assets[0].base64) {
      console.log("Image selection canceled or no base64 data found");
      return;
    }

    const imageBase64 = result.assets[0].base64;

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ image: imageBase64 }).toString(),
      });

      const data = await response.json();

      if (data.success) {
        const imageUrl = data.data.url;

        setImageUri(imageUrl);
        await storeImageURLInFirestore(imageUrl);
      } else {
        console.error("Upload failed:", data);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  // Store Uploaded Image URL in Firestore
  const storeImageURLInFirestore = async (imageUrl) => {
    const userId = auth().currentUser?.uid;
  
    if (!userId || !imageUrl) {
      console.log('User is not authenticated or image URL is missing');
      return;
    }

    try {
      await firestore().collection('users').doc(userId).update({
        profileImage: imageUrl,
      });

      console.log('Profile image URL stored in Firestore');
    } catch (error) {
      console.error('Error storing profile image in Firestore:', error);
    }
  };

  // Delete Profile Image
  const deleteProfileImage = async () => {
    const userId = auth().currentUser?.uid;

    if (!userId) {
      console.log('User not authenticated');
      return;
    }

    Alert.alert(
      "Delete Profile Picture",
      "Are you sure you want to remove your profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setImageUri(null);
              await firestore().collection('users').doc(userId).update({
                profileImage: null,
              });
              console.log("Profile image deleted from Firestore");
            } catch (error) {
              console.error("Error deleting profile image:", error);
            }
          },
        },
      ]
    );
  };

  const deleteAccount = async () => {
    const user = auth().currentUser;
  
    if (!user) {
      console.log("No user is currently logged in.");
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
              // 1. Delete user data from Firestore
              await firestore().collection('users').doc(user.uid).delete();
              console.log("User data deleted from Firestore.");
  
              // 2. Delete user from Firebase Authentication
              await user.delete();
              console.log("User deleted from Firebase Authentication.");
  
              // 3. Log out and navigate back
              logout();
              navigation.replace("Login"); // Redirect user to Login screen
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert("Error", "Failed to delete account. Please try again.");
            }
          },
        },
      ]
    );
  };
  

  const signOut = async () => {
    await auth().signOut();
    logout();
    navigation.goBack();
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#000" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <View style={styles.container}>
      <EditProfileModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        userData={userData} 
        onUpdate={(updatedData) => setUserData({ ...userData, ...updatedData })}
      />
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image 
            source={imageUri ? { uri: imageUri } : require('../Resource/Images/profile-user.jpg')} 
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
        <View style={styles.infoItem}>
          <Icon name="mail" size={20} color="#000" />
          <Text style={styles.infoText}>{userData?.email || 'N/A'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="call" size={20} color="#000" />
          <Text style={styles.infoText}>{userData?.phone || 'N/A'}</Text>
        </View>
      </View>

      {imageUri && (
      <View style={styles.section}>
          <TouchableOpacity style={styles.infoItem} onPress={deleteProfileImage}>
            <Icon name="trash" color="#000" size={20}/>
            <Text style={styles.infoText}>Remove Profile Picture</Text>
          </TouchableOpacity>
      </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.utilityItem} onPress={signOut}>
          <Icon name="log-out" size={20} color="#000" />
          <Text style={styles.infoText}>Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.utilityItem} onPress={deleteAccount}>
          <Icon name="trash" size={20}/>
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
