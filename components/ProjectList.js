import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function ProjectList({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const getPhotoHistory = async () => {
    if (!auth().currentUser) return [];

    try {
      const snapshot = await firestore()
        .collection("photoHistory")
        .where("userId", "==", auth().currentUser.uid)
        .orderBy("timestamp", "desc")
        .get();

      const history = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          imageUrl: data.imageUrl,
          timestamp: data.timestamp ? data.timestamp.toDate() : null,
        };
      });

      return history;
    } catch (error) {
      console.error("Error fetching photo history:", error);
      return [];
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchHistory = async () => {
        setLoading(true);
        const history = await getPhotoHistory();
        setHistory(history);
        setLoading(false);
      };

      fetchHistory();
    }, [])
  );

  const handleProjectPress = (imageUri) => {
    navigation.navigate('EditPhoto', { imageUri });
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await firestore().collection("photoHistory").doc(projectId).delete();
      
      setHistory(history.filter(item => item.id !== projectId));
    } catch (error) {
      console.error("Error deleting project:", error);
      Alert.alert("Error", "Could not delete the project. Please try again.");
    }
  };

  const showDeleteConfirmation = (projectId) => {
    Alert.alert(
      "Delete Project",
      "Are you sure you want to delete this project?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => handleDeleteProject(projectId)
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : history.length > 0 ? (
        <View style={styles.projectContainer}>
          {history.map((item) => (
            <View 
              key={item.id} 
              style={styles.projectItem}
            >
              <TouchableOpacity 
                style={styles.projectContent}
                onPress={() => handleProjectPress(item.imageUrl)}
              >
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
                <View style={styles.projectItemInfo}>
                  <Text style={styles.projectName}>ID: {item.id.slice(-4)}</Text>
                  <Text style={styles.projectDate}>
                    {item.timestamp ? item.timestamp.toLocaleDateString() : 'No Date'}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => showDeleteConfirmation(item.id)}>
                <Ionicons name="trash" size={24} color="gray" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="play" size={24} color="gray" />
            <Ionicons name="cut" size={24} color="gray" />
          </View>
          <Text style={styles.emptyStateText}>Your projects will appear here.</Text>
          <Text style={styles.emptyStateSubtext}>Start creating now.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  projectContainer: {
    flex: 1,
    marginTop: 20,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  projectContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 50,
    height: 50,
    borderColor: 'grey',
    borderWidth: 1,
    borderRadius: 8,
  },
  projectItemInfo: {
    marginLeft: 20,
    flex: 1
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  projectDate: {
    fontSize: 14,
    color: '#666',
  },  
});
