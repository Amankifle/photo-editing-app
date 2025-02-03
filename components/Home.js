import { Modal, View, Text, Button, StyleSheet, TouchableOpacity, Image, SafeAreaView  } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import Front_image from './../Resource/Images/Screenshot.png'
import SignUpWithEmail from './SignUpWithEmail';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { AuthContext } from './AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';

export default function Home({navigation}) {
    const [modalVisible, setModalVisible] = useState(false);

    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const { SetEmail } = useContext(AuthContext);
    
    useEffect(() => {
        // Configure Google Sign-In
        GoogleSignin.configure({
            webClientId: '689795346533-7nf37pqvli2cpmc65425b4dshq3pcrp1.apps.googleusercontent.com',  
        });
    }, []);

 const signInWithGoogle = async () => {
    try {
        setLoading(true);
        
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        await GoogleSignin.signOut();
        
        const userInfo = await GoogleSignin.signIn();
        console.log('User Info:', userInfo);
        if (!userInfo.data.idToken) {
            throw new Error('No ID token present!');
        }

        const googleCredential = auth.GoogleAuthProvider.credential(userInfo.data.idToken);
        const userCredential = await auth().signInWithCredential(googleCredential);
        const user = userCredential.user;

        try{
                    // Save user info to Firestore
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            const timestamp = new Date();
            await firestore().collection('users').doc(user.uid).set({
                name: user.displayName || userInfo.data.user.name,
                email: user.email || userInfo.data.user.email,
                createdAt: timestamp,
                phone: user.phoneNumber || '',
            });
        }
        }catch{
            console.log('unable to store user data')
        }finally{
        login();
        SetEmail(user.email);
        navigateToDesktop();
        }
        

    } catch (error) {
        console.error('Google Sign-In error:', error);
    } finally {
        setLoading(false);
    }
};

    
    const signOut = async () => {
      await auth().signOut();
      setUser(null);
    };
    
  const openModal = () => {
    setModalVisible(true);
  };
  const navigateToDesktop=()=>{
    navigation.goBack();
  }
  return (
    <SafeAreaView style={styles.container}>
          <View style={{ flex: 1.2, width: '100%',}}>
            <Image style={{width: '100%',height: '100%',resizeMode: 'cover',}} source={Front_image}></Image>
          </View>
          <View style={styles.option}>
          <TouchableOpacity 
                    style={[styles.button, loading && styles.buttonDisabled]} 
                    onPress={signInWithGoogle}
                    disabled={loading}
                >
                        <Image 
        source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/0/09/IOS_Google_icon.png' }} 
        style={{ width: 24, height: 24, marginRight: 10 }} 
    />
                    <Text style={styles.buttonText}>
                    
                        {loading ? 'Signing in...' : 'Sign in with Google'}
                    </Text>
                </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => openModal()}>
  <Ionicons name="mail" size={20} color="black" style={{marginRight: 9}}/>
              <Text style={styles.buttonText}>Sign in with Email</Text>
            </TouchableOpacity>
        </View>
        <Modal transparent={true} animationType="slide" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalWrapper}>
            <View style={styles.modalContainer}>

                <SignUpWithEmail setModalVisible={setModalVisible} navigation={navigateToDesktop}/>
        
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Ionicons name={"chevron-back"} size={24} color="black" />
                </TouchableOpacity>
            </View>
          </View>
        </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: 'white'
    },
    option: {
        marginTop: -10,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        backgroundColor: 'white',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: 'grey',
        borderWidth: 1,
        width: '100%',
    },
    button: {
        marginVertical: 10,
        paddingVertical: 12,
        paddingHorizontal: 20, 
        backgroundColor: '#fff',
        borderColor: '#ADD8E6',
        borderWidth: 1.2,

        width: '70%',
        flexDirection: 'row',  
        alignItems: 'center',  
        justifyContent: 'space-evenly', 
        gap: 10,  
    },
    buttonText: {
        color: 'black',
        fontSize: 16,
        textAlign: 'center',
    },
      modalWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Adds dim background overlay
    },
    modalContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 50
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    contentText: {
        fontSize: 16,
        textAlign: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        color: '#333',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        padding: 10,
        borderRadius: 5,
    },
  });
  