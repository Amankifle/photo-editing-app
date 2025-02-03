import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import React, { useState ,useContext } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { AuthContext } from './AuthContext';



export default function SignUpWithEmail({setModalVisible,navigation}) {
    const [signup, setSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [errorName, setErrorName] = useState(false)
    const [errorEmail, setErrorEmail] = useState(false)
    const [errorPassword, setErrorPassword] = useState(false)
    const [errorConfirmPassword, setErrorConfirmPassword] = useState(false)
    
    const { login } = useContext(AuthContext);
    const { SetEmail } = useContext(AuthContext);

    const signUpWithEmail = async () => {
        if (name == '') {
            setErrorName(true);
            console.error("Please enter name!");
            return;
        } else {
            setErrorName(false);
        }
        if (email == '') {
            setErrorEmail(true);
            console.error("Please enter email!");
            return;
        } else {
            setErrorEmail(false);
        }
        if (password == '') {
            setErrorPassword(true);
            console.error("Please enter password!");
            return;
        } else {
            setErrorPassword(false);
        }
        if (password !== confirmPassword) {
            setErrorConfirmPassword(true);
            console.error("Passwords do not match!");
            return;
        } else {
            setErrorConfirmPassword(false);
        }
    
        try {
            const userCredential = await auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
    
            // Send email verification
            await user.sendEmailVerification();
            console.log('Verification email sent!');
    
            // Update user profile
            await user.updateProfile({
                displayName: name,
            });
    
            Alert.alert(
                'A verification email has been sent to your email please verify before logging in.'
            );
    
            setSignup(false);
            setPassword('');
    
            const timestamp = new Date();
            await firestore().collection('users').doc(user.uid).set({
                name: name,
                email: email,
                createdAt: timestamp,
                phone: '',
            });
        } catch (error) {
            if (error?.code === 'auth/email-already-in-use') {
                setErrorEmail(true);
                console.error('This email is already in use!');
            } else if (error?.code === 'auth/invalid-email') {
                setErrorEmail(true);
                console.error('This email address is invalid!');
            } else {
                setErrorEmail(false);
            }
            if (error?.code === 'auth/weak-password') {
                setErrorPassword(true);
                console.error('Password should be at least 6 characters!');
            }
        }
    };
    

    
    const loginWithEmail = async () => {
        try {
            auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
        if(userCredential.user.emailVerified){
            Alert.alert('User signed in:');
            setModalVisible(false)
            login();
            SetEmail(email);
            navigation();
        }else{
            Alert.alert('User not verified.Please login to your email and verify.');
        }

    })
    .catch((error) => {
        setErrorEmail(true);
        console.error('Please enter email!');
    });
        } catch (error) {
            console.error('Error getting user data or checking password:', error);
            return null;
        }
    };
    

    return (
        <View style={styles.container}>
            {/* Header */}
            {signup ? <Text style={styles.headerText}>Sign up</Text> : <Text style={styles.headerText}>Sign in</Text>}
            <TouchableOpacity style={styles.helpButton}>
                <Text style={styles.helpText}>Help</Text>
            </TouchableOpacity>

            <View style={styles.logoContainer}>
                <Text style={styles.logo}>Photo Shop</Text>
            </View>

            {signup && (
                <>
                    <TextInput
                        style={[styles.input, errorName?{ borderColor: 'red'}:null]}
                        placeholder="Enter your name"
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor="#cccccc"
                    />
                </>
            )}

            <TextInput
                style={[styles.input, errorEmail?{ borderColor: 'red'}:null]}
                placeholder="Enter email address"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#cccccc"
            />
            {/* <Text style={styles.errorText}>Enter the correct email</Text> */}
            <TextInput
                style={[styles.input, errorPassword?{ borderColor: 'red'}:null]}
                placeholder="Enter password"
                placeholderTextColor="#cccccc"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            {signup && (
                <TextInput
                    style={[styles.input, errorConfirmPassword?{ borderColor: 'red'}:null]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password"
                    placeholderTextColor="#cccccc"
                    secureTextEntry
                />
            )}

            <TouchableOpacity
                style={styles.continueButton}
                onPress={signup ? () => signUpWithEmail() : () => loginWithEmail()}
            >
                <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>

            {signup ? null : (
                <>
                    <TouchableOpacity>
                        <Text style={styles.linkText}>Forgot password?</Text>
                    </TouchableOpacity>
                    <Text style={styles.signUpText}>
                        Don't have an account? <Text onPress={() => setSignup(true)} style={styles.signUpLink}>Sign up</Text>
                    </Text>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        width: '100%',
        borderRadius: 20,
    },
    headerText: {
        fontSize: 27,
        fontWeight: '600',
        textAlign: 'center',
        marginVertical: 40,
        marginBottom: 20,
    },
    helpButton: {
        position: 'absolute',
        top: 15,
        right: 20,
    },
    helpText: {
        fontSize: 14,
        color: '#007BFF',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 0,
        marginBottom: 40,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        marginVertical: 10,
        backgroundColor: '#f9f9f9',
    },
    errorText: {
        color: '#ff0000',
        fontSize: 14,
        marginBottom: 5,
        marginLeft: 10,
    },
    continueButton: {
        height: 50,
        backgroundColor: '#bbb',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    continueText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    linkText: {
        fontSize: 14,
        color: '#007BFF',
        textAlign: 'center',
        marginVertical: 10,
    },
    signUpText: {
        fontSize: 14,
        color: 'black',
        alignSelf: 'center',
        textAlign: 'center',
        position: 'absolute',
        bottom: 0,
    },
    signUpLink: {
        color: '#007BFF',
    },
});
