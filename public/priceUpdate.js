import { collection, getDocs, doc, updateDoc} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; 
import { db } from "./firebaseScripts.js"

const targetDocument = doc(db,"textfiles","test");
const date = new Date(Date.now()).toDateString();
console.log(`Date: ${date}`);
await updateDoc(targetDocument, {time:date});
