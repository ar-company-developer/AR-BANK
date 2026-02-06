import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig),
    auth = getAuth(app),
    database = getDatabase(app);

// --- Константи статусів ---
const STATUS_EXPIRED = "aaaa aaaa aaaa aaaa";
const STATUS_BLOCKED = "bbbb bbbb bbbb bbbb";

const AVAILABLE_STYLES_MAP = {
    'default': { image: 'card.png' }, 
    'central-rp': { image: 'cardC.jpg'},
    'ukraine-rp': { image: 'card1.png'},
    'poltava-rp': { image: 'card2.png'},
    'central-rp1': { image: 'card4.png'},
    'chernihiv-rp': { image: 'card5.png'},
    'class1': { image: "card7.png"},
    'class2': { image: "card6.png"},
    'class3': { image: "card8.png"},
    'class4': { image: "card9.png"}
};

// --- Допоміжні функції ---

function getBlockOverlay(cardNumber) {
    if (cardNumber === STATUS_EXPIRED) return "ТЕРМІН ДІЇ ВИЙШОВ";
    if (cardNumber === STATUS_BLOCKED) return "КАРТКУ ЗАБЛОКОВАНО";
    return null;
}

window.toggleFlip = (element) => {
    // Якщо карта заблокована (має спец. номер), забороняємо перевертання
    const numDisplay = element.querySelector(".card-number strong");
    if (numDisplay && getBlockOverlay(numDisplay.textContent)) return;
    
    if (element.classList.contains('card2-container')) return;
    element.classList.toggle("flipped");
};

window.handleCard2Click = (event, element) => {
    event.stopPropagation();
    // Не даємо розгортати меню, якщо карта заблокована
    const numDisplay = element.querySelector(".card-number strong");
    if (numDisplay && getBlockOverlay(numDisplay.textContent)) return;
    
    element.classList.toggle('shrunk');
};

document.addEventListener('click', () => {
    const shrunkCard = document.querySelector('.card2-container.shrunk');
    if (shrunkCard) shrunkCard.classList.remove('shrunk');
});

// --- Функції рендеру ---

function updateFirstCard(data) {
    const card = document.querySelector('.card:first-child');
    if (!card || !data) return;

    const blockText = getBlockOverlay(data.number);
    
    // Візуальне блокування
    if (blockText) {
        card.classList.add("card-disabled");
        if (!card.querySelector(".block-overlay")) {
            const overlay = document.createElement("div");
            overlay.className = "block-overlay";
            overlay.innerHTML = `<span>${blockText}</span>`;
            card.appendChild(overlay);
        }
    } else {
        card.classList.remove("card-disabled");
        const overlay = card.querySelector(".block-overlay");
        if (overlay) overlay.remove();
    }

    const numDisplay = card.querySelector(".card-num-display") || card.querySelector(".card-number strong");
    if (numDisplay) numDisplay.textContent = data.number || "#### #### #### ####";
    
    const nameDisplay = card.querySelector(".card-name-display") || card.querySelector(".card-name span");
    if (nameDisplay) nameDisplay.textContent = (data.holder_name || "NAME SURNAME").toUpperCase();
    
    const expiryDisplay = card.querySelector(".expiry-date");
    if (expiryDisplay) expiryDisplay.textContent = data.expiry_date || "--/--";
    
    const style = AVAILABLE_STYLES_MAP[data.style_id] || AVAILABLE_STYLES_MAP['default'];
    const frontSide = card.querySelector(".card-front");
    const backSide = card.querySelector(".card-back");

    if (frontSide) frontSide.style.backgroundImage = `url('${style.image}')`;
    if (backSide) backSide.style.backgroundImage = `url('${style.image}')`;
}

