import type { PerspectiveCamera } from "three";
import { AXIS_COLORS, HUD, PRECISION } from "../constants/debug";

export function createHud(camera: PerspectiveCamera): (() => void) {
  if (!HUD) return () => { };

  const panel = document.createElement("div");
  panel.id = "hud";
  const cells = ["x", "y", "z", "rx", "ry", "rz"].map((label, index) => {
    const cell = document.createElement("span");
    cell.style.color = AXIS_COLORS[index % AXIS_COLORS.length] ?? "#ffffff";
    cell.textContent = label;
    panel.appendChild(cell);
    return cell;
  });
  document.body.appendChild(panel);

  return () => {
    const values = [
      camera.position.x,
      camera.position.y,
      camera.position.z,

      camera.rotation.x,
      camera.rotation.y,
      camera.rotation.z,
    ];
    const labels = ["x", "y", "z", "rx", "ry", "rz"];
    values.forEach((value, index) => {
      const cell = cells[index];
      if (cell) cell.textContent = `${labels[index]} ${value.toFixed(PRECISION)}`;
    });
  };
}
