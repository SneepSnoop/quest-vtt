import { ItemSheetQuest } from "./base.js";
import { getItem } from "../../quest-helpers.js";

/**
 * An Item sheet for option type items in the Quest system.
 * Extends the base ItemSheetQuest class.
 * @type {ItemSheetQuest}
 */
export class EffectSheetQuest extends ItemSheetQuest {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      width: 460,
      height: "auto",
      classes: ["quest", "sheet", "item", "effect"],
      resizable: false,
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const data = super.getData();

    data.displayRanges = await this._getRanges(data.data.ranges);

    return data;
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers
  /* -------------------------------------------- */

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
    if (!game.user.isGM) return;

    html.find(".item-delete").click(this._onDeleteItem.bind(this));

    const ranges = document.getElementById("ranges");

    ranges.addEventListener("dragover", this._onDragOver.bind(this), false);
    ranges.addEventListener("drop", this._onDrop.bind(this), false);
    ranges.addEventListener("dragenter", this._onDragEnter.bind(this), false);
    ranges.addEventListener("dragleave", this._onDragLeave.bind(this), false);
    ranges.addEventListener("dragend", this._onDragEnd.bind(this), false);
  }

  async _onDragItemStart(event) {
    event.stopPropagation();
    const itemId = Number(event.currentTarget.dataset.itemId);
    let item = items.find((i) => i._id === itemId);
    item = duplicate(item);
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        type: "Item",
        data: item,
      })
    );
  }

  async _onDrop(event) {
    event.preventDefault();
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));

      if (!this.item) return false;

      let updateData = duplicate(this.item.data);
      if (this.item.data.type === "effect") {
        let gameItem = game.items.get(data.id);

        if ((data.pack && data.pack === "quest-basics.ranges") || gameItem) {
          updateData.data.ranges.push(data.id);
          await this.item.update(updateData);
        }
      }
    } catch (err) {
      console.log("Quest Items | drop error");
      console.log(event.dataTransfer.getData("text/plain"));
      console.log(err);
    } finally {
      event.target.classList.remove("hover");
      return false;
    }
  }

  _onDragEnd(event) {
    event.preventDefault();
    return false;
  }
  _onDragOver(event) {
    event.preventDefault();
    return false;
  }

  _onDragEnter(event) {
    event.preventDefault();
    if (event.target.className === "adder") {
      event.target.classList.add("hover");
    }
    return false;
  }

  _onDragLeave(event) {
    event.preventDefault();
    if (event.target.className === "adder hover") {
      event.target.classList.remove("hover");
    }
    return false;
  }

  async _getRanges(ranges) {
    let displayRanges = [];

    for (let i = 0; i < ranges.length; i++) {
      let id = ranges[i];

      let range = await getItem(id, "range");

      let newRange = {
        name: range.data.name,
        id: range._id
      };

      displayRanges.push(newRange);
    }

    return displayRanges;
  }

  async _onDeleteItem(event) {
    event.preventDefault();

    let updateData = duplicate(this.item.data);
    const rangeId = Number(event.currentTarget.closest(".item").dataset.itemId);
    updateData.data.ranges.splice(rangeId, 1);

    await this.item.update(updateData);
    this.render(true);
    return false;
  }
}
