import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getDatabase, ref, set, get, runTransaction, onValue } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js"; 

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

const pinIndicators = document.getElementById('pinIndicators'); 
const errorMessage = document.getElementById('error-message');
const keypad = document.getElementById('keypad'); 

// --- ФУНКЦІЯ ЗБОРУ ГЕЛІКОПТЕРА №2 ---
window.collectHelicopter = async function(id) {
    if (!currentUID) return;
    const el = document.getElementById(`heli-${id}`);
    if (!el || el.classList.contains('heli-fly-away')) return;

    el.classList.add('heli-fly-away');
    try {
        await set(ref(database, `user/${currentUID}/collected_heli/${id}`), true);
        await runTransaction(ref(database, `user/${currentUID}/helicopter`), (current) => {
            return (current || 0) + 1;
        });
        setTimeout(() => el.remove(), 600);
    } catch (e) {
        console.error("Помилка збору:", e);
        el.classList.remove('heli-fly-away');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUID = user.uid;
            
            // Перевірка, чи гелікоптер №2 вже зібраний
            onValue(ref(database, `user/${currentUID}/collected_heli/2`), (snapshot) => {
                const isCollected = snapshot.exists() && snapshot.val() === true;
                const heli = document.getElementById('heli-2');
                if (heli) {
                    heli.style.display = isCollected ? 'none' : 'block';
                    if (!isCollected) {
                        heli.onclick = () => window.collectHelicopter(2);
                    }
                }
            });

            if (keypad) keypad.addEventListener('click', handleKeypadClick);
        } else {
            window.location.href = "welcome.html"; 
        }
    });
    updateIndicators();
});

// Решта функцій (setNewPinInDatabase, handleKeypadClick, updateIndicators, savePin) залишаються без змін
async function setNewPinInDatabase(uid, newPin) {
    try {
        await set(ref(database, `user/${uid}/pin`), newPin); 
        if (errorMessage) {
            errorMessage.textContent = 'PIN-код успішно змінено!';
            errorMessage.style.backgroundColor = '#4CAF50';
            errorMessage.style.display = 'block';
        }
        setTimeout(() => { window.location.href = 'setting.html'; }, 1500);
    } catch (error) {
        console.error("Помилка:", error);
        if (errorMessage) {
            errorMessage.textContent = 'Помилка встановлення PIN-коду.';
            errorMessage.style.backgroundColor = '#f44336';
            errorMessage.style.display = 'block';
        }
        enteredPin = "";
        updateIndicators();
    }
}

function handleKeypadClick(event) {
    const key = event.target.closest('.key');
    if (!key || key.classList.contains('placeholder')) return; // Не реагуємо на клік по placeholder (там гелікоптер)

    const value = key.dataset.value;
    const action = key.dataset.action;

    if (errorMessage) errorMessage.style.display = 'none';

    if (action === 'delete') {
        enteredPin = enteredPin.slice(0, -1);
    } else if (value && enteredPin.length < PIN_LENGTH) {
        enteredPin += value;
    }

    updateIndicators(); 
    if (enteredPin.length === PIN_LENGTH && currentUID) {
        savePin(); 
    }
}

function updateIndicators() {
    if (!pinIndicators) return; 
    const dots = pinIndicators.querySelectorAll('.pin-dot'); 
    dots.forEach((dot, index) => {
        dot.classList.toggle('filled', index < enteredPin.length);
    });
}

function savePin() {
    setNewPinInDatabase(currentUID, enteredPin); 
}
