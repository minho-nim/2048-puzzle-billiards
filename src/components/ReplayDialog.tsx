import { useEffect, useState } from 'react';
import { GameDialog } from './GameDialog';
import { replayBuffer } from '../replay/replayBuffer';
import { encodeReplay } from '../replay/encodeReplay';

export function ReplayDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    setFile(null); setProgress(0); setError('');
    void encodeReplay(replayBuffer.getShots(), controller.signal, setProgress)
      .then((result) => { if (!controller.signal.aborted) setFile(result); })
      .catch((err: unknown) => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : '영상 저장 실패'); });
    return () => controller.abort();
  }, [isOpen, attempt]);
  useEffect(() => {
    if (!file) { setUrl(''); return; }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  const canShare = file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  const share = async () => {
    if (!file) return;
    try { await navigator.share({ files: [file], title: '2048 당구 리플레이' }); }
    catch (err) { if (!(err instanceof DOMException && err.name === 'AbortError')) setError('공유하지 못했습니다. 아래 영상 다운로드를 이용해 주세요.'); }
  };
  return <GameDialog isOpen={isOpen} onClose={onClose} labelledBy="replay-title">
    <h2 id="replay-title" className="text-xl font-black mb-2">리플레이 저장</h2>
    <p className="text-sm mb-3">최근 완료된 {replayBuffer.getCount()}샷 · 조준 시작부터 공 보충까지</p>
    {!file && !error && <div role="status" className="py-5 font-bold">영상 만드는 중… {Math.round(progress * 100)}%<p className="text-sm font-normal mt-2">샷 길이만큼 시간이 걸립니다. 이 화면을 열어 두세요.</p></div>}
    {url && <video src={url} controls playsInline className="w-full max-h-[45dvh] bg-neutral-100" />}
    {error && <p role="alert" className="text-sm text-red-700 my-3">{error}</p>}
    {file && <div className="grid gap-2 mt-3">
      {canShare && <><button onClick={() => void share()} className="bg-black text-white rounded py-2.5 font-bold cursor-pointer">공유·저장</button><p className="text-xs text-neutral-600">공유창에서 비디오 저장 또는 파일 저장을 선택하세요. 표시되는 메뉴는 기기에 따라 다릅니다.</p></>}
      <a href={url} download={file.name} className="border-2 border-black rounded py-2 text-center font-bold">영상 다운로드 ({file.type === 'video/mp4' ? 'MP4' : 'WebM'})</a>
    </div>}
    {!file && error && <button onClick={() => setAttempt((value) => value + 1)} className="border-2 border-black rounded py-2 px-3 mt-2">다시 시도</button>}
    <button onClick={onClose} className="w-full border-2 border-black rounded py-2.5 mt-3 font-bold cursor-pointer">{!file && !error ? '취소' : '닫기'}</button>
  </GameDialog>;
}
