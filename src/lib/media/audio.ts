export type VoiceRecording = {
  blob: Blob;
  url: string;
  duration: number;
};

export async function getAudioDuration(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  return new Promise<number>((resolve) => {
    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
  });
}
