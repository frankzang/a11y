import "./style.css";
import clampNumber from "./utils/clampNumber";
import percentToValue from "./utils/percentToValue";

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
  value?: number;
  step?: number;
};

class Slider {
  #min: number;
  #max: number;
  #step: number;
  #value: number;

  #sliderContainer: HTMLDivElement;
  #progress: HTMLDivElement;
  #thumb: HTMLDivElement;

  constructor({ min, max, step, value }: Options) {
    this.#min = min;
    this.#max = max;
    this.#value = value || 0;
    this.#step = this.#calcStepValue(step, max);

    this.#sliderContainer = document.querySelector<HTMLDivElement>("#slider")!;
    this.#progress = document.querySelector<HTMLDivElement>("#progress")!;
    this.#thumb = document.querySelector<HTMLDivElement>("#thumb")!;

    this.#initEventListeners();
  }

  #calcStepValue = (step = 1, max: number) => {
    return (step / max) * 100;
  }

  #initEventListeners = () => {
    this.#sliderContainer.addEventListener("mousedown", this.#onMouseDown);
    this.#sliderContainer.addEventListener("touchstart", this.#onTouchStart);
  };

  #onMouseDown = (evt: MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();

    document.addEventListener("mousemove", this.#onMouseMove);
    document.addEventListener("mouseup", this.#onMouseUp);
  };

  #onMouseMove = (evt: MouseEvent) => {
    const { width, left } = this.#sliderContainer.getBoundingClientRect();
    const startX = evt.pageX - left;

    const movedProgress = Math.floor((startX / width) * 100);
    const clampedProgress = clampNumber(movedProgress, 0, 100);
    const stepedValue = Math.floor(clampedProgress / this.#step) * this.#step;

    const filledPercent = stepedValue;

    this.#value = percentToValue(filledPercent / 100, this.#min, this.#max);

    this.#progress.style.width = `${filledPercent}%`;
    this.#thumb.style.left = `${filledPercent}%`;
  };

  #onMouseUp = () => {    
    document.removeEventListener("mousemove", this.#onMouseMove);
    document.removeEventListener("mouseup", this.#onMouseUp);
  };

  #onTouchStart = (evt: TouchEvent) => {
    evt.preventDefault();
    evt.stopPropagation();

    document.addEventListener("touchmove", this.#onTouchMove);
    document.addEventListener("touchend", this.#onTouchEnd);
  }

  #onTouchMove = (evt: TouchEvent) => {
    const { width, left } = this.#sliderContainer.getBoundingClientRect();
    const startX = evt.changedTouches[0].pageX - left;

    const movedProgress = Math.floor((startX / width) * 100);
    const clampedProgress = clampNumber(movedProgress, 0, 100);
    const stepedValue = Math.floor(clampedProgress / this.#step) * this.#step;

    const filledPercent = stepedValue;

    this.#value = percentToValue(filledPercent / 100, this.#min, this.#max);

    this.#progress.style.width = `${filledPercent}%`;
    this.#thumb.style.left = `${filledPercent}%`;
  }

  #onTouchEnd = () => {
    document.removeEventListener("touchmove", this.#onTouchMove);
    document.removeEventListener("touchend", this.#onTouchEnd);
  }
}

new Slider({ min: 0, max: 100, step: 20 });
