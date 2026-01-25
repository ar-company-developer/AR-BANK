import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, onValue, push, update, get } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
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

let currentUID = null;
let currentUsername = "Анонім";
let activeChatKey = null;
let activeChatPartnerUID = null;
const chatListPanel = document.getElementById("chatListPanel");
const chatView = document.getElementById("chatView");
const chatListContainer = document.getElementById("chatListContainer");
const messagesContainer = document.getElementById("messagesContainer");
const currentChatTitle = document.getElementById("currentChatTitle");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendMessageButton");
const confirmPaymentButtonContainer = document.getElementById("confirmPaymentButtonContainer");
const authMessage = document.getElementById("authMessage");
const chatHeaderBack = document.getElementById("chatHeaderBack");
const statusModal = document.getElementById("statusModal");
const modalIcon = document.getElementById("modalIcon");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalCloseBtn = document.getElementById("modalCloseBtn");
function showModal(type, title, message) {
    statusModal.className = `modal active modal-type-${type}`;
    modalIcon.textContent = "";
    modalTitle.textContent = title;
    modalMessage.innerHTML = message;
    statusModal.style.display = "flex";
}
modalCloseBtn.addEventListener("click", () => {
    statusModal.classList.remove("active");
    setTimeout(() => { statusModal.style.display = "none" }, 300);
});
const getChatKey = (uid1, uid2) => (uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`);
async function fetchUsername(uid) {
    if (!uid) return "Система";
    try {
        const snapshot = await get(ref(database, `user/${uid}/username`));
        return snapshot.exists() ? snapshot.val() : uid.substring(0, 8);
    } catch (e) { return "Невідомий"; }
}
function listenForUnreadCount(chatKey) {
    const chatRef = ref(database, "merket/chats/" + chatKey);
    onValue(chatRef, (snapshot) => {
        const messages = snapshot.val();
        const badgeElement = document.getElementById(`badge-${chatKey}`);
        if (activeChatKey === chatKey) {
            localStorage.setItem(`lastRead_${currentUID}_${chatKey}`, Date.now());
            if (badgeElement) badgeElement.style.display = "none";
            return;
        }
        if (!badgeElement) return;
        if (!messages) {
            badgeElement.style.display = "none";
            return;
        }
        const lastRead = parseInt(localStorage.getItem(`lastRead_${currentUID}_${chatKey}`)) || 0;
        let count = 0;
        Object.values(messages).forEach(msg => {
            if (msg.senderUID !== currentUID && msg.timestamp > lastRead) {
                count++;
            }
        });
        if (count > 0) {
            badgeElement.textContent = count > 99 ? "99+" : count;
            badgeElement.style.display = "flex";
        } else {
            badgeElement.style.display = "none";
        }
    });
}
function loadChatList() {
    if (!currentUID) return;
    chatListContainer.innerHTML = '<p class="no-chats-message">Завантаження...</p>';
    onValue(ref(database, "market/transactions"), async (snapshot) => {
        const transactions = snapshot.val();
        const activeChats = new Set();
        const chatMetadata = {};
        if (transactions) {
            Object.entries(transactions).forEach(([tKey, tData]) => {
                if (tData.buyerUID === currentUID || tData.sellerUID === currentUID) {
                    const partnerUID = tData.buyerUID === currentUID ? tData.sellerUID : tData.buyerUID;
                    const cKey = getChatKey(tData.buyerUID, tData.sellerUID);
                    activeChats.add(cKey);
                    chatMetadata[cKey] = { partnerUID, transactionKey: tKey, data: tData };
                }
            });
        }
        chatListContainer.innerHTML = "";
        if (activeChats.size === 0) {
            chatListContainer.innerHTML = '<p class="no-chats-message">Немає активних чатів.</p>';
            return;
        }
        for (const cKey of activeChats) {
            const meta = chatMetadata[cKey];
            const name = await fetchUsername(meta.partnerUID);
            const role = meta.data.buyerUID === meta.partnerUID ? "Покупець" : "Продавець";
            const item = document.createElement("div");
            item.className = "chat-list-item";
            item.style.display = "flex";
            item.style.alignItems = "center";
            item.style.justifyContent = "space-between";
            item.innerHTML = `
                <div style="display:flex; flex-direction:column; flex-grow:1;">
                    <div class="chat-name">${name}</div>
                    <small class="chat-status">${role}</small>
                </div>
                <div id="badge-${cKey}" class="unread-badge" style="display:none;">0</div>
            `;
            item.onclick = () => openChat(cKey, meta.partnerUID);
            chatListContainer.appendChild(item);
            listenForUnreadCount(cKey);
        }
        chatListPanel.style.display = "flex";
    });
}
function openChat(chatKey, partnerUID) {
    localStorage.setItem(`lastRead_${currentUID}_${chatKey}`, Date.now());
    const badgeElement = document.getElementById(`badge-${chatKey}`);
    if (badgeElement) badgeElement.style.display = "none";
    activeChatKey = chatKey;
    activeChatPartnerUID = partnerUID;
    chatListPanel.style.display = "none";
    chatView.style.display = "flex";
    fetchUsername(partnerUID).then(name => currentChatTitle.textContent = name);
    const chatMessagesRef = ref(database, "market/chats/" + chatKey);
    onValue(chatMessagesRef, (snapshot) => {
        if (activeChatKey === chatKey) {
            localStorage.setItem(`lastRead_${currentUID}_${chatKey}`, Date.now());
        }
        messagesContainer.innerHTML = "";
        const data = snapshot.val();
        if (data) {
            const fragment = document.createDocumentFragment();
            Object.values(data).sort((a, b) => a.timestamp - b.timestamp).forEach(msg => {
                const bubble = document.createElement("div");
                bubble.className = "message-bubble";
                if (msg.senderUID === "SYSTEM") {
                    bubble.classList.add("system");
                    bubble.innerHTML = `<span class="system-text">${msg.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</span>`;
                } else {
                    const isOut = msg.senderUID === currentUID;
                    bubble.classList.add(isOut ? "outgoing" : "incoming");
                    bubble.innerHTML = `<div><div class="message-text">${msg.text}</div><div class="message-info">${new Date(msg.timestamp).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}</div></div>`;
                }
                fragment.appendChild(bubble);
            });
            messagesContainer.appendChild(fragment);
        }
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
    checkTransactionStatus(chatKey);
    messageInput.disabled = false;
    sendButton.disabled = false;
}
function sendMessage() {
    const text = messageInput.value.trim();
    if (text && activeChatKey) {
        const now = Date.now();
        push(ref(database, "market/chats/" + activeChatKey), {
            senderUID: currentUID,
            senderName: currentUsername,
            text: text,
            timestamp: now
        }).then(() => {
            messageInput.value = "";
            localStorage.setItem(`lastRead_${currentUID}_${activeChatKey}`, Date.now());
        });
    }
}
function checkTransactionStatus(chatKey) {
    confirmPaymentButtonContainer.innerHTML = "";
    confirmPaymentButtonContainer.style.display = "none";
    get(ref(database, "market/transactions")).then(snapshot => {
        const all = snapshot.val();
        if (!all) return;
        const relevant = Object.entries(all)
            .filter(([k, v]) => getChatKey(v.buyerUID, v.sellerUID) === chatKey)
            .sort((a, b) => b[1].timestamp - a[1].timestamp);
        if (relevant.length > 0) {
            const [tKey, tData] = relevant[0];
            if (tData.sellerUID === currentUID) {
                const labels = {
                    awaiting_delivery: "<strong>Очікування підтвердження покупцем...</strong>",
                    delivery_confirmed: "Товар отримано. Очікування оплати...",
                    confirmed: "Транзакція завершена."
                };
                if (labels[tData.paymentStatus]) displayStatusMessage(labels[tData.paymentStatus]);
            } else if (tData.buyerUID === currentUID) {
                if (tData.paymentStatus === "awaiting_delivery") {      displayBuyerConfirmDeliveryButton(tKey);
                } else {
                    displayBuyerPayButton({ ...tData, key: tKey });
                }
            }
        }
    });
}

function displayStatusMessage(msg) {
    confirmPaymentButtonContainer.innerHTML = `<p class="chat-status-message">${msg}</p>`;
    confirmPaymentButtonContainer.style.display = "flex";
}

function displayBuyerConfirmDeliveryButton(tKey) {
    confirmPaymentButtonContainer.innerHTML = '<p class="chat-status-message">⚠️ Підтвердіть отримання товару.</p>';
    const btn = document.createElement("button");
    btn.className = "confirm-payment-btn";
    btn.textContent = "Я отримав товар";
    btn.style.backgroundColor = "var(--warning-text)";
    btn.onclick = async () => {
        try {
            await update(ref(database), { [`market/transactions/${tKey}/paymentStatus`]: "delivery_confirmed" });
            push(ref(database, "market/chats/" + activeChatKey), {
                senderUID: "SYSTEM",
                text: "Покупець підтвердив отримання товару!",
                timestamp: Date.now()
            });
            checkTransactionStatus(activeChatKey);
        } catch (e) { console.error(e); }
    };
    confirmPaymentButtonContainer.appendChild(btn);
    confirmPaymentButtonContainer.style.display = "flex";
}

function displayBuyerPayButton(t) {
    const total = (t.pricePerUnit || 0) * (t.quantity || 0);
    const isDone = t.paymentStatus === "confirmed";
    const btn = document.createElement("button");
    btn.className = isDone ? "status-confirmed" : "confirm-payment-btn";
    btn.textContent = isDone ? "ОПЛАЧЕНО" : `Оплатити ${total.toFixed(2)}€`;
    btn.disabled = isDone;
    if (!isDone) btn.onclick = () => window.location.href = `transfer.html?key=${t.key}&amount=${total}`;
    confirmPaymentButtonContainer.appendChild(btn);
    confirmPaymentButtonContainer.style.display = "flex";
}

// Події кнопок
sendButton.onclick = (e) => { e.preventDefault(); sendMessage(); };
messageInput.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

chatHeaderBack.onclick = () => {
    // При виході з чату ще раз фіксуємо час, щоб у списку не було бейджа
    if (activeChatKey) {
        localStorage.setItem(`lastRead_${currentUID}_${activeChatKey}`, Date.now());
    }
    chatView.style.display = "none";
    chatListPanel.style.display = "flex";
    confirmPaymentButtonContainer.style.display = "none";
    activeChatKey = null;
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUID = user.uid;
        currentUsername = await fetchUsername(user.uid);
        authMessage.style.display = "none";
        loadChatList();
    } else {
        currentUID = null;
        authMessage.textContent = "Авторизуйтесь для доступу.";
        authMessage.style.display = "block";
        chatListPanel.style.display = "none";
        chatView.style.display = "none";
    }
});
