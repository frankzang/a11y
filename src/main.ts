import "./style.css";
import clampNumber from "./utils/clampNumber";
import percentToValue from "./utils/percentToValue";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div id="slider" class="slider">
    <div id="progress" class="progress"></div>
    <div id="thumb" class="thumb" tabindex="0"></div>
  </div>
`;

type SliderOptions = {
  min: number;
  max: number;
  defaultValue?: number;
  step?: number;
};

type SomePointerEvent = MouseEvent | TouchEvent;

class Slider {
  #min: number;
  #max: number;
  #step: number;
  #defaultValue: number;
  #progressValue: number;

  #sliderContainer: HTMLDivElement;
  #progress: HTMLDivElement;
  #thumb: HTMLDivElement;

  constructor({ min, max, step, defaultValue }: SliderOptions) {
    this.#min = min;
    this.#max = max;
    this.#defaultValue = defaultValue || 0;
    this.#progressValue = 0;
    this.#step = this.#calcStepValue(step, max);

    this.#sliderContainer = document.querySelector<HTMLDivElement>("#slider")!;
    this.#progress = document.querySelector<HTMLDivElement>("#progress")!;
    this.#thumb = document.querySelector<HTMLDivElement>("#thumb")!;

    this.#initDefaultValue();
    this.#initEventListeners();
  }

  get value() {
    const totalValue = Math.floor(
      // transform our value to percentage to calculate the real output value
      percentToValue(this.#progressValue, this.#min, this.#max)
    );

    const step = this.#step * 100;

    return clampNumber(
      Math.floor(totalValue / step) * step,
      this.#min,
      this.#max
    );
  }

  #calcStepValue = (step = 1, max: number) => {
    return (step > 0 ? step : 1) / max;
  };

  #updateProgressValue = (newValue: number) => {
    const minValue = this.#min / this.#max;

    this.#progressValue = clampNumber(newValue, minValue, 1);
  };

  #initDefaultValue = () => {
    const value = this.#defaultValue / this.#max;

    this.#updateProgressValue(value);
    this.#moveSlider();
  };

  #initEventListeners = () => {
    this.#sliderContainer.addEventListener("mousedown", this.#onMouseDown);
    this.#sliderContainer.addEventListener("touchstart", this.#onTouchStart);
    this.#sliderContainer.addEventListener("click", this.#onClick);
    this.#thumb.addEventListener("keydown", this.#onKeyDown);
  };

  #onClick = (evt: MouseEvent) => {
    this.#onInteraction(evt);
  };

  #onMouseDown = (evt: MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();

    document.addEventListener("mousemove", this.#onMouseMove);
    document.addEventListener("mouseup", this.#onMouseUp);
  };

  #onMouseMove = (evt: MouseEvent) => {
    this.#onInteraction(evt);
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
    this.#onInteraction(evt);
  };

  #onTouchEnd = () => {
    document.removeEventListener("touchmove", this.#onTouchMove);
    document.removeEventListener("touchend", this.#onTouchEnd);
  };

  #onKeyDown = (evt: KeyboardEvent) => {
    const code = evt.key;
    const minValue = this.#min / this.#max;
    const greaterStep = this.#getGreaterStepValue();
    let newValue = this.#progressValue;

    switch (code) {
      case "ArrowUp":
      case "ArrowRight":
        newValue += this.#step;
        break;

      case "ArrowDown":
      case "ArrowLeft":
        newValue -= this.#step;
        break;

      case "Home":
        newValue = (minValue / this.#step) * this.#step;
        break;

      case "End":
        newValue = 1;
        break;

      case "PageUp":
        newValue += greaterStep;
        break;

      case "PageDown":
        newValue -= greaterStep;
        break;

      default:
        break;
    }

    this.#updateProgressValue(newValue);
    this.#moveSlider();
  };

  #getGreaterStepValue = () => {
    const maxAdditional = 0.1;
    if (this.#step < maxAdditional) return maxAdditional;

    return this.#step;
  };

  #getInteractionCoords = (evt: SomePointerEvent) => {
    if (evt instanceof MouseEvent) return evt.pageX;

    if (evt instanceof TouchEvent) return evt.changedTouches[0].pageX;

    return 0;
  };

  #onInteraction = (evt: SomePointerEvent) => {
    const { width, left } = this.#sliderContainer.getBoundingClientRect();
    const startX = this.#getInteractionCoords(evt) - left;
    const movedProgress = startX / (width - 10);

    this.#updateProgressValue(movedProgress);
    this.#moveSlider();
  };

  #moveSlider = () => {
    const filledValue = Math.floor(this.#progressValue * 100);
    const step = this.#step * 100;
    const stepedProgress = Math.floor(filledValue / step) * step;

    this.#progress.style.width = `${stepedProgress}%`;
    this.#thumb.style.left = `${stepedProgress}%`;
  };
}

new Slider({ min: 0, max: 100, step: 1, defaultValue: 5 });
