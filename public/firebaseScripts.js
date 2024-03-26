// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDkCQTICKkqd7SQqj9ZVSen4qwlkUtV9bY",
  authDomain: "albion-project-9585a.firebaseapp.com",
  projectId: "albion-project-9585a",
  storageBucket: "albion-project-9585a.appspot.com",
  messagingSenderId: "897223201752",
  appId: "1:897223201752:web:b82536955d7eb8344dd8ad",
  measurementId: "G-243WD30YNN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
export {app, analytics,db};
