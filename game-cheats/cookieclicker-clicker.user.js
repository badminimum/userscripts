// ==UserScript==
// @name        Cookie Clicker - Auto Clicker
// @namespace   Game Cheats by badminimum
// @version     1.0.0
//
// @match       https://orteil.dashnet.org/cookieclicker/*
// @grant       none
//
// @author      badminimum
// @description Clicks the big cookie for you, buys upgrades and products. Comes with a small UI.
// @license     MIT
// ==/UserScript==
const cookieButton = document.getElementById("bigCookie");

class Clicker {
  #panel;
  #timeout;
  #running;

  constructor() {
    this.#panel = new ClickerPanel();
    this.#timeout = new ClickerTimeout(this.#panel.getInstance());
    this.#running = new ClickerButton(this.#panel.getInstance(), this.#filterClickElementsAndSleep.bind(this), this.#sleepWithTimeoutMs.bind(this));

    cookieButton.addEventListener("click", async () => {
      if (this.#running.isRunning()) return;
      this.#running.startLoops();
    });

    this.#panel.addToDOM();
  }

  async #filterClickElementsAndSleep(sectionId, classes) {
    const elements = [...document.getElementById(sectionId).children];
    if (elements.length < 1) return;

    for (const element of elements) {
      if (!classes.every(clazz => element.classList.contains(clazz))) continue;

      element.click();
      await this.#sleepWithTimeoutMs();
    }
  }

  #sleepWithTimeoutMs() {
    return new Promise(resolve => setTimeout(resolve, this.#timeout.getTimeoutMs()));
  }
}

class ClickerPanel {
  #id = "clicker_panel";
  #css = `
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 9999999;
    background: linear-gradient(145deg, #2a2a2a, #1c1c1c);
    color: #f0e6d2;
    padding: 14px 16px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08);
    border: 1px solid #3d3d3d;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 220px;
    user-select: none;
    cursor: grab;
  `.replace(/\s+/g, ' ').trim();

  #instance;
  #isDragging = false;
  #offsetX = 0;
  #offsetY = 0;

  constructor() {
    this.#instance = document.createElement("div");
    this.#instance.id = this.#id;
    this.#instance.style.cssText = this.#css;

    // Drag handling
    this.#instance.addEventListener("mousedown", (e) => {
      // Don't start drag when interacting with controls
      if (e.target.closest("button, input, select, textarea, a")) return;

      this.#isDragging = true;
      const rect = this.#instance.getBoundingClientRect();
      this.#offsetX = e.clientX - rect.left;
      this.#offsetY = e.clientY - rect.top;
      this.#instance.style.cursor = "grabbing";
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.#isDragging) return;
      this.#instance.style.left = `${e.clientX - this.#offsetX}px`;
      this.#instance.style.top = `${e.clientY - this.#offsetY}px`;
    });

    document.addEventListener("mouseup", () => {
      if (!this.#isDragging) return;
      this.#isDragging = false;
      this.#instance.style.cursor = "grab";
    });

    const style = document.createElement('style');
    style.textContent = `
      /* ===== Button ===== */
      #clicker_button {
        transition: transform 0.1s ease, box-shadow 0.1s ease, filter 0.15s ease;
      }

      #clicker_button:hover {
        filter: brightness(1.08);
        box-shadow: 0 4px 0 #8a5510, 0 6px 16px rgba(0,0,0,0.35);
      }

      #clicker_button:active {
        transform: translateY(2px);
        box-shadow: 0 1px 0 #8a5510, 0 2px 6px rgba(0,0,0,0.3);
        filter: brightness(0.95);
      }

      #clicker_button:focus-visible {
        outline: none;
        box-shadow: 0 3px 0 #8a5510, 0 4px 12px rgba(0,0,0,0.3), 0 0 0 3px rgba(232, 168, 56, 0.45);
      }

      /* ===== Number input ===== */
      #clicker_timeout {
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      }

      #clicker_timeout:hover {
        border-color: #666;
        background: #1a1a1a;
      }

      #clicker_timeout:focus {
        outline: none;
        border-color: #e8a838;
        background: #1a1a1a;
        box-shadow: 0 0 0 3px rgba(232, 168, 56, 0.28);
      }

      /* Optional: nicer number spinner (Chrome/Edge) */
      #clicker_timeout::-webkit-inner-spin-button,
      #clicker_timeout::-webkit-outer-spin-button {
        opacity: 0.6;
        filter: invert(1) brightness(1.2);
      }
    `;
    document.head.appendChild(style);
  }

