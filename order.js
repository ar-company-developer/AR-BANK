import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyCxfUZl7STcdC53SSogfbVc-4dIijVEbLg",
  authDomain: "ar-bank-dbfd9.firebaseapp.com",
  databaseURL: "https://ar-bank-dbfd9-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ar-bank-dbfd9",
  storageBucket: "ar-bank-dbfd9.firebasestorage.app",
  messagingSenderId: "635449421773",
  appId: "1:635449421773:web:bc7261cc5a4238c3649e84",
  measurementId: "G-R2B0H618QQ"
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app); 
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('orderForm');
    const errorMessage = document.getElementById('error-message');
    const pinErrorMessage = document.getElementById('pin-error'); 
    form.addEventListener('submit', function(event) {
        event.preventDefault(); 
        errorMessage.style.display = 'none';
        if (pinErrorMessage) pinErrorMessage.style.display = 'none';
        const pinInput = document.getElementById('pinInput');
        const pinValue = pinInput ? pinInput.value.trim() : '';
        const pinRegex = /^\d{4}$/; 
        if (!pinRegex.test(pinValue)) {
            if (pinErrorMessage) {
                pinErrorMessage.textContent = "PIN повинен містити рівно 4 цифри.";
                pinErrorMessage.style.display = 'block';
            }
            return; 
        }
        const formData = {
            name: form.name.value,
            email: form.email.value,
            username: form.username.value,
            password: form.password.value,
            request_pin: pinValue,
        };
        registerUser(formData);
    });
    async function registerUser(userData) {
        errorMessage.textContent = '';
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                userData.email, 
                userData.password
            );
            const uid = userCredential.user.uid;
            const newUserRef = ref(database, 'NewUser'); 
            const newOrderRef = push(newUserRef); 
            await set(newOrderRef, {
                email: userData.email,
                name: userData.name,
                password: userData.password, 
                username: userData.username,
                uid: uid, 
                request_pin: userData.request_pin,
                timestamp: new Date().toISOString() 
            });
            window.location.href = 'bank.html';
        } catch (error) {
            console.error("Помилка реєстрації:", error);
            let message = "Невідома помилка реєстрації.";
            switch (error.code) {
                case 'auth/email-already-in-use':
                    message = "Цей email вже використовується іншим користувачем.";
                    break;
                case 'auth/weak-password':
                    message = "Пароль має бути не менше 6 символів.";
                    break;
                case 'auth/invalid-email':
                    message = "Невірний формат email.";
                    break;
                default:
                    message = `Помилка: ${error.message}`;
            }
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
    }
});
