import clampNumber from "../utils/clampNumber";
import percentToValue from "../utils/percentToValue";
import valueToPercent from "../utils/valueToPercent";

import "./slider.css";

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

export default class Slider {
  #min: number;
  #max: number;
  #step: number;
  #defaultValue: number;
  #rangeValue: number;
  #onChange?: SliderOptions["onChange"];
  #ariaValueText?: SliderOptions["ariaValueText"];
  #name?: string;
  #ariaLabel?: string;
  #ariaLabeledBy?: string;
  #orientation: Orietantion;

  #container: string;
  #sliderNode: HTMLDivElement;
  #rangeNode: HTMLDivElement;
  #thumbNode: HTMLDivElement;
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
    this.#rangeValue = 0;
    this.#step = this.#calcStepValue(step, max);
    this.#container = container;
    this.#onChange = onChange;
    this.#ariaValueText = ariaValueText;
    this.#name = name;
    this.#ariaLabel = ariaLabel;
    this.#ariaLabeledBy = ariaLabeledBy;
    this.#orientation = orientation || "horizontal";

    this.#sliderNode = document.createElement("div");
    this.#rangeNode = document.createElement("div");
    this.#thumbNode = document.createElement("div");

    this.#initDefaultValue();
    this.#createSlider();
    this.#initEventListeners();
  }

  get value() {
    const step = this.#step * this.#max;

    const totalValue = percentToValue(this.#rangeValue, this.#min, this.#max);

    return Math.floor(
      clampNumber(Math.floor(totalValue / step) * step, this.#min, this.#max)
    );
  }

  #calcStepValue = (step = 1, max: number) => {
    return (step > 0 ? step : 1) / max;
  };

  #updateRangeValue = (newValue: number) => {
    const minValue = this.#min / this.#max;

    this.#rangeValue = clampNumber(newValue, minValue, 1);
  };

  #createSlider = () => {
    this.#sliderNode.setAttribute("data-slider", "");
    this.#rangeNode.setAttribute("data-slider-range", "");
    this.#thumbNode.setAttribute("data-slider-thumb", "");
    this.#thumbNode.setAttribute("role", "slider");
    this.#thumbNode.setAttribute("tabindex", "0");
    this.#thumbNode.setAttribute("aria-valuemin", this.#min.toString());
    this.#thumbNode.setAttribute("aria-valuemax", this.#max.toString());
    this.#thumbNode.setAttribute("aria-valuenow", this.value.toString());
    this.#thumbNode.setAttribute("aria-orientation", this.#orientation);

    if (this.#ariaLabel) {
      this.#thumbNode.setAttribute("aria-label", this.#ariaLabel);
    }

    if (this.#ariaLabeledBy) {
      this.#thumbNode.setAttribute("aria-labeledby", this.#ariaLabeledBy);
    }

    if (this.#ariaValueText) {
      this.#thumbNode.setAttribute(
        "aria-valuetext",
        this.#ariaValueText(this.value)
      );
    }

    // if we have a name, probably we are using it inside a form
    if (this.#name) {
      this.#hiddenInput = document.createElement("input");
      this.#hiddenInput.type = "hidden";
      this.#hiddenInput.name = this.#name;
      this.#hiddenInput.value = this.value.toString();

      this.#sliderNode.appendChild(this.#hiddenInput);
    }

    if (this.#orientation === "vertical") {
      this.#sliderNode.setAttribute("data-slider-vertical", "");
    }

    this.#sliderNode.appendChild(this.#rangeNode);
    this.#sliderNode.appendChild(this.#thumbNode);

    document.querySelector(this.#container)?.appendChild(this.#sliderNode);

    // this will move the slider to default value if there is one
    this.#moveSlider();
  };

  #initDefaultValue = () => {
    const value = valueToPercent(this.#defaultValue, this.#min, this.#max);

    this.#updateRangeValue(value);
  };

  #initEventListeners = () => {
    this.#sliderNode.addEventListener("mousedown", this.#onMouseDown);
    this.#sliderNode.addEventListener("touchstart", this.#onTouchStart);
    this.#sliderNode.addEventListener("click", this.#onClick);
    this.#thumbNode.addEventListener("keydown", this.#onKeyDown);
  };

  #onClick = (evt: MouseEvent) => {
    this.#onInteractionEvent(evt);
  };

  #onMouseDown = (evt: MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();

    document.addEventListener("mousemove", this.#onMouseMove);
    document.addEventListener("mouseup", this.#onMouseUp);
  };

  #onMouseMove = (evt: MouseEvent) => {
    this.#onInteractionEvent(evt);
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
    this.#onInteractionEvent(evt);
  };

  #onTouchEnd = () => {
    document.removeEventListener("touchmove", this.#onTouchMove);
    document.removeEventListener("touchend", this.#onTouchEnd);
  };

  #onKeyDown = (evt: KeyboardEvent) => {
    const minValue = this.#min / this.#max;
    const greaterStep = this.#getGreaterStepValue();
    let newValue = this.#rangeValue;

    switch (evt.key) {
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

    this.#updateRangeValue(newValue);
    this.#moveSlider();
    this.#notifyValueChange();
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
    }

    if (evt instanceof TouchEvent) {
      coords.x = evt.changedTouches[0].pageX;
      coords.y = evt.changedTouches[0].pageY;
    }

    return coords;
  };

  #onInteractionEvent = (evt: SomePointerEvent) => {
    const rect = this.#sliderNode.getBoundingClientRect();

    let rangeValue = 0;

    if (this.#orientation === "horizontal") {
      rangeValue = (this.#getEventCoords(evt).x - rect.left) / rect.width;
    } else {
      rangeValue = -(this.#getEventCoords(evt).y - rect.bottom) / rect.height;
    }

    this.#updateRangeValue(rangeValue);
    this.#moveSlider();
    this.#notifyValueChange();
  };

  #moveSlider = () => {
    const filledValue = clampNumber(Math.floor(this.#rangeValue * 100), 0, 100);
    const step = this.#step * 100;
    const stepedRange = Math.floor(filledValue / step) * step;
    const isHorizontal = this.#orientation === "horizontal";
    const dimKey = isHorizontal ? "width" : "height";
    const axisKey = isHorizontal ? "left" : "bottom";

    this.#rangeNode.style[dimKey] = `${stepedRange}%`;
    this.#thumbNode.style[axisKey] = `${stepedRange}%`;
    this.#thumbNode.setAttribute("aria-valuenow", this.value.toString());

    if (this.#ariaValueText) {
      this.#thumbNode.setAttribute(
        "aria-valuetext",
        this.#ariaValueText(this.value)
      );
    }

    if (this.#hiddenInput) {
      this.#hiddenInput.value = this.value.toString();
    }
  };

  #notifyValueChange = () => {
    if (!this.#onChange) return;

    this.#onChange(this.value);
  };
}
