import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; 
import {db} from "./firebaseScripts.js";


async function getIDFromName() {
    const input = $("#item-name").val();
    console.log(input);
    if (nameToID.hasOwnProperty(input)) {
        const id = nameToID[input];
        console.log(id);
        if (recipes.hasOwnProperty(id)) {
            console.log(recipes[id]);
        }
    }

}



function calculateProfit(itemID) {
    
}


// Get document of names to ids
// Get document of recipe paths
const nameToIDDoc = await getDoc(doc(db,"General/Item Data/Name Conversions/Name To ID"));
const nameToID = nameToIDDoc.data();
const recipeDoc = await getDoc(doc(db,"General/Item Data/Recipes/Recipes"));
const recipes = recipeDoc.data();
console.log(recipes);
$("#my-button").on("click", getIDFromName);
