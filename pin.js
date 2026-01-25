import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getDatabase, ref, get, child, update } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
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
const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5; 
let enteredPin = "";
let currentUID = null; 
let actualPin = null; 
let failedAttempts = 0;
const pinIndicators = document.getElementById('pinIndicators'); 
const errorMessage = document.getElementById('error-message');
const keypad = document.getElementById('keypad'); 
const logoutButton = document.getElementById('logoutButton');
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUID = user.uid;
            loadPinFromDatabase(currentUID);
            if (keypad) keypad.addEventListener('click', handleKeypadClick);
            if (logoutButton) logoutButton.addEventListener('click', handleLogout);
        } else {
            window.location.href = "welcome.html";
        }
    });
    updateIndicators();
});
async function loadPinFromDatabase(uid) {
    try {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, `user/${uid}/pin`)); 
        if (snapshot.exists()) {
            actualPin = snapshot.val();
        } else {
            actualPin = '0000';
            console.warn("PIN не знайдено.");
        }
    } catch (error) {
        console.error("Помилка:", error);
    }
}
function handleKeypadClick(event) {
    const key = event.target.closest('.key');
    if (!key) return; 
    const value = key.dataset.value;
    const action = key.dataset.action;
    if (errorMessage) errorMessage.style.display = 'none';
    if (action === 'delete') {
        enteredPin = enteredPin.slice(0, -1);
    } else if (value && enteredPin.length < PIN_LENGTH) {
        enteredPin += value;
    }
    updateIndicators(); 
    if (enteredPin.length === PIN_LENGTH && currentUID && actualPin !== null) {
        checkPin();
    }
}
function updateIndicators() {
    if (!pinIndicators) return; 
    const dots = pinIndicators.querySelectorAll('.pin-dot'); 
    dots.forEach((dot, index) => {
        dot.classList.toggle('filled', index < enteredPin.length);
    });
}
async function checkPin() {
    if (enteredPin === actualPin) { 
        sessionStorage.setItem('pin_passed', 'true'); 
        window.location.href = 'card.html';
    } else {
        failedAttempts++;
        if (failedAttempts >= MAX_ATTEMPTS) {
            await blockCard();
        } else {
            showError();
        }
        enteredPin = "";
        updateIndicators();
    }
}
function showError() {
    if (!errorMessage) return;
    errorMessage.style.display = 'block';
    if (failedAttempts === 3) {
        errorMessage.innerText = "Невірний PIN. Залишилось 2 спроби";
    } else if (failedAttempts === 4) {
        errorMessage.innerText = "Невірний PIN. Залишилась 1 спроба";
    } else {
        errorMessage.innerText = "Невірний PIN-код. Спробуйте ще раз";
    }
}
async function blockCard() {
    if (!currentUID) return;
    try {
        const cardRef = ref(database, `user/${currentUID}/card`);
        await update(cardRef, {
            number: "bbbb bbbb bbbb bbbb"
        });
        alert("Через велику кількість помилок — ваш рахунок було заблоковано. Зверніться до адміністратора!");
        await handleLogout();
    } catch (error) {
        console.error("Помилка при блокуванні:", error);
        alert("Критична помилка безпеки.");
    }
}
async function handleLogout() {
    try {
        await signOut(auth);
        sessionStorage.removeItem('pin_passed');
        window.location.href = 'welcome.html';
    } catch (error) {
        console.error("Помилка:", error);
    }
}
