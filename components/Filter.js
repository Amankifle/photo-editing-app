import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from "react-native";
import { Canvas, Image, useImage, ColorMatrix, useCanvasRef, ImageFilter } from "@shopify/react-native-skia";
import RNFS from "react-native-fs";
import Ionicons from 'react-native-vector-icons/Ionicons';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function Filter({ route, navigation }) {
  const { imageUri } = route.params;
  const { imageHistory } = route.params;
  const { currentIndex } = route.params;
  const image = useImage(imageUri);
  const [brightness, setBrightness] = useState(1.0);
  const [contrast, setContrast] = useState(1.0);
  const [saturation, setSaturation] = useState(1.0);
  const [blur, setBlur] = useState(0);
  const canvasRef = useCanvasRef();
  const [selectedFilter, setSelectedFilter] = useState("Brightness");

  const brightnessMatrix = (value) => [
    value, 0, 0, 0, 0,
    0, value, 0, 0, 0,
    0, 0, value, 0, 0,
    0, 0, 0, 1, 0,
  ].map(Number);

  const contrastMatrix = (value) => {
    const offset = 0.5 * (1 - value);
    return [
      value, 0, 0, 0, offset,
      0, value, 0, 0, offset,
      0, 0, value, 0, offset,
      0, 0, 0, 1, 0,
    ].map(Number);
  };

  const saturationMatrix = (value) => {
    const rw = 0.3086;
    const gw = 0.6094;
    const bw = 0.0820;
    return [
      (1 - value) * rw + value, (1 - value) * gw, (1 - value) * bw, 0, 0,
      (1 - value) * rw, (1 - value) * gw + value, (1 - value) * bw, 0, 0,
      (1 - value) * rw, (1 - value) * gw, (1 - value) * bw + value, 0, 0,
      0, 0, 0, 1, 0,
    ].map(Number);
  };
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

  const handleFilterPress = (filter) => {
    setSelectedFilter(filter);
  };
  const handleFilterAdjust = (delta) => {
    switch(selectedFilter) {
      case 'Brightness':
        setBrightness(prev => Math.max(0.1, Math.min(2.0, prev + delta)));
        break;
      case 'Contrast':
        setContrast(prev => Math.max(0.1, Math.min(2.0, prev + delta)));
        break;
      case 'Saturation':
        setSaturation(prev => Math.max(0.1, Math.min(2.0, prev + delta)));
        break;
      case 'Blur':
        setBlur(prev => Math.max(0, Math.min(10, prev + delta)));
        break;
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
        <View style={styles.TopButtons}>

          <TouchableOpacity 
            onPress={saveAndReturn}
          >
            <Ionicons style={styles.actionButtonText} name={'checkmark'} size={27} color="white" />
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
          filter={blur > 0 ? ImageFilter.MakeBlur(blur, blur) : null}
        >
          <ColorMatrix matrix={brightnessMatrix(brightness)} />
          <ColorMatrix matrix={contrastMatrix(contrast)} />
          <ColorMatrix matrix={saturationMatrix(saturation)} />
        </Image>
      </Canvas>

      <View style={styles.controlsContainer}>
        <View style={styles.brightnessControls}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => handleFilterAdjust(-0.1)}
          >
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>
          
          <Text style={styles.brightnessValue}>
            {selectedFilter === 'Blur' 
              ? `${Math.round(blur)}px`
              : `${Math.round(
                  (selectedFilter === 'Brightness' ? brightness :
                  selectedFilter === 'Contrast' ? contrast :
                  saturation) * 100
                )}%`}
          </Text>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => handleFilterAdjust(0.1)}
          >
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.BottomButtons}>
          {["Brightness", "Contrast", "Saturation", "Blur"].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.FilterButtons,
                selectedFilter === filter && styles.selectedFilterButton,
              ]}
              onPress={() => handleFilterPress(filter)}
            >
              <Text style={styles.FilterButtonsText}>{filter}</Text>
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
    backgroundColor: "#000",
    justifyContent: "space-between",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  canvas: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    alignSelf: "center",
    marginTop: 20,
  },
  controlsContainer: {
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  brightnessControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  button: {
    width: 40,
    height: 40,
    backgroundColor: "#333",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  brightnessValue: {
    color: "#fff",
    fontSize: 16,
    minWidth: 50,
    textAlign: "center",
  },
  TopButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginHorizontal: 5
  },
  BottomButtons: {
   flexDirection: 'row',
    height: 40,
  },
  FilterButtons: {
    backgroundColor: 'grey',
    margin: 1,
    flex: 1,
    justifyContent: 'center',
    borderRadius: 5
  },
  FilterButtonsText:{
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  selectedFilterButton: {
    backgroundColor: '#444',
  }
})