  getInstance() {
    return this.#instance;
  }
  addToDOM() {
    document.body.appendChild(this.#instance);
  }
}

class ClickerButton {
  #id = "clicker_button";
  #startText = "Start the clicking!";
  #stopText = "Stop the clicking :(";
  #css = `
    appearance: none;
    background: linear-gradient(180deg, #e8a838, #c47a1a);
    color: #1a1208;
    border: none;
    border-radius: 8px;
    padding: 10px 16px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 3px 0 #8a5510, 0 4px 12px rgba(0,0,0,0.3);
    transition: transform 0.1s, box-shadow 0.1s;
    letter-spacing: 0.3px;
  `.replace(/\s+/g, ' ').trim();

  #instance;
  #running = false;
  #fceas;
  #swt;

  constructor(panel, filterClickElementsAndSleep, sleepWithTimeoutMs) {
    this.#fceas = filterClickElementsAndSleep;
    this.#swt = sleepWithTimeoutMs;
    this.#instance = document.createElement("button");
    this.#instance.id = this.#id;
    this.#instance.style.cssText = this.#css;
    this.updateText();
    this.#instance.onclick = () => {
      if (this.#running) this.stopLoops();
      else this.startLoops();
    };

    panel.appendChild(this.#instance);
  }

  updateText() {
    this.#instance.innerText = !this.#running ? this.#startText : this.#stopText;
  }

  getInstance() {
    return this.#instance;
  }
  isRunning() {
    return this.#running;
  }
  startLoops() {
    this.#running = true;
    this.updateText();

    (async () => {
      while (this.#running) {
        cookieButton.click();
        await this.#swt();
      }
    })();

    (async () => {
      while (this.#running) {
        await Promise.allSettled([
          this.#fceas("upgrades", ["upgrade", "enabled"]),
          this.#fceas("products", ["product", "unlocked", "enabled"])
        ]);
        await this.#swt();
      }
    })();
  }
  stopLoops() {
    this.#running = false;
    this.updateText();
  }
}

class ClickerTimeout {
  #id = "clicker_timeout";
  #wrapperId = "clicker_timeout_wrapper";

  #css = `
    appearance: none;
    background: transparent;
    color: #f0e6d2;
    border: none;
    padding: 9px 36px 9px 12px;
    font-size: 14px;
    width: 100%;
    box-sizing: border-box;
    outline: none;
  `.replace(/\s+/g, ' ').trim();

  #wrapperCss = `
    position: relative;
    background: #161616;
    border: 1px solid #444;
    border-radius: 8px;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  `.replace(/\s+/g, ' ').trim();

  #instance;
  #wrapperInstance;
  #defaultTimeoutMs = 150;
  #timeoutMs = this.#defaultTimeoutMs;

  constructor(panel) {
    this.#wrapperInstance = document.createElement("div");
    this.#wrapperInstance.id = this.#wrapperId;
    this.#wrapperInstance.style.cssText = this.#wrapperCss;

    this.#instance = document.createElement("input");
    this.#instance.id = this.#id;
    this.#instance.style.cssText = this.#css;
    this.#instance.setAttribute("type", "number");
    this.#instance.min = 100;
    this.#instance.step = 10;
    this.#instance.value = this.#defaultTimeoutMs;
    this.#instance.placeholder = `Enter a timeout in milliseconds (default: ${this.#defaultTimeoutMs}ms)`;
    this.#instance.addEventListener("change", async () => {
      const prev = this.#timeoutMs;
      this.#timeoutMs = this.#instance.valueAsNumber || this.#defaultTimeoutMs;
      console.log(`Change clicking timeout from ${prev}ms to ${this.#timeoutMs}ms`)
    });

    const suffix = document.createElement("span");
    suffix.textContent = "ms";
    suffix.style.cssText = `
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #888;
      font-size: 13px;
      pointer-events: none;
      user-select: none;
    `.replace(/\s+/g, ' ').trim();

    this.#wrapperInstance.append(this.#instance, suffix);
    panel.appendChild(this.#wrapperInstance);
  }

  getInstance() {
    return this.#instance;
  }
  getTimeoutMs() {
    return this.#timeoutMs;
  }
}

new Clicker();
