import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, Alert, BackHandler } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';
import RNFS from 'react-native-fs';
import { AuthContext } from './AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function EditPhoto({ route, navigation }) {
  const { imageUri: initialImageUri } = route.params;
  const [currentImage, setCurrentImage] = useState(initialImageUri);
  const [imageHistory, setImageHistory] = useState([initialImageUri]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (route.params?.newImageUri) {
        const newUri = route.params.newImageUri;
        setCurrentImage(newUri);
        const ImageHistory = route.params.imageHistory;
        setImageHistory(ImageHistory);
        const CurrentIndex = route.params.currentIndex;
        setCurrentIndex(CurrentIndex);
        
        setImageHistory(prev => [...prev.slice(0, currentIndex + 1), newUri]);
        setCurrentIndex(prev => prev + 1);
      }
    });

    return unsubscribe;
  }, [navigation, route.params?.newImageUri, currentIndex]);

  const handleUndo = () => {
    setCurrentIndex((prevIndex) => {
      const newIndex = Math.max(0, prevIndex - 1);
      setCurrentImage(imageHistory[newIndex]);
      return newIndex;
    });
  };
  useEffect(() => {
    const handleBackPress = () => {
      Alert.alert(
        "Exit Editing?",
        "Are you sure you want to leave? Unsaved changes may be lost.",
        [
          { text: "Yes",onPress: () => navigation.goBack() },
          { text: "Cancel", onPress: () => null },
          { text: "Save", onPress: () => navigation.goBack() }
        ]
      );
      return true;
    };
    BackHandler.addEventListener("hardwareBackPress", handleBackPress);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
    };
  }, []);
  const handleRedo = () => {
    setCurrentIndex((prevIndex) => {
      const newIndex = Math.min(imageHistory.length - 1, prevIndex + 1);
      setCurrentImage(imageHistory[newIndex]);
      return newIndex;
    });
  };

  const handleCrop = async () => {
    try {
      const croppedImage = await ImagePicker.openCropper({
        path: currentImage,
        compressImageQuality: 0.8,
      });
      navigation.setParams({ newImageUri: croppedImage.path });
      setCurrentImage(croppedImage.path);
      setImageHistory(prev => [...prev.slice(0, currentIndex + 1), croppedImage.path]);
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Crop error:', error);
      Alert.alert('Error', 'Failed to crop image');
    }
  };

  const handleDownload = async () => {
    try {
      const filename = `edited_${Date.now()}.jpg`;
      const destinationPath = `${RNFS.ExternalStorageDirectoryPath}/Download/${filename}`; 
      await RNFS.copyFile(currentImage, destinationPath);

      Alert.alert(
        'Success',
        'Image saved successfully!',
        [{ text: 'OK' }]
      );
      navigation.goBack();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save image');
    }
  };

  const handleSave = () =>{
    if(!isLoggedIn){
      Alert.alert('Please login to save image', 'Failed to save image');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.undoRedoContainer}>
          <TouchableOpacity 
            onPress={handleUndo} 
            disabled={currentIndex === 0}
            style={[styles.iconButton, currentIndex === 0 && styles.disabledButton]}
          >
            <Ionicons name="arrow-undo" size={24} color={currentIndex === 0 ? "#666" : "white"} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleRedo}
            disabled={currentIndex === imageHistory.length - 1}
            style={[styles.iconButton, currentIndex === imageHistory.length - 1 && styles.disabledButton]}
          >
            <Ionicons name="arrow-redo" size={24} color={currentIndex === imageHistory.length - 1 ? "#666" : "white"} />
          </TouchableOpacity>
        </View>
        <View style={{flexDirection: 'row'}}>
        <TouchableOpacity style={styles.SaveButton} onPress={handleSave}>
    <View style={styles.SaveButtonContent}>
      
      <Ionicons name="bookmark" size={18} color="white" style={styles.SaveButtonIcon} />
    </View>
  </TouchableOpacity>
  <TouchableOpacity style={styles.DownloadButton} onPress={handleDownload}>
    <View style={styles.SaveButtonContent}>
      
      <Ionicons name="cloud-download" size={18} color="white" style={styles.SaveButtonIcon} />
    </View>
  </TouchableOpacity>
        </View>
      </View>

      <Image
        source={{ uri: currentImage }}
        style={styles.image}
        resizeMode="contain"
      />

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.toolItem} onPress={handleCrop} activeOpacity={0.7}>
          <View style={styles.toolIcon}>
            <Ionicons name="crop" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolItem} activeOpacity={0.7}>
          <View style={styles.toolIcon}>
            <Ionicons name="ellipse" size={24} color="#333" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolItem}
          onPress={() => navigation.replace('Filter', { imageUri: currentImage,imageHistory: imageHistory,currentIndex: currentIndex})}
        >
          <Ionicons name="sunny" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolItem}
          onPress={() => navigation.replace('Effect', { imageUri: currentImage,imageHistory: imageHistory,currentIndex: currentIndex })}
        >
          <Ionicons name={"filter"} size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolItem}
          onPress={() => navigation.replace('Paint', { imageUri: currentImage,imageHistory: imageHistory,currentIndex: currentIndex })}
        >
          <Ionicons name={"color-palette"} size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 80,
    paddingHorizontal: 15,
  },
  undoRedoContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    marginTop: 30,
  },
  menuContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  menuItem: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#333',
    width: SCREEN_WIDTH * 0.4,
  },
  menuText: {
    color: '#fff',
    marginTop: 5,
    fontSize: 14,
  },
  toolText: {
    color: 'white'
  },
  SaveButton: {
    width: 100,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    flexDirection: 'row',
  },
  DownloadButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    flexDirection: 'row',
  },
  SaveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  SaveButtonText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginRight: 5,
  },
  SaveButtonIcon: {
    marginLeft: 5,
  },
});