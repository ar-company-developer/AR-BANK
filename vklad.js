import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, push, get, update } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// === КОНФІГУРАЦІЯ FIREBASE (ЗАМІНІТЬ) ===
const firebaseConfig = {
    apiKey: "AIzaSyCxfUZl7STcdC53SSogfbVc-4dIijVEbLg",
    authDomain: "ar-bank-dbfd9.firebaseapp.com",
    databaseURL: "https://ar-bank-dbfd9-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "ar-bank-dbfd9",
    // ... інші ключі ...
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app); 

// --- Елементи DOM ---
const pageBody = document.getElementById('pageBody');
const authStatusElement = document.getElementById('authStatus');
const vkladFormElement = document.getElementById('vkladForm');
const footerButtonArea = document.getElementById('footerButtonArea');
const balanceInfoElement = document.getElementById('balanceInfo');
const statusMessageElement = document.getElementById('statusMessage');
const telegramInput = document.getElementById('telegramUsername');
const robloxInput = document.getElementById('robloxUsername');
const amountInput = document.getElementById('amount');
const confirmButton = document.getElementById('confirmButton');

let currentUID = null;
let currentBalance = 0;

// === ФУНКЦІОНАЛ ТЕМ ===
function applyTheme(theme) {
    pageBody.setAttribute('data-theme', theme);
}

// Завантаження теми при старті (беремо її з localStorage)
const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);


// === ЛОГІКА БАЛАНСУ ТА ФОРМИ ===

// 1. Оновлення інформації про баланс та стану кнопки
function updateDisplay() {
    balanceInfoElement.textContent = `Ваш поточний баланс: ${currentBalance.toFixed(2)} €`;

    const amount = Number(amountInput.value);
    const minAmount = 100;

    const isValid = amount >= minAmount && amount <= currentBalance;
    confirmButton.disabled = !isValid;
    
    if (amount > currentBalance) {
        statusMessageElement.textContent = "Недостатньо коштів на балансі.";
        statusMessageElement.style.display = 'block';
    } else if (amount < minAmount && amount !== 0) {
        statusMessageElement.textContent = `Мінімальний внесок: ${minAmount} €.`;
        statusMessageElement.style.display = 'block';
    } else {
        statusMessageElement.style.display = 'none';
    }
}

// 2. Завантаження балансу користувача
async function loadBalance(uid) {
    try {
        const balanceRef = ref(database, `user/${uid}/card/balance`);
        const snapshot = await get(balanceRef);
        
        const balanceStr = snapshot.exists() ? snapshot.val() : "0";
        currentBalance = Number(balanceStr); 
        updateDisplay();
        
    } catch (error) {
        statusMessageElement.textContent = "Помилка завантаження балансу.";
        statusMessageElement.style.display = 'block';
        console.error("Помилка завантаження балансу:", error);
    }
}

// 3. Обробка події "Підтвердити внесок"
async function handleVklad() {
    statusMessageElement.style.display = 'none';
    const amount = Number(amountInput.value);
    const telegram = telegramInput.value.trim();
    const roblox = robloxInput.value.trim();
    
    if (!currentUID || amount <= 0 || amount > currentBalance || amount < 100) {
        updateDisplay();
        return;
    }
    
    if (!telegram.startsWith('@') || roblox.trim() === '') {
        statusMessageElement.textContent = 'Будь ласка, введіть коректні дані Telegram (@username) та Roblox.';
        statusMessageElement.style.display = 'block';
        return;
    }
    
    confirmButton.disabled = true;
    confirmButton.textContent = "Обробка...";

    try {
        // 1. Оновлення балансу (зняття коштів)
        const newBalance = currentBalance - amount;
        await update(ref(database, `user/${currentUID}/card`), {
             // Зберігаємо баланс як рядок з двома знаками після коми
             balance: String(newBalance.toFixed(2)) 
        });

        // 2. Створення запису про вклад (deposit)
        const vkladData = {
            amount: amount,
            telegram: telegram,
            roblox: roblox,
            timestamp: Date.now(),
            status: 'active' // Припустимо, що вклад активується одразу після зняття коштів
        };
        
        // Записуємо вклад до /deposits/[uid]/[vklad_id]
        const depositRef = ref(database, `deposits/${currentUID}`);
        await push(depositRef, vkladData);
        
        // 3. Успіх і перенаправлення
        window.location.href = "ok3.html"; // Припустимо, у вас є сторінка підтвердження
        
    } catch (error) {
        console.error("Помилка при оформленні вкладу:", error);
        // Відкат або повідомлення про помилку
        statusMessageElement.textContent = `Помилка: Не вдалося оформити вклад. Спробуйте пізніше.`;
        statusMessageElement.style.display = 'block';
        confirmButton.disabled = false;
        confirmButton.textContent = "Підтвердити внесок";
    }
}


// 4. Ініціалізація та обробники подій
amountInput.addEventListener('input', updateDisplay);
confirmButton.addEventListener('click', handleVklad);


// --- Перевірка автентифікації ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUID = user.uid;
        authStatusElement.style.display = 'none';
        vkladFormElement.style.display = 'block';
        footerButtonArea.style.display = 'block';
        loadBalance(user.uid);
    } else {
        // Якщо користувач не увійшов, перенаправляємо
        window.location.href = "login.html";
    }
});
