import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
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
let enteredPin = "";
let currentUID = null; 
let actualPin = null; 
const pinIndicators = document.getElementById('pinIndicators'); 
const errorMessage = document.getElementById('error-message');
const keypad = document.getElementById('keypad'); 
const logoutButton = document.getElementById('logoutButton');

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUID = user.uid;
            loadPinFromDatabase(currentUID);
            
            if (keypad) {
                keypad.addEventListener('click', handleKeypadClick);
            }
            if (logoutButton) {
                logoutButton.addEventListener('click', handleLogout);
            }
        } else {
            window.location.href = "welcome.html";
        }
    });
    
    updateIndicators();
});
async function loadPinFromDatabase(uid) {
    try {
        const dbRef = ref(database);
        // Читаємо з шляху user/{uid}/pin
        const snapshot = await get(child(dbRef, `user/${uid}/pin`)); 

        if (snapshot.exists()) {
            actualPin = snapshot.val();
            console.log("PIN-код завантажено з бази даних.");
        } else {
            actualPin = '0000'; 
            console.warn("PIN-код не знайдено в базі даних. Зверніться до адміністратора.");
        }
    } catch (error) {
        console.error("Помилка завантаження PIN-коду:", error);
        alert("Помилка підключення до бази даних. Спробуйте пізніше.");
    }
}
function handleKeypadClick(event) {
    const key = event.target.closest('.key');
    if (!key) return; 
    const value = key.dataset.value;
    const action = key.dataset.action;
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
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
        if (index < enteredPin.length) {
            dot.classList.add('filled'); 
        } else {
            dot.classList.remove('filled'); 
        }
    });
}
function checkPin() {
    
    if (enteredPin === actualPin) { 
        sessionStorage.setItem('pin_passed', 'true'); 
        window.location.href = 'pin10.html';
    } else {
        // Невірний PIN-код
        if (errorMessage) {
            errorMessage.style.display = 'block';
        }
        enteredPin = "";
        updateIndicators(); // Очищаємо крапки
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        sessionStorage.removeItem('pin_passed');
        window.location.href = 'welcome.html'; 
    } catch (error) {
        console.error("Помилка при виході:", error);
        alert("Помилка при виході.");
    }
}
