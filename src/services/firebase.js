// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBNaeR5iRx8GIrBGA7-a29tUhh3vNMctwI",
    authDomain: "sweet-paradise-a4612.firebaseapp.com",
    projectId: "sweet-paradise-a4612",
    storageBucket: "sweet-paradise-a4612.firebasestorage.app",
    messagingSenderId: "276128636621",
    appId: "1:276128636621:android:46b5c906cfb9150b3bd384"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const registerWithEmail = async(email, password, fullName, phone) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
            displayName: fullName
        });
        return {
            success: true,
            user: {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: fullName,
                phone: phone
            }
        };
    } catch (error) {
        let message = 'Ошибка при регистрации';
        switch (error.code) {
            case 'auth/email-already-in-use':
                message = 'Этот email уже зарегистрирован';
                break;
            case 'auth/invalid-email':
                message = 'Неверный формат email';
                break;
            case 'auth/weak-password':
                message = 'Пароль должен быть не менее 6 символов';
                break;
            default:
                message = error.message;
        }
        return { success: false, error: message };
    }
};

export const signInWithEmail = async(email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return {
            success: true,
            user: {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: userCredential.user.displayName
            }
        };
    } catch (error) {
        let message = 'Неверный логин или пароль';
        switch (error.code) {
            case 'auth/user-not-found':
                message = 'Пользователь не найден';
                break;
            case 'auth/wrong-password':
                message = 'Неверный пароль';
                break;
            case 'auth/invalid-email':
                message = 'Неверный формат email';
                break;
            case 'auth/user-disabled':
                message = 'Аккаунт заблокирован';
                break;
            case 'auth/too-many-requests':
                message = 'Слишком много попыток. Попробуйте позже';
                break;
        }
        return { success: false, error: message };
    }
};

export const logoutUser = async() => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const resetPassword = async(email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        let message = 'Ошибка при отправке письма';
        switch (error.code) {
            case 'auth/user-not-found':
                message = 'Пользователь не найден';
                break;
            case 'auth/invalid-email':
                message = 'Неверный формат email';
                break;
            default:
                message = error.message;
        }
        return { success: false, error: message };
    }
};

export const getCurrentUser = () => {
    return auth.currentUser;
};

export const onAuthStateChanged = (callback) => {
    return auth.onAuthStateChanged(callback);
};

export const updateUserProfile = async(data) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            return { success: false, error: 'Пользователь не авторизован' };
        }
        await updateProfile(user, data);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const isAuthenticated = () => {
    return auth.currentUser !== null;
};

export const getCurrentUserId = () => {
    return auth.currentUser ? .uid || null;
};