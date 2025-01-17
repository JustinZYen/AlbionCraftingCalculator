import { ItemBox } from "./ItemBox.js";
class RecipeBox {
    craftedItems = []; // The item array that this recipe is used to craft (ItemBox)
    currentBox; // The box corresponding to this recipe
    boundedItems = []; // The items that this recipebox contains
    index; // Index of recipe box to allow for quicker referencing in nodes list
    width; // Used to position the recipe box correctly inside the force directed graph (otherwise, positions based on top left corner)
    height;
    //static BOX_WIDTH = 200;
    /**
     *
     * @param {Item} craftedItem
     */
    constructor(craftedItem, container) {
        if (craftedItem != null) {
            this.craftedItems.push(craftedItem);
        }
        this.currentBox = document.createElement("div");
        this.currentBox.classList.add("recipe-box");
        container.appendChild(this.currentBox);
        const boxStyles = getComputedStyle(this.currentBox);
        this.setHeight(ItemBox.BOX_HEIGHT_PX + this.parsePX(boxStyles.borderTopWidth) + this.parsePX(boxStyles.borderBottomWidth));
        this.setWidth(this.parsePX(boxStyles.borderLeftWidth) + this.parsePX(boxStyles.borderRightWidth));
        console.log(`height: ${this.height}, width: ${this.width}`);
        this.index = -1;
    }
    insertItem(itemBox) {
        itemBox.addToRecipeBox(this.currentBox);
        this.boundedItems.push(itemBox);
        this.setWidth(this.width + ItemBox.BOX_WIDTH_PX);
    }
    setX(x) {
        this.currentBox.style.left = x + "px";
    }
    setY(y) {
        this.currentBox.style.top = y + "px";
    }
    setWidth(width) {
        this.width = width;
    }
    setHeight(height) {
        this.height = height;
    }
    getWidth() {
        return this.width;
    }
    getHeight() {
        return this.height;
    }
    parsePX(styleValue) {
        // Make sure style value really ends with a "px"
        if (styleValue.substring(styleValue.length - 2) != "px") {
            console.error(`Style value of ${styleValue} does not end with a "px" - numbers may not accurate`);
        }
        return parseFloat(styleValue.substring(0, styleValue.length - 2));
    }
}
export { RecipeBox };
