import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import { AuthContext } from './AuthContext'; 
import Profileimage from '../Resource/Images/FrontPageImage.jpg';
import auth from '@react-native-firebase/auth';

const ProfileScreen = () => {
  const { email } = useContext(AuthContext); 
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth().currentUser;
        if (currentUser) {
          const userDoc = await firestore()
            .collection('users')
            .doc(currentUser.uid)
            .get();

          if (userDoc.exists) {
            setUserData(userDoc.data());
            const userData = userDoc.data();
            const createdAt = userData.createdAt ? userData.createdAt.toDate() : null;
            const formattedDate = createdAt
                ? createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : 'Unknown Date';
            setDate(formattedDate)
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

  if (loading) {
    return <ActivityIndicator size="large" color="#000" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image source={Profileimage} style={styles.avatar} />
          <TouchableOpacity style={styles.cameraIcon}>
            <Icon name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{userData?.name || 'N/A'}</Text>
        <Text style={styles.activeSince}>Active since - {date}</Text>
      </View>

      {/* Personal Info Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          <TouchableOpacity>
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
        <View style={styles.infoItem}>
          <Icon name="location" size={20} color="#000" />
          <Text style={styles.infoText}>{userData?.location || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.utilityItem}>
          <Icon name="help-circle" size={20} color="#000" />
          <Text style={styles.infoText}>Help</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.utilityItem}>
          <Icon name="log-out" size={20} color="#000" />
          <Text style={styles.infoText}>Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.utilityItem}>
          <Icon name="trash-outline" size={20} color="#000" />
          <Text style={[styles.infoText,{color:'red'}]}>Delete Account</Text>
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
  subtitle: {
    fontSize: 14,
    color: 'gray',
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
