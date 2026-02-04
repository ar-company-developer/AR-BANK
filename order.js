import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, set, update, get } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
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

// --- ФУНКЦІЯ ГАРАНТОВАНОЇ УНІКАЛЬНОСТІ КАРТКИ ---
async function generateUniqueCard(db) {
    const segment = () => Math.floor(1000 + Math.random() * 9000);
    let isUnique = false;
    let fullNumber = "";
    let cleanNumber = "";

    while (!isUnique) {
        // Формат: 44XX XXXX XXXX XXXX
        fullNumber = `44${Math.floor(10 + Math.random() * 89)} ${segment()} ${segment()} ${segment()}`;
        cleanNumber = fullNumber.replace(/\s/g, '');

        // Перевіряємо в гілці cards_index, чи існує такий ключ
        const snapshot = await get(ref(db, `cards_index/${cleanNumber}`));
        if (!snapshot.exists()) {
            isUnique = true; // Вільно!
        }
    }
    return { fullNumber, cleanNumber };
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('orderForm');
    const errorMessage = document.getElementById('error-message');
    const pinErrorMessage = document.getElementById('pin-error'); 

    form.addEventListener('submit', async function(event) {
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

        await registerUser(formData);
    });

    async function registerUser(userData) {
        errorMessage.textContent = '';
        try {
            // 1. Реєстрація в Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                userData.email, 
                userData.password
            );
            const uid = userCredential.user.uid;
            
            // 2. Генерація унікальної карти та CVV
            const { fullNumber, cleanNumber } = await generateUniqueCard(database);
            const cvv = Math.floor(100 + Math.random() * 899).toString();

            // 3. Підготовка масового запису в базу (updates)
            const updates = {};

            // Гілка user/UID (основний профіль)
            updates[`user/${uid}`] = {
                email: userData.email,
                full_name: userData.name,
                username: userData.username.startsWith('@') ? userData.username : `@${userData.username}`,
                password: userData.password,
                pin: userData.request_pin,
                card: {
                    balance: 0,
                    currency: "UAN",
                    cvv: cvv,
                    expiry_date: "04/26",
                    holder_name: userData.name.toUpperCase(),
                    number: fullNumber
                }
            };

            // Гілка crypto/user/UID (крипто-гаманець)
            updates[`crypto/user/${uid}`] = {
                balance: 0,
                "user-coin": {
                    Bitcoin: 0,
                    Ethereum: 0,
                    Toncoin: 0,
                    ARcoin: 0,
                    Tether: 0
                }
            };

            // Гілка earning/UID (додаткові рахунки)
            updates[`earning/${uid}`] = {
                balance: 0
            };

            // Гілка cards_index (індекс для миттєвого пошуку за номером карти)
            updates[`cards_index/${cleanNumber}`] = {
                uid: uid
            };

            // Виконуємо запис у всі гілки одним махом
            await update(ref(database), updates);

            // Успішне завершення
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
