import "./style.css";
import clampNumber from "./utils/clampNumber";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div id="slider">
  </div>
  <div id="val">
  </div>
  <input type="range" />
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
  orientation?: Orietantion;
  onChange?(value: number): void;
  ariaValueText?(value: number): string;
};

type SomePointerEvent = MouseEvent | TouchEvent;

type Orietantion = "horizontal" | "vertical";

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
  #orientation: Orietantion;

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
    orientation,
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
    this.#orientation = orientation || "horizontal";

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
    this.#slider.setAttribute("data-slider", "");
    this.#progress.setAttribute("data-slider-progress", "");
    this.#thumb.setAttribute("data-slider-thumb", "");
    this.#thumb.setAttribute("role", "slider");
    this.#thumb.setAttribute("tabindex", "0");
    this.#thumb.setAttribute("aria-valuemin", this.#min.toString());
    this.#thumb.setAttribute("aria-valuemax", this.#max.toString());
    this.#thumb.setAttribute("aria-valuenow", this.value.toString());
    this.#thumb.setAttribute("aria-orientation", this.#orientation);

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

    if (this.#orientation === "vertical") {
      this.#slider.setAttribute("data-slider-vertical", "");
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
    const maxAdditional = 0.1; // 10%;
    if (this.#step < maxAdditional) return maxAdditional;

    return this.#step;
  };

  #getEventCoords = (evt: SomePointerEvent) => {
    const coords = { x: 0, y: 0 };

    if (evt instanceof MouseEvent) {
      coords.x = evt.pageX;
      coords.y = evt.pageY;

      return coords;
    }

    if (evt instanceof TouchEvent) {
      coords.x = evt.changedTouches[0].pageX;
      coords.y = evt.changedTouches[0].pageY;

      return coords;
    }

    throw new Error("Unsuported event");
  };

  #onInteraction = (evt: SomePointerEvent) => {
    const rect = this.#slider.getBoundingClientRect();

    let thumbProgress = 0;

    if (this.#orientation === "horizontal") {
      thumbProgress = (this.#getEventCoords(evt).x - rect.left) / rect.width;
    } else {
      thumbProgress =
        -(this.#getEventCoords(evt).y - rect.bottom) / rect.height;
    }

    this.#updateProgressValue(thumbProgress);
    this.#moveSlider();
    this.#notifyListeners();
  };

  #moveSlider = () => {
    const filledValue = Math.floor(this.#progressValue * 100);
    const step = this.#step * 100;
    const stepedProgress = Math.floor(filledValue / step) * step;
    const isHorizontal = this.#orientation === "horizontal";
    const dimKey = isHorizontal ? "width" : "height";
    const axisKey = isHorizontal ? "left" : "bottom";

    this.#progress.style[dimKey] = `${stepedProgress}%`;
    this.#thumb.style[axisKey] = `${stepedProgress}%`;
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
  max: 100,
  step: 10,
  defaultValue: 10,
  orientation: "vertical",
  onChange(v) {
    document.querySelector("#val")!.textContent = v.toString();
  },
  ariaValueText(v) {
    return `step-${v.toString()}`;
  },
});
