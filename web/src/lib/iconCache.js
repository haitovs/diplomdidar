import { DEVICE_CONFIG } from '@core/rendering/NodeRenderer.js';

export async function preloadDeviceIcons() {
  const cache = new Map();
  const iconNames = [...new Set(Object.values(DEVICE_CONFIG).map((device) => device.icon))];

  await Promise.all(
    iconNames.map((name) =>
      new Promise((resolve) => {
        const img = new Image();
        img.src = `/icons/${name}.svg`;
        img.onload = () => {
          cache.set(name, img);
          cache.set(`${name}.svg`, img);
          resolve();
        };
        img.onerror = () => resolve();
      })
    )
  );

  return cache;
}
