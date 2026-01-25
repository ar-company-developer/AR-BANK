import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";import { getDatabase, ref, query, orderByChild, equalTo, get, child } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
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
const auth = getAuth(app);
const database = getDatabase(app);
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const loginInput = document.getElementById('login-input');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    form.addEventListener('submit', async function(event) {
        event.preventDefault(); 
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
        const loginValue = loginInput.value.trim();
        const passwordValue = passwordInput.value.trim();
        let email = loginValue;if (!loginValue.includes('@')) {email = await resolveUsernameToEmail(loginValue);}if (!email) {errorMessage.textContent = "Невірний email або пароль.";errorMessage.style.display = 'block';return;}handleLogin(email, passwordValue);});async function resolveUsernameToEmail(username) {const cleanUsername = username.startsWith('@') ? username : `@${username}`;try {const userQuery = query(ref(database, 'NewUser'),orderByChild('username'),equalTo(cleanUsername));const snapshot = await get(userQuery);if (snapshot.exists()) {const userData = Object.values(snapshot.val())[0]; return userData.email;} else {return null;}} catch (error) {console.error("Помилка пошуку користувача в RTDB:", error);return null;}}async function handleLogin(email, password) {try {const userCredential = await signInWithEmailAndPassword(auth, email, password);const uid = userCredential.user.uid;const hasCard = await checkUserCardStatus(uid); if (hasCard) {sessionStorage.setItem('current_user_uid', uid); console.log("");window.location.href = 'pin.html';} else {await auth.signOut(); errorMessage.textContent = "Ваш обліковий запис очікує видачі картки адміністратором. Будь ласка, спробуйте пізніше.";errorMessage.style.display = 'block';}} catch (error) {console.error("Помилка входу:", error.code, error.message);let message = "Невірний email або пароль.";if (error.code === 'auth/invalid-email' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {message = "Невірний email або пароль.";}errorMessage.textContent = message;errorMessage.style.display = 'block';}}async function checkUserCardStatus(uid) {try {const dbRef = ref(database);const snapshot = await get(child(dbRef, `user/${uid}`));return snapshot.exists() && snapshot.val().card; } catch (error) {console.error("", error);return false;}}});
