import { drawBoard } from '../rendering/gameRenderer';
import { getBallColor } from '../config/ballColors';
import type { ReplayFrame, ReplayShot } from './replayBuffer';

export function getReplayMime() {
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return null;
  return ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    .find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

export function drawReplayFrame(ctx: CanvasRenderingContext2D, frame: ReplayFrame) {
  ctx.fillStyle = '#F5F5F5';
  ctx.fillRect(0, 0, 560, 680);
  ctx.fillStyle = '#111';
  ctx.font = '900 25px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('2048 당구', 24, 36);
  ctx.textAlign = 'right';
  ctx.fillText(`점수 ${frame.score}`, 536, 36);
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('생명', 24, 85);
  const radius = Math.min(12, 207 / Math.max(1, frame.maxLife));
  const color = getBallColor(frame.scene.balls.find((ball) => ball.isBlackNumber)?.value ?? 2).primary;
  for (let i = 0; i < frame.maxLife; i++) {
    ctx.beginPath();
    ctx.arc(90 + i * radius * 2.4, 78, radius, 0, Math.PI * 2);
    ctx.fillStyle = i < frame.life ? color : '#888';
    ctx.fill();
  }
  ctx.save();
  ctx.translate(0, 120);
  drawBoard(ctx, frame.scene);
  ctx.restore();
}

export async function encodeReplay(shots: ReplayShot[], signal: AbortSignal, onProgress: (progress: number) => void): Promise<File> {
  const mimeType = getReplayMime();
  if (!mimeType) throw new Error('이 브라우저는 영상 저장을 지원하지 않습니다. 최신 Safari 또는 Chrome에서 열어 주세요.');
  const canvas = document.createElement('canvas');
  canvas.width = 560;
  canvas.height = 680;
  const ctx = canvas.getContext('2d');
  if (!ctx || !shots.length) throw new Error('저장할 샷이 없습니다.');
  const stream = canvas.captureStream(30);
  let recorder: MediaRecorder | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3_000_000 });
    const chunks: Blob[] = [];
    const total = shots.reduce((sum, shot) => sum + shot.duration, 0);
    const frames: ReplayFrame[] = [];
    let offset = 0;
    for (const shot of shots) {
      frames.push(...shot.frames.map((frame) => ({ ...frame, time: frame.time + offset })));
      offset += shot.duration;
    }
    drawReplayFrame(ctx, frames[0]);
    await new Promise<void>((resolve, reject) => {
      const abort = () => reject(new DOMException('영상 만들기를 취소했습니다.', 'AbortError'));
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) { abort(); return; }
      recorder!.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder!.onerror = () => { signal.removeEventListener('abort', abort); reject(new Error('영상을 만들지 못했습니다. 다시 시도해 주세요.')); };
      recorder!.onstop = () => { signal.removeEventListener('abort', abort); resolve(); };
      recorder!.start(1000);
      const start = performance.now();
      let index = 0;
      const tick = () => {
        if (signal.aborted) return;
        const elapsed = performance.now() - start;
        while (index + 1 < frames.length && frames[index + 1].time <= elapsed) index++;
        drawReplayFrame(ctx, frames[index]);
        onProgress(Math.min(1, elapsed / total));
        if (elapsed >= total) recorder!.stop();
        else timer = setTimeout(tick, 1000 / 30);
      };
      tick();
    });
    if (signal.aborted) throw new DOMException('취소됨', 'AbortError');
    const extension = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
    const file = new File(chunks, `2048-replay-${Date.now()}.${extension}`, { type: mimeType.split(';')[0] });
    if (!file.size) throw new Error('영상이 비어 있습니다. 다시 시도해 주세요.');
    return file;
  } finally {
    clearTimeout(timer);
    if (recorder?.state === 'recording') recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
  }
}
