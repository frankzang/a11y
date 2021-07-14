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

  get value() {
    const totalValue = Math.floor(
      percentToValue(this.#value, this.#min, this.#max)
    );

    return clampNumber(totalValue, this.#min, this.#max);
  }

  #calcStepValue = (step = 1, max: number) => {
    if (step < 1) return 1 / max;

    return step / max;
  };

  #initEventListeners = () => {
    this.#sliderContainer.addEventListener("mousedown", this.#onMouseDown);
    this.#sliderContainer.addEventListener("touchstart", this.#onTouchStart);
    this.#sliderContainer.addEventListener("click", this.#onClick);
  };

  #onClick = (evt: MouseEvent) => {
    const startX = evt.pageX;
    this.#move(startX);
  };

  #onMouseDown = (evt: MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();

    document.addEventListener("mousemove", this.#onMouseMove);
    document.addEventListener("mouseup", this.#onMouseUp);
  };

  #onMouseMove = (evt: MouseEvent) => {
    const startX = evt.pageX;
    this.#move(startX);
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
  };

  #onTouchMove = (evt: TouchEvent) => {
    const startX = evt.changedTouches[0].pageX;
    this.#move(startX);
  };

  #onTouchEnd = () => {
    document.removeEventListener("touchmove", this.#onTouchMove);
    document.removeEventListener("touchend", this.#onTouchEnd);
  };

  #move = (pageXOffset: number) => {
    const { width, left } = this.#sliderContainer.getBoundingClientRect();
    const startX = pageXOffset - left;

    const movedProgress = startX / (width - 10);
    const stepedProgress = Math.floor(movedProgress / this.#step) * this.#step;

    this.#value = stepedProgress;
    this.#moveSliderTo();
  };

  #moveSliderTo = () => {
    const filledValue = Math.floor(this.#value * 100);
    const clampedValue = clampNumber(filledValue, 0, 100);

    this.#progress.style.width = `${clampedValue}%`;
    this.#thumb.style.left = `${clampedValue}%`;
  };
}

new Slider({ min: 0, max: 100, step: 20 });
