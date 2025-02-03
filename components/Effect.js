import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from "react-native";
import { Canvas, Image, useImage, ColorMatrix, useCanvasRef } from "@shopify/react-native-skia";
import RNFS from "react-native-fs";
import Ionicons from 'react-native-vector-icons/Ionicons';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function Effect({ route, navigation }) {
  const { imageUri } = route.params;
  const { imageHistory } = route.params;
  const { currentIndex } = route.params;
  const image = useImage(imageUri);
  const [selectedEffect, setSelectedEffect] = useState("Default");
  const canvasRef = useCanvasRef();


  const defaultMatrix = () => [
    1, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, 1, 0,
  ].map(Number);

  const grayscaleMatrix = () => [
    0.2126, 0.7152, 0.0722, 0, 0,
    0.2126, 0.7152, 0.0722, 0, 0,
    0.2126, 0.7152, 0.0722, 0, 0,
    0, 0, 0, 1, 0,
  ].map(Number);

  const sepiaMatrix = () => [
    0.393, 0.769, 0.189, 0, 0,
    0.349, 0.686, 0.168, 0, 0,
    0.272, 0.534, 0.131, 0, 0,
    0, 0, 0, 1, 0,
  ].map(Number);

  const invertMatrix = () => [
    -1, 0, 0, 0, 1,
    0, -1, 0, 0, 1,
    0, 0, -1, 0, 1,
    0, 0, 0, 1, 0,
  ].map(Number);

  const hueRotationMatrix = (angle) => {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return [
      0.213 + cosA * 0.787 - sinA * 0.213, 0.213 - cosA * 0.213 + sinA * 0.143, 0.213 - cosA * 0.213 - sinA * 0.787, 0, 0,
      0.715 - cosA * 0.715 - sinA * 0.715, 0.715 + cosA * 0.285 + sinA * 0.140, 0.715 - cosA * 0.715 + sinA * 0.140, 0, 0,
      0.072 - cosA * 0.072 + sinA * 0.928, 0.072 - cosA * 0.072 - sinA * 0.928, 0.072 + cosA * 0.928 + sinA * 0.072, 0, 0,
      0, 0, 0, 1, 0,
    ].map(Number);
  };

  const vibranceMatrix = (value) => {
    const adjustment = value * 0.5;
    return [
      1 + adjustment, 0, 0, 0, 0,
      0, 1 + adjustment, 0, 0, 0,
      0, 0, 1 + adjustment, 0, 0,
      0, 0, 0, 1, 0,
    ].map(Number);
  };

  const embossMatrix = () => [
    1, 1, 1, 0, 0,
    1, 0.7, -1, 0, 0,
    1, -1, -1, 0, 0,
    0, 0, 0, 1, 0,
  ].map(Number);

  const noiseMatrix = () => [
    1.2, 0.4, 0.2, 0, 0,
    0.4, 1.2, 0.4, 0, 0,
    0.2, 0.4, 1.2, 0, 0,
    0, 0, 0, 1, 0,
  ].map(Number);

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
  
      navigation.replace('EditPhoto', { newImageUri: imageMetadata.path,imageHistory: imageHistory,currentIndex: currentIndex});
    } catch (error) {
      Alert.alert("Error", `Failed to save image: ${error.message}`);
      console.error("Save error:", error);
    }
  };

  const handleEffectPress = (effect) => {
    setSelectedEffect(effect);
  };

  if (!image) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading image...</Text>
      </View>
    );
  }

  const getEffectMatrix = () => {
    switch (selectedEffect) {
      case 'Default':
        return defaultMatrix();
      case 'Grayscale':
        return grayscaleMatrix();
      case 'Sepia':
        return sepiaMatrix();
      case 'Invert':
        return invertMatrix();
      case 'HueRotation':
        return hueRotationMatrix(0.3);
      case 'Vibrance':
        return vibranceMatrix(1.5);
      case 'Emboss':
        return embossMatrix();
      case 'Noise':
        return noiseMatrix();
      default:
        return defaultMatrix();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.TopButtons}>


        <TouchableOpacity onPress={saveAndReturn}>
          <Ionicons style={styles.actionButtonText} name={'checkmark'} size={27} color="white" />
        </TouchableOpacity>
      </View>

      <Canvas style={styles.canvas} ref={canvasRef}>
        <Image
          image={image}
          x={0}
          y={0}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT * 0.7}
          fit="contain"
        >
          <ColorMatrix matrix={getEffectMatrix()} />
        </Image>
      </Canvas>

      <View style={styles.controls}>
        <View style={styles.effectButtons}>
          {[
            { name: 'Default', icon: 'refresh' },
            { name: 'Grayscale', icon: 'color-palette' },
            { name: 'Sepia', icon: 'color-filter' },
            { name: 'Invert', icon: 'contrast' },
            { name: 'HueRotation', icon: 'color-wand' },
            { name: 'Vibrance', icon: 'water' },
            { name: 'Emboss', icon: 'cube' },
            { name: 'Noise', icon: 'volume-medium' }
          ].map((effect) => (
            <TouchableOpacity
              key={effect.name}
              style={[styles.effectButton, selectedEffect === effect.name && styles.selectedEffect]}
              onPress={() => handleEffectPress(effect.name)}
            >
              <Ionicons name={effect.icon} size={24} color="white" />
              <Text style={styles.effectText}>{effect.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
  },
  TopButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
  },
  actionButtonText: {
    paddingHorizontal: 10,
  },
  canvas: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  effectButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  effectButton: {
    margin: 5,
    padding: 10,
    backgroundColor: '#444',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedEffect: {
    backgroundColor: '#666',
  },
  effectText: {
    color: 'white',
    marginLeft: 5,
  }
});