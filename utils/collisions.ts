import { GRID_SIZE } from "../constants";

export function checkCircleRectCollision(circleX: number, circleY: number, circleRadius: number, rectX: number, rectY: number, rectWidth: number, rectHeight: number): boolean {
  // Find the closest point on the rectangle to the center of the circle
  const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
  const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));

  // Calculate the distance between the circle's center and this closest point
  const distanceX = circleX - closestX;
  const distanceY = circleY - closestY;
  const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

  // Check if the distance is less than the circle's radius
  return distanceSquared < (circleRadius * circleRadius);
}
