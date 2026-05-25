// 1. I-import ang gikinahanglan nga Firebase functions gikan sa CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Imong tinuod nga Firebase Configuration gikan sa screenshot
const firebaseConfig = {
    apiKey: "AIzaSyBrDrxq48K5eo4vRbE03vLSLxtSPWisuP4",
    authDomain: "zombie-survivor-game.firebaseapp.com",
    projectId: "zombie-survivor-game",
    storageBucket: "zombie-survivor-game.firebasestorage.app",
    messagingSenderId: "128616881258",
    appId: "1:128616881258:web:dc97d2e82c0baa2beebe13",
    measurementId: "G-VCG57EKBPY"
};

// 3. I-initialize ang Firebase ug ang Firestore Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// REQUIREMENT: CREATE OPERATION (Save Score)
// ==========================================
export async function savePlayerScore(playerName, score) {
    try {
        const docRef = await addDoc(collection(db, "leaderboard"), {
            name: playerName,
            score: parseInt(score),
            timestamp: new Date()
        });
        console.log("Score successfully saved with ID: ", docRef.id);
        return true;
    } catch (error) {
        console.error("Error adding score: ", error);
        return false;
    }
}

// ==========================================
// REQUIREMENT: READ OPERATION (Get Top 5 Scores)
// ==========================================
export async function getTopScores() {
    try {
        const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(5));
        const querySnapshot = await getDocs(q);
        
        let scoresList = [];
        querySnapshot.forEach((doc) => {
            scoresList.push(doc.data());
        });
        
        return scoresList;
    } catch (error) {
        console.error("Error reading scores: ", error);
        return [];
    }
}
