import { collection, getDocs, doc, updateDoc} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; 
import { db } from "./firebaseScripts.js"

const targetDocument = doc(db,"textfiles","test");
await updateDoc(targetDocument, {time:Date.now()});
