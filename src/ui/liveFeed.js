/**
 * Live Feed Module
 * Handles live class feed rendering
 */

import { getElement } from '../utils/dom.js';

/**
 * Create live feed controller
 * @returns {Object} Live feed controller
 */
export function createLiveFeed() {
  const feedEl = getElement('live-class-feed');

  return {
    /**
     * Update live feed with current active slots
     * @param {Object} liveSnapshot - Current live snapshot
     * @param {Object} levers - Current lever values
     */
    update(liveSnapshot, levers) {
      if (!feedEl) return;
      
      feedEl.innerHTML = '';
      
      if (!liveSnapshot.activeSlots.length) {
        const li = document.createElement('li');
        li.innerHTML = `<span class="room">No classes active</span><span class="load">Playback fast-forwards time.</span>`;
        feedEl.appendChild(li);
        return;
      }
      
      liveSnapshot.activeSlots.slice(0, 5).forEach((slot) => {
        const li = document.createElement('li');
        
        const room = document.createElement('span');
        room.className = 'room';
        room.textContent = slot.room;
        
        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = slot.label;
        
        const load = document.createElement('span');
        load.className = 'load';
        load.textContent = `${Math.round(levers.bitrate * 100)}% video · ${Math.round(slot.duration * 45)} min`;
        
        li.appendChild(room);
        li.appendChild(pill);
        li.appendChild(load);
        feedEl.appendChild(li);
      });
    },

    /**
     * Clear the live feed
     */
    clear() {
      if (feedEl) feedEl.innerHTML = '';
    },
  };
}
