export default function valueToPercent(
  value: number,
  min: number,
  max: number
) {
  return (value - min) / (max - min);
}
