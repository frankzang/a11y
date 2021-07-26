import "./style.css";
import clampNumber from "./utils/clampNumber";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div id="slider">
  </div>
  <div id="val">
  </div>
`;

type SliderOptions = {
  min: number;
  max: number;
  defaultValue?: number;
  step?: number;
  container: string;
  name?: string;
  ariaLabel?: string;
  ariaLabeledBy?: string;
  onChange?(value: number): void;
  ariaValueText?(value: number): string;
};

type SomePointerEvent = MouseEvent | TouchEvent;

class Slider {
  #min: number;
  #max: number;
  #step: number;
  #defaultValue: number;
  #progressValue: number;
  #onChange?: SliderOptions["onChange"];
  #ariaValueText?: SliderOptions["ariaValueText"];
  #name?: string;
  #ariaLabel?: string;
  #ariaLabeledBy?: string;

  #container: string;
  #slider: HTMLDivElement;
  #progress: HTMLDivElement;
  #thumb: HTMLDivElement;
  #hiddenInput?: HTMLInputElement;

  constructor({
    min,
    max,
    step,
    defaultValue,
    container,
    name,
    ariaLabel,
    ariaLabeledBy,
    onChange,
    ariaValueText,
  }: SliderOptions) {
    this.#min = min;
    this.#max = max;
    this.#defaultValue = defaultValue || 0;
    this.#progressValue = 0;
    this.#step = this.#calcStepValue(step, max);
    this.#container = container;
    this.#onChange = onChange;
    this.#ariaValueText = ariaValueText;
    this.#name = name;
    this.#ariaLabel = ariaLabel;
    this.#ariaLabeledBy = ariaLabeledBy;

    this.#slider = document.createElement("div");
    this.#progress = document.createElement("div");
    this.#thumb = document.createElement("div");

    this.#initDefaultValue();
    this.#createSlider();
    this.#initEventListeners();
  }

  get value() {
    const totalValue = this.#max * this.#progressValue;
    const step = this.#step * this.#max;    

    return Math.floor(
      clampNumber(Math.floor(totalValue / step) * step, this.#min, this.#max)
    );
  }

  #calcStepValue = (step = 1, max: number) => {
    return (step > 0 ? step : 1) / max;
  };

  #updateProgressValue = (newValue: number) => {
    const minValue = this.#min / this.#max;

    this.#progressValue = clampNumber(newValue, minValue, 1);
  };

  #createSlider = () => {
    this.#slider.classList.add("slider");
    this.#progress.classList.add("progress");
    this.#thumb.classList.add("thumb");
    this.#thumb.setAttribute("role", "slider");
    this.#thumb.setAttribute("tabindex", "0");
    this.#thumb.setAttribute("aria-valuemin", this.#min.toString());
    this.#thumb.setAttribute("aria-valuemax", this.#max.toString());
    this.#thumb.setAttribute("aria-valuenow", this.value.toString());

    if (this.#ariaLabel) {
      this.#thumb.setAttribute("aria-label", this.#ariaLabel);
    }

    if (this.#ariaLabeledBy) {
      this.#thumb.setAttribute("aria-labeledby", this.#ariaLabeledBy);
    }

    if (this.#ariaValueText) {
      this.#thumb.setAttribute(
        "aria-valuetext",
        this.#ariaValueText(this.value)
      );
    }

    if (this.#name) {
      this.#hiddenInput = document.createElement("input");
      this.#hiddenInput.type = "hidden";
      this.#hiddenInput.name = this.#name;
      this.#hiddenInput.value = this.value.toString();

      this.#slider.appendChild(this.#hiddenInput);
    }

    this.#slider.appendChild(this.#progress);
    this.#slider.appendChild(this.#thumb);

    document.querySelector(this.#container)?.appendChild(this.#slider);

    // this will move the slider to default value if there is one
    this.#moveSlider();
  };

  #initDefaultValue = () => {
    const value = this.#defaultValue / this.#max;

    this.#updateProgressValue(value);
  };

  #initEventListeners = () => {
    this.#slider.addEventListener("mousedown", this.#onMouseDown);
    this.#slider.addEventListener("touchstart", this.#onTouchStart);
    this.#slider.addEventListener("click", this.#onClick);
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
    this.#notifyListeners();
  };

  #getGreaterStepValue = () => {
    const maxAdditional = 0.1 // 10%;
    if (this.#step < maxAdditional) return maxAdditional;

    return this.#step;
  };

  #getInteractionCoords = (evt: SomePointerEvent) => {
    if (evt instanceof MouseEvent) return evt.pageX;

    if (evt instanceof TouchEvent) return evt.changedTouches[0].pageX;

    throw new Error("Unsuported event");
  };

  #onInteraction = (evt: SomePointerEvent) => {
    const { width, left } = this.#slider.getBoundingClientRect();
    const startX = this.#getInteractionCoords(evt) - left;
    const movedProgress = startX / (width - 10);

    this.#updateProgressValue(movedProgress);
    this.#moveSlider();
    this.#notifyListeners();
  };

  #moveSlider = () => {
    const filledValue = Math.floor(this.#progressValue * 100);
    const step = this.#step * 100;
    const stepedProgress = Math.floor(filledValue / step) * step;

    this.#progress.style.width = `${stepedProgress}%`;
    this.#thumb.style.left = `${stepedProgress}%`;
    this.#thumb.setAttribute("aria-valuenow", this.value.toString());

    if (this.#ariaValueText) {
      this.#thumb.setAttribute(
        "aria-valuetext",
        this.#ariaValueText(this.value)
      );
    }

    if (this.#hiddenInput) {
      this.#hiddenInput.value = this.value.toString();
    }
  };

  #notifyListeners = () => {
    if (!this.#onChange) return;

    this.#onChange(this.value);
  };
}

new Slider({
  container: "#slider",
  name: "price-range",
  min: 0,
  max: 200,
  step: 1,
  defaultValue: 50,
  onChange(v) {
    document.querySelector("#val")!.textContent = v.toString();
  },
  ariaValueText(v) {
    return `step-${v.toString()}`;
  },
});
