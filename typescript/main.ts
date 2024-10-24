"use strict";
import { ItemData } from "./item-data.js";
import { displayRecipes } from "./display.js";
import {names} from "./external-data.js";


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
    document.getElementById("recipes-area")!.innerHTML = "";
    const input: string = ($("#item-name").val()) as string;
    const itemIds = ItemData.getItemIds(input);
    document.getElementById("load-icon")!.style.display = "block";
    await itemData.getProfits(itemIds);
    displayRecipes(itemData.checkedItems, itemIds);
    document.getElementById("load-icon")!.style.display = "none";
}

class ItemNameTrie {
    root = new TrieNode();

    insert(fullName:string) {
        for (const nameWord of fullName.split(" ")) {
            this.#insertWord(nameWord,fullName);
        }
    }

    #insertWord(nameWord:string,fullName:string) {
        let current = this.root;
        for (const character of nameWord) {
            const c = character.toLowerCase();
            if (c.match(/[a-zA-Z0-9]/)) {
                if (!current.children.has(c)) {
                    current.children.set(c,new TrieNode());
                }
                current = current.children.get(c)!;
            }
        }
        current.words.add(fullName);
    }

    wordsThatMatch(fullInput:string) {
        let matchingWords = new Set<string>();
        const inputWords = fullInput.split(" ");
        let index = 0;
        for (;index < inputWords.length; index++) {
            if (inputWords[index]!.length > 0) {
                matchingWords = this.#wordsThatMatchWord(inputWords[index]!);
                index++;
                break;
            }
        }
        for (;index < inputWords.length; index++) {
            if (inputWords[index]!.length > 0) {
                matchingWords = matchingWords.intersection(this.#wordsThatMatchWord(inputWords[index]!));
            }
        }
        return matchingWords;
    }

    #wordsThatMatchWord(nameWord:string) {
        let current = this.root;
        for (const character of nameWord) {
            const c = character.toLowerCase();
            if (c.match(/[a-zA-Z0-9]/)) {
                if (!current.children.has(c)) {
                    return new Set<string>();
                } else {
                    current = current.children.get(c)!;
                }
            }
        }
        let matchingWords = new Set<string>();
        const nodesToAddFrom = [current];
        while (nodesToAddFrom.length > 0) {
            const currentNode = nodesToAddFrom.pop()!;
            matchingWords = matchingWords.union(currentNode.words);
            for (const [_,child] of currentNode.children) {
                nodesToAddFrom.push(child);
            }
        }
        return matchingWords;
    }
}

class TrieNode {
    children = new Map<string,TrieNode>();
    words = new Set<string>(); // Full name of item names that contain this node as the final letter in one of their words
}

const itemNameTrie = new ItemNameTrie();
for (const name of names) {
    itemNameTrie.insert(name);
}

// Event listener for changes in the item name input field
document.getElementById("item-name")!.addEventListener("input",async ()=>{
    const enteredName = (<HTMLInputElement>document.getElementById("item-name"))?.value;
    document.getElementById("item-name-autocomplete")!.innerHTML = "";
    const matchingWords = itemNameTrie.wordsThatMatch(enteredName);
    for (const word of matchingWords) {
        const wordElement = document.createElement("li");
        wordElement.innerText = word;
        document.getElementById("item-name-autocomplete")?.appendChild(wordElement);
    }
});

// Event listener for clicks on the options in the autocomplete dropdown
document.getElementById("item-name-autocomplete")!.addEventListener("click",(e)=>{
    console.log("CLICK");
    console.log((<HTMLElement>e.target).innerText);
    (<HTMLInputElement>document.getElementById("item-name"))!.value = (<HTMLElement>e.target).innerText;
})
