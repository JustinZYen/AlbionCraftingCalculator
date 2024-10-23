"use strict";
import { ItemData } from "./item-data.js";
import { displayRecipes } from "./display.js";
class CraftTypeEnum {
    static REFINING = Symbol("Refining");
    static CRAFTING = Symbol("Crafting")
}


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
    await itemData.getProfits(itemIds);
    displayRecipes(itemData.checkedItems, itemIds);
}


class ItemNameTrie {
    root;
    constructor() {
        this.root = new TrieNode();
    }

    insert(fullName:string) {
        for (const nameWord of fullName.split(" ")) {
            this.#insertWord(nameWord,fullName);
        }
    }

    #insertWord(nameWord:string,fullName:string) {

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
        const matchingWords = new Set<string>();

        return matchingWords;
    }
}

class TrieNode {
    children:{};
    words = new Set<string>(); // Full name of item names that contain this node as the final letter in one of their words
}
document.getElementById("item-name")?.addEventListener("input",(e:InputEvent)=>{
    const enteredName = (<HTMLInputElement>document.getElementById("item-name"))?.value;
    console.log(enteredName);
});