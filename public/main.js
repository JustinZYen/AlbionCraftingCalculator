"use strict";
import { ItemData } from "./item-data.js";
import { displayRecipes } from "./display.js";
import { names } from "./external-data.js";
const itemData = new ItemData();
document.getElementById("load-price-button")?.addEventListener("click", loadPriceProcedure);
$("#city-selector").on("change", async () => {
    await loadPriceProcedure();
    console.log($("#city-selector").val());
});
$("#date-selector").on("change", async () => {
    await loadPriceProcedure();
    console.log($("#date-selector").is(":checked"));
});
$("#recipes-area").on("click", "div figure", function (event) {
    console.log("click");
    event.stopPropagation();
});
$("#recipes-area").on("click", "div", function () {
    //const currentClass = $(this).attr("id");
    $(this).find("figure").slideToggle("slow");
    $(this).find("svg").slideToggle("slow");
});
async function loadPriceProcedure() {
    const loadingInterval = displayLoadIcon();
    const input = ($("#item-name").val());
    const itemIds = ItemData.getItemIds(input);
    await itemData.getProfits(itemIds);
    displayRecipes(itemData.checkedItems, itemIds);
    hideLoadIcon(loadingInterval);
}
function displayLoadIcon() {
    const loadIcon = document.getElementById("load-icon");
    loadIcon.style.display = "block";
    let numPeriods = 1;
    return setInterval(() => {
        let loadMessage = "Loading";
        for (let i = 0; i < numPeriods; i++) {
            loadMessage += ".";
        }
        loadIcon.innerText = loadMessage;
        numPeriods = numPeriods % 3 + 1;
    }, 500);
}
function hideLoadIcon(loadingInterval) {
    const loadIcon = document.getElementById("load-icon");
    loadIcon.style.display = "none";
    loadIcon.innerText = "Loading";
    clearInterval(loadingInterval);
}
class ItemNameTrie {
    root = new TrieNode();
    insert(fullName) {
        for (const nameWord of fullName.split(" ")) {
            this.#insertWord(nameWord, fullName);
        }
    }
    #insertWord(nameWord, fullName) {
        let current = this.root;
        for (const character of nameWord) {
            const c = character.toLowerCase();
            if (c.match(/[a-zA-Z0-9]/)) {
                if (!current.children.has(c)) {
                    current.children.set(c, new TrieNode());
                }
                current = current.children.get(c);
            }
        }
        current.words.add(fullName);
    }
    wordsThatMatch(fullInput) {
        let matchingWords = new Set();
        const inputWords = fullInput.split(" ");
        let index = 0;
        for (; index < inputWords.length; index++) {
            if (inputWords[index].length > 0) {
                matchingWords = this.#wordsThatMatchWord(inputWords[index]);
                index++;
                break;
            }
        }
        for (; index < inputWords.length; index++) {
            if (inputWords[index].length > 0) {
                matchingWords = matchingWords.intersection(this.#wordsThatMatchWord(inputWords[index]));
            }
        }
        return matchingWords;
    }
    #wordsThatMatchWord(nameWord) {
        let current = this.root;
        for (const character of nameWord) {
            const c = character.toLowerCase();
            if (c.match(/[a-zA-Z0-9]/)) {
                if (!current.children.has(c)) {
                    return new Set();
                }
                else {
                    current = current.children.get(c);
                }
            }
        }
        let matchingWords = new Set();
        const nodesToAddFrom = [current];
        while (nodesToAddFrom.length > 0) {
            const currentNode = nodesToAddFrom.pop();
            matchingWords = matchingWords.union(currentNode.words);
            for (const [_, child] of currentNode.children) {
                nodesToAddFrom.push(child);
            }
        }
        return matchingWords;
    }
}
class TrieNode {
    children = new Map();
    words = new Set(); // Full name of item names that contain this node as the final letter in one of their words
}
const itemNameTrie = new ItemNameTrie();
for (const name of names) {
    itemNameTrie.insert(name);
}
// Event listener for changes in the item name input field
document.getElementById("item-name").addEventListener("input", async () => {
    const enteredName = document.getElementById("item-name")?.value;
    document.getElementById("item-name-autocomplete").innerHTML = "";
    const matchingWords = itemNameTrie.wordsThatMatch(enteredName);
    for (const word of matchingWords) {
        const wordElement = document.createElement("li");
        wordElement.innerText = word;
        document.getElementById("item-name-autocomplete")?.appendChild(wordElement);
    }
});
// Event listener for clicks on the options in the autocomplete dropdown
document.getElementById("item-name-autocomplete").addEventListener("click", (e) => {
    console.log("CLICK");
    console.log(e.target.innerText);
    document.getElementById("item-name").value = e.target.innerText;
});
