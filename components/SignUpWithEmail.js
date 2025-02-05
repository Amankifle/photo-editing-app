import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useContext, useMemo } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { AuthContext } from './AuthContext';

export default function SignUpWithEmail({setModalVisible, navigation}) {
    const [signup, setSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [errorName, setErrorName] = useState(false);
    const [errorEmail, setErrorEmail] = useState(false);
    const [errorPassword, setErrorPassword] = useState(false);
    const [errorConfirmPassword, setErrorConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    const { login } = useContext(AuthContext);
    const { SetEmail } = useContext(AuthContext);

    // Check if form is valid
    const isFormValid = useMemo(() => {
        if (signup) {
            return name.trim() !== '' && 
                   email.trim() !== '' && 
                   password.trim() !== '' && 
                   confirmPassword.trim() !== '' && 
                   password === confirmPassword;
        }
        return email.trim() !== '' && password.trim() !== '';
    }, [signup, name, email, password, confirmPassword]);

    const handleError = (error) => {
        setLoading(false);
        switch (error?.code) {
            case 'auth/email-already-in-use':
                setErrorEmail(true);
                setErrorMessage('This email is already in use');
                break;
            case 'auth/invalid-email':
                setErrorEmail(true);
                setErrorMessage('Invalid email address');
                break;
            case 'auth/weak-password':
                setErrorPassword(true);
                setErrorMessage('Password should be at least 6 characters');
                break;
            case 'auth/wrong-password':
                setErrorPassword(true);
                setErrorMessage('Incorrect password');
                break;
            case 'auth/user-not-found':
                setErrorEmail(true);
                setErrorMessage('No account found with this email');
                break;
            case 'auth/network-request-failed':
                setErrorMessage('Network error. Please check your connection');
                break;
            default:
                setErrorPassword(true);
                setErrorMessage('Incorrect password');
        }
    };

    const validateInputs = () => {
        setErrorMessage('');
        
        if (signup && name === '') {
            setErrorName(true);
            setErrorMessage('Please enter name');
            return false;
        }
        
        if (email === '') {
            setErrorEmail(true);
            setErrorMessage('Please enter email');
            return false;
        }
        
        if (password === '') {
            setErrorPassword(true);
            setErrorMessage('Please enter password');
            return false;
        }
        
        if (signup && password !== confirmPassword) {
            setErrorConfirmPassword(true);
            setErrorMessage('Passwords do not match');
            return false;
        }
        
        return true;
    };

    const signUpWithEmail = async () => {
        if (!validateInputs()) return;
        
        setLoading(true);
        try {
            const userCredential = await auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            await user.sendEmailVerification();
            
            await user.updateProfile({
                displayName: name,
            });

            const timestamp = new Date();
            await firestore().collection('users').doc(user.uid).set({
                name: name,
                email: email,
                createdAt: timestamp,
                phone: '',
            });

            setLoading(false);
            Alert.alert(
                'Success',
                'A verification email has been sent. Please verify before logging in.',
                [{ text: 'OK', onPress: () => {
                    setSignup(false);
                    // Reset form
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                    setName('');
                    setErrorMessage('');
                    setErrorEmail(false);
                    setErrorPassword(false);
                    setErrorConfirmPassword(false);
                    setErrorName(false);
                }}]
            );

        } catch (error) {
            handleError(error);
        }
    };

    const loginWithEmail = async () => {
        if (!validateInputs()) return;

        setLoading(true);
        try {
            const userCredential = await auth().signInWithEmailAndPassword(email, password);
            
            if (userCredential.user.emailVerified) {
                setLoading(false);
                setModalVisible(false);
                login();
                SetEmail(email);
                navigation();
            } else {
                setLoading(false);
                Alert.alert(
                    'Verification Required',
                    'Please verify your email before logging in.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            handleError(error);
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

            {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {signup && (
                <TextInput
                    style={[styles.input, errorName ? { borderColor: 'red' } : null]}
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={(text) => {
                        setName(text);
                        setErrorName(false);
                        setErrorMessage('');
                    }}
                    placeholderTextColor="#cccccc"
                />
            )}

            <TextInput
                style={[styles.input, errorEmail ? { borderColor: 'red' } : null]}
                placeholder="Enter email address"
                value={email}
                onChangeText={(text) => {
                    setEmail(text);
                    setErrorEmail(false);
                    setErrorMessage('');
                }}
                placeholderTextColor="#cccccc"
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={[styles.input, errorPassword ? { borderColor: 'red' } : null]}
                placeholder="Enter password"
                placeholderTextColor="#cccccc"
                value={password}
                onChangeText={(text) => {
                    setPassword(text);
                    setErrorPassword(false);
                    setErrorMessage('');
                }}
                secureTextEntry
            />

            {signup && (
                <TextInput
                    style={[styles.input, errorConfirmPassword ? { borderColor: 'red' } : null]}
                    value={confirmPassword}
                    onChangeText={(text) => {
                        setConfirmPassword(text);
                        setErrorConfirmPassword(false);
                        setErrorMessage('');
                    }}
                    placeholder="Confirm password"
                    placeholderTextColor="#cccccc"
                    secureTextEntry
                />
            )}

            <TouchableOpacity
                style={[
                    styles.continueButton,
                    { backgroundColor: !isFormValid || loading ? '#CCCCCC' : '#007BFF' }
                ]}
                onPress={signup ? signUpWithEmail : loginWithEmail}
                disabled={!isFormValid || loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.continueText}>Continue</Text>
                )}
            </TouchableOpacity>

            {!signup && (
                <>
                    <TouchableOpacity>
                        <Text style={styles.linkText}>Forgot password?</Text>
                    </TouchableOpacity>
                    <Text style={styles.signUpText}>
                        Don't have an account?{' '}
                        <Text 
                            onPress={() => {
                                setSignup(true);
                                setErrorMessage('');
                                setErrorEmail(false);
                                setErrorPassword(false);
                                // Reset form when switching to signup
                                setEmail('');
                                setPassword('');
                                setConfirmPassword('');
                                setName('');
                            }} 
                            style={styles.signUpLink}
                        >
                            Sign up
                        </Text>
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
        marginBottom: 30,
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
        marginBottom: 10,
        textAlign: 'center',
    },
    continueButton: {
        height: 50,
        backgroundColor: '#007BFF',
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