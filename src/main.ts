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
  value?: number;
  step?: number;
};

type SomePointerEvent = MouseEvent | TouchEvent;

class Slider {
  #min: number;
  #max: number;
  #step: number;
  #progressValue: number;

  #sliderContainer: HTMLDivElement;
  #progress: HTMLDivElement;
  #thumb: HTMLDivElement;

  constructor({ min, max, step, value }: SliderOptions) {
    this.#min = min;
    this.#max = max;
    this.#progressValue = value || 0;
    this.#step = this.#calcStepValue(step, max);

    this.#sliderContainer = document.querySelector<HTMLDivElement>("#slider")!;
    this.#progress = document.querySelector<HTMLDivElement>("#progress")!;
    this.#thumb = document.querySelector<HTMLDivElement>("#thumb")!;

    this.#initEventListeners();
  }

  get value() {
    const totalValue = Math.floor(
      // transform our value to percentage to calculate the real output value
      percentToValue(this.#progressValue / 100, this.#min, this.#max)
    );

    return clampNumber(
      Math.floor(totalValue / this.#step) * this.#step, this.#min, this.#max);
  }

  #calcStepValue = (step = 1, max: number) => {
    return (step > 0 ? step : 1) / max * 100;
  };

  #updateProgressValue = (newValue: number) => {
    const minValue = (this.#min / this.#max) * 100;

    this.#progressValue = clampNumber(newValue, minValue, 100);
  }

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
    const minValue = this.#min / this.#max * 100;
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
        newValue = Math.floor(minValue / this.#step) * this.#step;
        break;

      case "End":
        newValue = 100;
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
  }

  #getGreaterStepValue = () => {
    const maxAdditional = 10;
    if(this.#step < maxAdditional) return maxAdditional;

    return this.#step;
  }

  #getInteractionCoords = (evt: SomePointerEvent) => {
    if (evt instanceof MouseEvent) return evt.pageX;

    if (evt instanceof TouchEvent) return evt.changedTouches[0].pageX;

    return 0;
  };

  #onInteraction = (evt: SomePointerEvent) => {
    const { width, left } = this.#sliderContainer.getBoundingClientRect();
    const startX = this.#getInteractionCoords(evt) - left;

    const movedProgress = Math.floor(startX / (width - 10) * 100);
    const stepedProgress = Math.floor(movedProgress / this.#step) * this.#step;

    this.#updateProgressValue(stepedProgress);
    this.#moveSlider();
  };

  #moveSlider = () => {
    const filledValue = Math.floor(this.#progressValue);

    this.#progress.style.width = `${filledValue}%`;
    this.#thumb.style.left = `${filledValue}%`;

    console.log(this.value);
    
  };
}

new Slider({ min: 14, max: 100, step: 10 });
