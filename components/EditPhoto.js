import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, Alert, BackHandler, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';
import RNFS from 'react-native-fs';
import { AuthContext } from './AuthContext';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const API_KEY = "2b7569691217e68cdf957b6f66d634e1";

export default function EditPhoto({ route, navigation}) {
  const { imageUri: initialImageUri } = route.params;
  const { imageId: IMAGE_ID } = route.params;
  const [currentImage, setCurrentImage] = useState(initialImageUri);
  const [imageHistory, setImageHistory] = useState([initialImageUri]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isLoggedIn } = useContext(AuthContext);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [id, setId] = useState(IMAGE_ID);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (route.params?.newImageUri) {
        const newUri = route.params.newImageUri;
        const prevHistory = route.params.imageHistory || imageHistory;
        const prevIndex = route.params.currentIndex || currentIndex;
        const id = route.params.ImageId;
        
        const newHistory = [...prevHistory.slice(0, prevIndex + 1), newUri];
        
        setId(id)
        setCurrentImage(newUri);
        setImageHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
      }
    });

    return unsubscribe;
  }, [navigation, route.params?.newImageUri]);

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

  const handleCrop = async () => {
    try {
      const croppedImage = await ImagePicker.openCropper({
        path: currentImage,
        compressImageQuality: 0.8,
      });
      
      const newHistory = [...imageHistory.slice(0, currentIndex + 1), croppedImage.path];
      setCurrentImage(croppedImage.path);
      setImageHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);
      
      navigation.setParams({ 
        newImageUri: croppedImage.path,
        imageHistory: newHistory,
        currentIndex: newHistory.length - 1
      });
    } catch (error) {
      console.error('Crop error:', error);
      Alert.alert('Error', 'Failed to crop image');
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setCurrentImage(imageHistory[newIndex]);
    }
  };

  const handleRedo = () => {
    if (currentIndex < imageHistory.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCurrentImage(imageHistory[newIndex]);
    }
  };

  const handleDownload = async () => {
    try {
      const filename = `edited_${Date.now()}.jpg`;
      const destinationPath = `${RNFS.ExternalStorageDirectoryPath}/Download/${filename}`; 
      await RNFS.copyFile(currentImage, destinationPath);

      Alert.alert(
        'Success',
        'Image Downloaded successfully!',
        [{ text: 'OK' }]
      );
      navigation.goBack();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save image');
    }
  };

  const uploadToImgBB = async () => {
    setIsUploading(true);
    setUploadProgress('Preparing image...');
    try {
      
      setUploadProgress('Converting image...');
      const imageBase64 = await RNFS.readFile(currentImage, 'base64');
      
      setUploadProgress('Uploading to server...');
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ image: imageBase64 }).toString(),
      });

      const data = await response.json();

      if (data.success) {
        setUploadProgress('Saving to your account...');
        const imageUrl = data.data.url;
        await addPhotoToHistory(imageUrl);
        Alert.alert(
          "Success", 
          "Image has been saved.",
          [{ 
            text: 'OK',
            onPress: () => navigation.goBack()
          }]
        );
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      Alert.alert(
        "Upload Failed", 
        "Could not upload the image. Please check your internet connection and try again."
      );
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const addPhotoToHistory = async (imageUrl) => {
    if (!auth().currentUser) return;
    
    try {
      if (id == 0){
        const timestamp = new Date();
        firestore().collection("photoHistory").add({
          userId: auth().currentUser.uid,
          imageUrl,
          timestamp: timestamp
        });
      }else{
        await firestore().collection("photoHistory").doc(id).update({
          imageUrl,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error("Error saving to Firestore:", error);
    }
  }; 

  const handleSave = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        "Login Required", 
        "You must be logged in to save images. Would you like to log in now?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    if (isSaving) return; 
    setIsSaving(true);
    await uploadToImgBB();
    setIsSaving(false);
  };

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
        <TouchableOpacity style={[styles.SaveButton, currentIndex === 0 && styles.disabledButton]} onPress={handleSave} disabled={currentIndex === 0} >
    <View style={styles.SaveButtonContent}>
      
    {isUploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons 
                  name="bookmark" 
                  size={18} 
                  color={currentIndex === 0 ? "#666" : "white"} 
                  style={styles.SaveButtonIcon} 
                />
              )}
    </View>
  </TouchableOpacity>
  <TouchableOpacity style={styles.DownloadButton} onPress={handleDownload} disabled={currentIndex === 0}>
    <View style={styles.SaveButtonContent}>
      
      <Ionicons name="cloud-download" size={18} color="white" style={[styles.SaveButtonIcon, currentIndex === 0 && styles.disabledButton]} />
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

        <TouchableOpacity style={styles.toolItem} onPress={() => navigation.replace('ImageFlip', { imageUri: currentImage,imageHistory: imageHistory,currentIndex: currentIndex, ImageId: IMAGE_ID})}>
          <View style={styles.toolIcon}>
            <Ionicons name="swap-horizontal" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolItem}
          onPress={() => navigation.replace('Filter', { imageUri: currentImage,imageHistory: imageHistory,currentIndex: currentIndex, ImageId: IMAGE_ID})}
        >
          <Ionicons name="sunny" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolItem}
          onPress={() => navigation.replace('Effect', { imageUri: currentImage,imageHistory: imageHistory,currentIndex: currentIndex, ImageId: IMAGE_ID })}
        >
          <Ionicons name={"filter"} size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolItem}
          onPress={() => navigation.replace('Paint', { imageUri: currentImage,imageHistory: imageHistory,currentIndex: currentIndex, ImageId: IMAGE_ID })}
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