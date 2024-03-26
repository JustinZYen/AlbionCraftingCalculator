import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; 
import {db} from "./firebaseScripts.js";


async function getIDFromName() {
    const document = doc(db,"Test","One");
    const result = await getDoc(document);
    alert(JSON.stringify(result));
}


function calculateProfit(itemID) {
    
}
/*
$("#my-button").on("click", () => {
    alert($("#item-name").val());
});
*/

$("#my-button").on("click", getIDFromName);
