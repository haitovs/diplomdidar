const DAY_START = 8;
const DAY_END = 18.5;
const DAY_RANGE = DAY_END - DAY_START;

export const renderTimeline = (container, blocks = []) => {
  container.innerHTML = '';
  blocks.forEach((block) => {
    const row = document.createElement('div');
    row.className = 'timeline-row';

    const title = document.createElement('h4');
    title.textContent = block.room;
    row.appendChild(title);

    const track = document.createElement('div');
    track.className = 'timeline-track';

    block.slots.forEach((slot, index) => {
      const dot = document.createElement('div');
      dot.className = 'timeline-slot';
      dot.style.background = `${block.color}`;
      dot.style.left = `${((slot.start - DAY_START) / DAY_RANGE) * 100}%`;
      dot.style.width = `${(slot.duration / DAY_RANGE) * 100}%`;
      dot.style.animationDelay = `${index * 0.15}s`;
      dot.dataset.label = `${slot.label}`;
      track.appendChild(dot);
    });

    row.appendChild(track);
    container.appendChild(row);
  });
};

export const pulseTimeline = (container) => {
  container.querySelectorAll('.timeline-slot').forEach((slot, idx) => {
    slot.classList.remove('playing');
    requestAnimationFrame(() => {
      setTimeout(() => slot.classList.add('playing'), idx * 40);
      setTimeout(() => slot.classList.remove('playing'), 1600 + idx * 40);
    });
  });
};
