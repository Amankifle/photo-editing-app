import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  TextInput,
  PanResponder,
} from "react-native";
import {
  Canvas,
  Image,
  Text as SkiaText,
  useImage,
  useCanvasRef,
  useFont
} from "@shopify/react-native-skia";
import ViewShot from "react-native-view-shot";
import RNFS from "react-native-fs";
import Ionicons from "react-native-vector-icons/Ionicons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function Paint({ route, navigation }) {
  const { imageUri, imageHistory, currentIndex } = route.params;
  const image = useImage(imageUri);
  const viewShotRef = useRef();
  const canvasRef = useCanvasRef();
  const [overlayText, setOverlayText] = useState("Your Text Here");
  const [textSize, setTextSize] = useState(30);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textPosition, setTextPosition] = useState({ x: 50, y: 100 });
  const textPositionRef = useRef(textPosition);
  const font = useFont(require("../assets/fonts/OpenSans-Regular.ttf"), textSize);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(0, Math.min(SCREEN_WIDTH - 100, gestureState.moveX));
        const newY = Math.max(0, Math.min(SCREEN_HEIGHT * 0.7 - 20, gestureState.moveY));
        
        setTextPosition({ x: newX, y: newY });
        textPositionRef.current = { x: newX, y: newY };
      },
    })
  ).current;

  const saveAndReturn = async () => {
    try {
      if (!viewShotRef.current) {
        throw new Error("ViewShot reference not available");
      }

      const uri = await viewShotRef.current.capture();
      const base64Image = await RNFS.readFile(uri, "base64");
  
      const filename = `${Date.now()}.jpg`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${filename}`;
  
      await RNFS.writeFile(filePath, base64Image, "base64");
  
      const fileStats = await RNFS.stat(filePath);
  
      const imageMetadata = {
        cropRect: { x: 19, y: 19, width: 188, height: 188 },
        filename: filename,
        height: 1000,
        width: 1000,
        mime: "image/jpeg",
        modificationDate: fileStats.mtime,
        path: `file://${filePath}`,
        size: fileStats.size,
      };
  
      navigation.replace("EditPhoto", {
        newImageUri: imageMetadata.path,
        imageHistory: imageHistory,
        currentIndex: currentIndex,
      });
  
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
      <View style={styles.TopButtons}>
        <TouchableOpacity onPress={saveAndReturn}>
          <Ionicons name="checkmark" size={27} color="white" />
        </TouchableOpacity>
      </View>

      <ViewShot ref={viewShotRef}>
        <Canvas style={styles.canvas} {...panResponder.panHandlers}>
          <Image
            image={image}
            x={0}
            y={0}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT * 0.7}
            fit="contain"
          />
          {font && (
            <SkiaText
              x={textPosition.x}
              y={textPosition.y}
              text={overlayText}
              font={font}
              color={textColor}
            />
          )}
        </Canvas>
      </ViewShot>

      <View style={styles.controlsContainer}>
        <TextInput
          style={styles.textInput}
          value={overlayText}
          onChangeText={setOverlayText}
          placeholder="Enter your text"
          placeholderTextColor="#ccc"
        />

        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Size:</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setTextSize(prev => Math.max(10, prev - 2))}
          >
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.sizeValue}>{textSize}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setTextSize(prev => Math.min(100, prev + 2))}
          >
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.colorPickerContainer}>
          {["#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#000000"].map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorOption, { backgroundColor: color }, textColor === color && styles.selectedColor]}
              onPress={() => setTextColor(color)}
            />
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
  },
  canvasContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  controlsContainer: {
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  TopButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 20,
  },
  controlLabel: {
    color: "#fff",
    fontSize: 16,
    marginRight: 10,
  },
  textInput: {
    height: 40,
    borderColor: "#444",
    borderWidth: 1,
    borderRadius: 5,
    color: "#fff",
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  button: {
    width: 40,
    height: 40,
    backgroundColor: "#333",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  sizeValue: {
    color: "#fff",
    fontSize: 16,
    minWidth: 50,
    textAlign: "center",
  },
  colorPickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#444",
  },
  selectedColor: {
    borderColor: "#fff",
    borderWidth: 3,
  },
});
