import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from "react-native";
import { Canvas, Image, useImage, useCanvasRef } from "@shopify/react-native-skia";
import RNFS from "react-native-fs";
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ImageFlip ({ route, navigation }) {
  const { imageUri } = route.params;
  const { imageHistory } = route.params;
  const { currentIndex } = route.params;
  
  const image = useImage(imageUri);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const canvasRef = useCanvasRef();
 
  const saveAndReturn = async () => {
    try {
      if (!canvasRef.current) {
        throw new Error("Canvas reference not available");
      }
  
      const imageSnapshot = await canvasRef.current.makeImageSnapshot();
      if (!imageSnapshot) {
        throw new Error("Failed to capture image snapshot");
      }
  
      const base64Image = await imageSnapshot.encodeToBase64();
      
      const filename = `${Date.now()}.jpg`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${filename}`;
  
      await RNFS.writeFile(filePath, base64Image, 'base64');
  
      const fileStats = await RNFS.stat(filePath);
  
      const imageMetadata = {
        cropRect: { x: 19, y: 19, width: 188, height: 188 },
        filename: filename,
        height: 1000, 
        width: 1000,
        mime: "image/jpeg",
        modificationDate: fileStats.mtime, 
        path: `file://${filePath}`,
        size: fileStats.size
      };
  
      navigation.replace('EditPhoto', { newImageUri: imageMetadata.path, imageHistory: imageHistory, currentIndex: currentIndex});
  
    } catch (error) {
      Alert.alert("Error", `Failed to save image: ${error.message}`);
      console.error("Save error:", error);
    }
  };

    if (!image) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading image...</Text>
        </View>
      );
    }

  return (
    <View style={styles.container}>
      <View style={styles.topButtons}>
        <TouchableOpacity onPress={saveAndReturn}>
          <Ionicons name="checkmark" size={27} color="white" />
        </TouchableOpacity>
      </View>
      
      <Canvas ref={canvasRef} style={styles.canvas}>
        <Image
          image={image}
          x={0}
          y={0}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT * 0.7}
          fit="contain"
          transform={[
            { translateX: -SCREEN_WIDTH/2 },
            { translateY: -SCREEN_HEIGHT * 0.35 },
            { scaleX: flipHorizontal ? -1 : 1 },
            { scaleY: flipVertical ? -1 : 1 },
            { translateX: SCREEN_WIDTH/2 },
            { translateY: SCREEN_HEIGHT * 0.35 },
          ]}
        />
      </Canvas>
      
      <View style={styles.controlContainer}>
        <TouchableOpacity onPress={() => setFlipHorizontal(!flipHorizontal)} style={styles.button}>
          <Ionicons name="swap-horizontal" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFlipVertical(!flipVertical)} style={styles.button}>
          <Ionicons name="swap-vertical" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'space-between',
  },
  topButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
  },
  canvas: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    alignSelf: 'center',
  },
  controlContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loadingText: {
    color: 'white',
  }
});