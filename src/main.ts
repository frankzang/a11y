import "./style.css";
import clampNumber from "./utils/clampNumber";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div id="slider" class="slider">
    <div id="progress" class="progress"></div>
    <div id="thumb" class="thumb"></div>
  </div>
`;

type Options = {
  min: number;
  max: number;
  step?: number;
};

class Slider {
  #min: number;
  #max: number;
  #step: number;

  #sliderContainer: HTMLDivElement;
  #progress: HTMLDivElement;
  #thumb: HTMLDivElement;

  constructor({ min, max, step }: Options) {
    this.#min = min;
    this.#max = max;
    this.#step = step || 1;

    this.#sliderContainer = document.querySelector<HTMLDivElement>("#slider")!;
    this.#progress = document.querySelector<HTMLDivElement>("#progress")!;
    this.#thumb = document.querySelector<HTMLDivElement>("#thumb")!;

    this.#initEventListeners();
  }

  get #sliderRect() {
    return this.#sliderContainer.getBoundingClientRect();
  }

  #initEventListeners = () => {
    this.#sliderContainer.addEventListener("mousedown", this.#onMouseDown);
  };

  #onMouseDown = (evt: MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();

    document.addEventListener("mousemove", this.#onMouseMove);
    document.addEventListener("mouseup", this.#onMouseUp);
  };

  #onMouseMove = (evt: MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();

    const { width, left } = this.#sliderRect;
    const startX = evt.pageX - left;

    const movedProgress = Math.floor((startX / width) * 100);
    const clampedProgress = clampNumber(movedProgress, 0, 100);

    this.#progress.style.width = `${clampedProgress}%`;
    this.#thumb.style.left = `${clampedProgress}%`;
  };

  #onMouseUp = () => {
    document.removeEventListener("mousemove", this.#onMouseMove);
  };
}

new Slider({ min: 0, max: 50, step: 20 });
