export const defaultTopology = {
  nodes: [
    { id: 'pc0', label: 'PC0', hostname: 'PC0', type: 'pc', position: { x: 0.12, y: 0.75 } },
    { id: 'pc1', label: 'PC1', hostname: 'PC1', type: 'pc', position: { x: 0.38, y: 0.75 } },
    { id: 'sw0', label: 'Switch0', hostname: 'Switch0', type: 'switch', position: { x: 0.25, y: 0.45 } },
    { id: 'r0', label: 'Router0', hostname: 'Router0', type: 'router', position: { x: 0.55, y: 0.25 } },
    { id: 'sw1', label: 'Switch1', hostname: 'Switch1', type: 'switch', position: { x: 0.78, y: 0.45 } },
    { id: 'srv0', label: 'Server0', hostname: 'Server0', type: 'server', position: { x: 0.88, y: 0.75 } },
  ],
  links: [
    { id: 'l1', source: 'pc0', target: 'sw0', type: 'ethernet' },
    { id: 'l2', source: 'pc1', target: 'sw0', type: 'ethernet' },
    { id: 'l3', source: 'sw0', target: 'r0', type: 'ethernet' },
    { id: 'l4', source: 'r0', target: 'sw1', type: 'ethernet' },
    { id: 'l5', source: 'sw1', target: 'srv0', type: 'ethernet' },
  ],
};

export const starterTopology = {
  nodes: [
    { id: 'pc0', label: 'PC0', hostname: 'PC0', type: 'pc', position: { x: 0.15, y: 0.7 } },
    { id: 'pc1', label: 'PC1', hostname: 'PC1', type: 'pc', position: { x: 0.45, y: 0.7 } },
    { id: 'sw0', label: 'Switch0', hostname: 'Switch0', type: 'switch', position: { x: 0.3, y: 0.4 } },
    { id: 'r0', label: 'Router0', hostname: 'Router0', type: 'router', position: { x: 0.6, y: 0.2 } },
    { id: 'sw1', label: 'Switch1', hostname: 'Switch1', type: 'switch', position: { x: 0.75, y: 0.4 } },
    { id: 'srv0', label: 'Server0', hostname: 'Server0', type: 'server', position: { x: 0.85, y: 0.7 } },
  ],
  links: [
    { id: 'l1', source: 'pc0', target: 'sw0', type: 'ethernet' },
    { id: 'l2', source: 'pc1', target: 'sw0', type: 'ethernet' },
    { id: 'l3', source: 'sw0', target: 'r0', type: 'ethernet' },
    { id: 'l4', source: 'r0', target: 'sw1', type: 'ethernet' },
    { id: 'l5', source: 'sw1', target: 'srv0', type: 'ethernet' },
  ],
};