function renderSecondCardUI(data) {
    const container = document.getElementById('secondCardContainer');
    if (!container) return;

    const blockText = getBlockOverlay(data.number);
    const isDisabled = blockText ? "disabled" : "";
    const blurClass = blockText ? "card-blur" : "";

    container.innerHTML = `
        <div class="card card2-container ${blockText ? 'card-disabled' : ''}" onclick="window.handleCard2Click(event, this)">
            <div class="card-inner">
                <div class="card-front second-card-style ${blurClass}">
                    ${blockText ? `<div class="block-overlay-inner"><span>${blockText}</span></div>` : ''}
                    <div class="chip-logo-container">
                        <div class="card-chip">
                             <svg fill="white" viewBox="0 0 511 511"><path d="M455.5,56h-400C24.897,56,0,80.897,0,111.5v288C0,430.103,24.897,455,55.5,455h400c30.603,0,55.5-24.897,55.5-55.5v-288C511,80.897,486.103,56,455.5,56z M464,248H343v-56.5c0-4.687,3.813-8.5,8.5-8.5H464V248z M343,263h121v65H343V263z M479,223h17v65h-17V223z M479,208v-65h17v65H479z M464,168H351.5c-12.958,0-23.5,10.542-23.5,23.5V408H183V103h272.5c4.687,0,8.5,3.813,8.5,8.5V168z M168,248H47v-65h121V248z M32,288H15v-65h17V288z M47,263h121v65H47V263z M263,88V71h137v17H263z M248,88H111V71h137V88z M168,103v65H47v-56.5c0-4.687,3.813-8.5,8.5-8.5H168z M32,208H15v-65h17V208z M15,303h17v65H15V303z M47,343h121v65H55.5c-4.687,0-8.5-3.813-8.5-8.5V343z M248,423v17H111v-17H248z M263,423h137v17H263V423z M343,408v-65h121v56.5c0,4.687-3.813,8.5-8.5,8.5H343z M479,303h17v65h-17V303z M496,111.5V128h-17v-16.5c0-12.958-10.542-23.5-23.5-23.5H415V71h40.5C477.832,71,496,89.168,496,111.5z M55.5,71H96v17H55.5C42.542,88,32,98.542,32,111.5V128H15v-16.5C15,89.168,33.168,71,55.5,71z M15,399.5V383h17v16.5c0,12.958,10.542,23.5,23.5,23.5H96v17H55.5C33.168,440,15,421.832,15,399.5z M455.5,440H415v-17h40.5c12.958,0,23.5-10.542,23.5-23.5V383h17v16.5C496,421.832,477.832,440,455.5,440z"/></svg>
                        </div>
                        <div class="bank-logo"><strong>AR-Card</strong></div>
                    </div>
                    <div class="card-number"><strong>${data.number || "#### #### #### ####"}</strong></div>
                    <div class="card-details">
                        <div class="card-expiry">
                            <span>BALANCE</span>
                            <span class="expiry-date">${(data.balance || 0).toFixed(2)} €</span>
                        </div>
                        <div class="card-name"><span>${data.type || "TYPE"}</span></div>
                    </div>
                </div>
            </div>
            
            <div class="quick-actions-grid">
                <button class="grid-btn" ${isDisabled} onclick="event.stopPropagation(); window.location.href='rep.html'">Поповнити</button>
                <button class="grid-btn" ${isDisabled} onclick="event.stopPropagation(); window.location.href='perecas.html'">Переказ</button>
                <button class="grid-btn" ${isDisabled} onclick="event.stopPropagation(); window.location.href='vivid.html'">Вивести</button>
                <button class="grid-btn" ${isDisabled} onclick="event.stopPropagation(); window.location.href='card_setting.html'">Налаштування</button>
            </div>
        </div>`;
}

// --- Логіка синхронізації ---

async function syncSecondCard(localData, uid) {
    const container = document.getElementById('secondCardContainer');
    if (!container) return;

    if (!localData) {
        container.innerHTML = `
            <div class="card" style="display: flex; align-items: center; justify-content: center;">
                <div class="add-card-btn" onclick="window.location.href='card2.html'">
                    <span>+</span>
                </div>
            </div>`;
        return;
    }

    const rawNum = localData.number.replace(/\s/g, '');
    
    try {
        const indexSnap = await get(ref(database, `cards_index/${rawNum}`));
        if (indexSnap.exists()) {
            const ownerUID = indexSnap.val().uid;
            // Підписка на дані реального власника для синхронізації балансу та статусу
            onValue(ref(database, `user/${ownerUID}/card2`), (snap) => {
                if (snap.exists()) renderSecondCardUI(snap.val());
            });
        } else {
            renderSecondCardUI(localData);
        }
    } catch (e) {
        renderSecondCardUI(localData);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, user => {
        if (user) {
            // Слухаємо першу карту
            onValue(ref(database, `user/${user.uid}/card`), (snap) => updateFirstCard(snap.val()));
            
            // Слухаємо другу карту
            onValue(ref(database, `user/${user.uid}/card2`), (snap) => {
                syncSecondCard(snap.val(), user.uid);
            }, { onlyOnce: true });
            
        } else {
            window.location.href = "login.html";
        }
    });

    // Крапки слайдера
    const slider = document.querySelector('.slider-container');
    const dots = document.querySelectorAll('.dot');
    if (slider) {
        slider.addEventListener('scroll', () => {
            const index = Math.round(slider.scrollLeft / 350);
            dots.forEach((dot, i) => { if (dot) dot.classList.toggle('active', i === index); });
        });
    }
});
