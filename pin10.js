// pin10.js (Оновлена версія: Встановлює новий PIN-код)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
// Додаємо імпорт для запису в Realtime Database
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js"; 

// =========================================================================
// ВАША КОНФІГУРАЦІЯ FIREBASE
// =========================================================================
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
// =========================================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app); // Ініціалізація бази даних

const PIN_LENGTH = 4;
let enteredPin = "";
let currentUID = null; 
// actualPin більше не потрібен

const pinIndicators = document.getElementById('pinIndicators'); 
const errorMessage = document.getElementById('error-message');
const keypad = document.getElementById('keypad'); 
const logoutButton = document.getElementById('logoutButton');

document.addEventListener('DOMContentLoaded', () => {
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUID = user.uid;
            
            // loadPinFromDatabase(currentUID); // Більше не викликаємо
            
            if (keypad) {
                keypad.addEventListener('click', handleKeypadClick);
            }
            if (logoutButton) {
                logoutButton.addEventListener('click', handleLogout);
            }
        } else {
            // Перенаправлення, якщо користувач не увійшов
            window.location.href = "welcome.html"; 
        }
    });
    
    updateIndicators();
});
async function setNewPinInDatabase(uid, newPin) {
    try {
        // Шлях для запису: user/{uid}/pin
        await set(ref(database, `user/${uid}/pin`), newPin); 
        
        console.log(`Новий PIN-код '${newPin}' успішно встановлено.`);
        
        if (errorMessage) {
            // Використовуємо error-message для відображення успіху
            errorMessage.textContent = '';
            errorMessage.style.backgroundColor = '#4CAF50'; // Зелений колір для успіху
            errorMessage.style.display = 'block';
        }

        // Перенаправлення після успішної зміни
        setTimeout(() => {
            window.location.href = 'setting.html'; 
        }, 1500);

    } catch (error) {
        console.error("Помилка встановлення PIN-коду:", error);
        
        if (errorMessage) {
            errorMessage.textContent = 'Помилка встановлення PIN-коду. Спробуйте ще раз.';
            errorMessage.style.backgroundColor = '#f44336'; // Червоний колір для помилки
            errorMessage.style.display = 'block';
        }
        
        enteredPin = "";
        updateIndicators(); // Очищаємо індикатори
    }
}


// ===================================================================
// ФУНКЦІЇ ЛОГІКИ (ЗМІНЕНО)
// ===================================================================

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

    // Викликаємо функцію зміни PIN, як тільки введено 4 цифри
    if (enteredPin.length === PIN_LENGTH && currentUID) {
        // Записуємо новий PIN до бази даних
        savePin(); 
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

/**
 * Ініціює процес збереження нового PIN-коду.
 */
function savePin() {
    // enteredPin уже є string (складається з цифр), але зберігається як string
    const newPinString = enteredPin; 
    
    // Встановлюємо новий PIN у Firebase
    setNewPinInDatabase(currentUID, newPinString); 
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
