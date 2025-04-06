const globalAmbientSoundState = {
  instances: {} as { [key: string]: HTMLAudioElement },
  playing: {} as { [key: string]: boolean },
  volumes: {} as { [key: string]: number },
};

export const initAmbientSound = (sound: { id: string; url: string }, defaultVolume = 0.5) => {
  if (!globalAmbientSoundState.instances[sound.id]) {
    const audio = new Audio(sound.url);
    audio.crossOrigin = "anonymous"; 
    audio.loop = true;
    audio.volume = defaultVolume;
    globalAmbientSoundState.instances[sound.id] = audio;
    globalAmbientSoundState.playing[sound.id] = false;
    globalAmbientSoundState.volumes[sound.id] = defaultVolume;
  }
};

export const playSound = (id: string) => {
  const audio = globalAmbientSoundState.instances[id];
  if (audio && !globalAmbientSoundState.playing[id]) {
    audio.play().catch((err) => console.error("Audio play error:", err));
    globalAmbientSoundState.playing[id] = true;
  }
};

export const pauseSound = (id: string) => {
  const audio = globalAmbientSoundState.instances[id];
  if (audio && globalAmbientSoundState.playing[id]) {
    audio.pause();
    globalAmbientSoundState.playing[id] = false;
  }
};

export const setVolume = (id: string, volume: number) => {
  const audio = globalAmbientSoundState.instances[id];
  if (audio) {
    audio.volume = volume;
    globalAmbientSoundState.volumes[id] = volume;
  }
};

export const getAmbientSoundState = () => globalAmbientSoundState;
