
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Mic, Square, Play, Pause, Trash2, Download, Scissors, Check, X, ChevronDown, ChevronUp, Loader2, Volume2, ChevronLeft, RefreshCw } from 'lucide-react';
import { Surah, Verse } from '../types';
import { fetchSurahVerses } from '../services/quranService';
import { getTafseerFromDB } from '../services/dbService';

interface SoundTafseerModeProps {
  surahs: Surah[];
  onBack: () => void;
  theme: string;
  accentColor: string;
  fontSize: number;
  activeTafseer: string;
}

interface Recording {
  verseKey: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: number;
}

const DB_NAME = 'SoundTafseerDB';
const STORE_NAME = 'recordings';

const SoundTafseerMode: React.FC<SoundTafseerModeProps> = ({ surahs, onBack, theme, accentColor, fontSize, activeTafseer }) => {
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [tafseers, setTafseers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [recordings, setRecordings] = useState<Record<string, Recording>>({});
  const [isRecording, setIsRecording] = useState<string | null>(null); // verseKey
  const [playing, setPlaying] = useState<string | null>(null); // verseKey
  const [trimming, setTrimming] = useState<string | null>(null); // verseKey
  const [trimRange, setTrimRange] = useState<{ start: number, end: number }>({ start: 0, end: 0 });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dbRef = useRef<IDBDatabase | null>(null);

  const isDark = theme.startsWith('#0') || theme.startsWith('#1') || theme.startsWith('#2');

  useEffect(() => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'verseKey' });
      }
    };
    request.onsuccess = (e) => {
      dbRef.current = (e.target as IDBOpenDBRequest).result;
      loadAllRecordings();
    };
  }, []);

  const loadAllRecordings = () => {
    if (!dbRef.current) return;
    const transaction = dbRef.current.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result as Recording[];
      const map: Record<string, Recording> = {};
      results.forEach(r => {
        r.url = URL.createObjectURL(r.blob);
        map[r.verseKey] = r;
      });
      setRecordings(map);
    };
  };

  const saveRecording = (recording: Recording) => {
    if (!dbRef.current) return;
    const transaction = dbRef.current.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(recording);
    setRecordings(prev => ({ ...prev, [recording.verseKey]: recording }));
  };

  const deleteRecording = (verseKey: string) => {
    if (!dbRef.current) return;
    const transaction = dbRef.current.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(verseKey);
    setRecordings(prev => {
      const next = { ...prev };
      if (next[verseKey]) {
        URL.revokeObjectURL(next[verseKey].url);
        delete next[verseKey];
      }
      return next;
    });
  };

  const reRecord = async (verseKey: string) => {
    deleteRecording(verseKey);
    await startRecording(verseKey);
  };

  const handleSurahClick = async (surah: Surah) => {
    setSelectedSurah(surah);
    setLoading(true);
    try {
      const data = await fetchSurahVerses(surah.id);
      setVerses(data);
      
      // Fetch tafseers
      const tafseerMap: Record<string, string> = {};
      data.forEach(v => {
        const [sid, vid] = v.verse_key.split(':').map(Number);
        const text = getTafseerFromDB(sid, vid, activeTafseer);
        if (text) tafseerMap[v.verse_key] = text;
      });
      setTafseers(tafseerMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async (verseKey: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav'];
      const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          const arrayBuffer = await blob.arrayBuffer();
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const mp3Blob = encodeMp3(audioBuffer);
          const url = URL.createObjectURL(mp3Blob);
          
          const recording: Recording = {
            verseKey,
            blob: mp3Blob,
            url,
            duration: audioBuffer.duration,
            timestamp: Date.now()
          };
          saveRecording(recording);
        } catch (err) {
          console.error("Error processing recording:", err);
          alert("هەڵەیەک ڕوویدا لە کاتی پڕۆسێس کردنی دەنگەکە: " + err);
        }
      };

      mediaRecorder.start();
      setIsRecording(verseKey);
    } catch (err) {
      console.error("getUserMedia error:", err);
      alert('تکایە ڕێگە بدە بە مایکرۆفۆن بۆ تۆمارکردن: ' + err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(null);
    }
  };

  const playRecording = (verseKey: string) => {
    const rec = recordings[verseKey];
    if (!rec) return;

    if (playing === verseKey) {
      audioRef.current?.pause();
      setPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = rec.url;
        audioRef.current.play();
        setPlaying(verseKey);
        audioRef.current.onended = () => setPlaying(null);
      }
    }
  };

  const downloadRecording = (verseKey: string) => {
    const rec = recordings[verseKey];
    if (!rec) return;

    const [s, v] = verseKey.split(':');
    const filename = `${s.padStart(3, '0')}${v.padStart(3, '0')}.mp3`;
    
    const a = document.createElement('a');
    a.href = rec.url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const startTrimming = (verseKey: string) => {
    const rec = recordings[verseKey];
    if (!rec) return;
    setTrimming(verseKey);
    setTrimRange({ start: 0, end: rec.duration });
  };

  const applyTrim = async (verseKey: string) => {
    const rec = recordings[verseKey];
    if (!rec) return;

    setLoading(true);
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await rec.blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const startOffset = trimRange.start * audioBuffer.sampleRate;
      const endOffset = trimRange.end * audioBuffer.sampleRate;
      const frameCount = endOffset - startOffset;

      const trimmedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        frameCount,
        audioBuffer.sampleRate
      );

      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        const channelData = audioBuffer.getChannelData(i);
        const trimmedChannelData = trimmedBuffer.getChannelData(i);
        trimmedChannelData.set(channelData.subarray(startOffset, endOffset));
      }

      const newBlob = encodeMp3(trimmedBuffer);
      const url = URL.createObjectURL(newBlob);
      
      const newRecording: Recording = {
        ...rec,
        blob: newBlob,
        url,
        duration: trimmedBuffer.duration,
        timestamp: Date.now()
      };
      
      saveRecording(newRecording);
      setTrimming(null);
    } catch (err) {
      console.error(err);
      alert('هەڵەیەک ڕوویدا لە کاتی بڕینی دەنگەکە');
    } finally {
      setLoading(false);
    }
  };

  const encodeMp3 = (audioBuffer: AudioBuffer) => {
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    // @ts-ignore
    const mp3encoder = new window.lamejs.Mp3Encoder(channels, sampleRate, 128);
    const mp3Data = [];

    const sampleBlockSize = 1152;
    const left = audioBuffer.getChannelData(0);
    const right = channels > 1 ? audioBuffer.getChannelData(1) : left;

    const leftInt16 = new Int16Array(left.length);
    const rightInt16 = new Int16Array(right.length);
    for (let i = 0; i < left.length; i++) {
      leftInt16[i] = left[i] < 0 ? left[i] * 32768 : left[i] * 32767;
      rightInt16[i] = right[i] < 0 ? right[i] * 32768 : right[i] * 32767;
    }

    for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
      const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
      const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }

    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    return new Blob(mp3Data, { type: 'audio/mp3' });
  };

  return (
    <div className="page-enter flex flex-col h-full overflow-hidden">
      <audio ref={audioRef} hidden />
      
      {/* Header */}
      <header className={`p-4 flex items-center gap-4 border-b shrink-0 ${isDark ? 'bg-black/40 border-gray-800' : 'bg-white/40 border-gray-100'}`}>
        <button onClick={onBack} className="p-2 rounded-full hover:bg-black/5 active:scale-90 transition-all">
          <ArrowRight size={24} />
        </button>
        <div>
          <h2 className="font-bold text-lg">تەفسیری دەنگی</h2>
          <p className="text-[10px] opacity-50 uppercase tracking-widest">تۆمارکردنی تەفسیر بە دەنگی خۆت</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {!selectedSurah ? (
          <div className="grid grid-cols-1 gap-3">
            {surahs.map(s => (
              <div 
                key={s.id}
                onClick={() => handleSurahClick(s)}
                className={`p-4 rounded-[28px] flex items-center justify-between transition-all active:scale-[0.98] border shadow-sm cursor-pointer ${
                  isDark ? 'bg-[#212622]/40 border-gray-800/50' : 'bg-white/40 border-gray-100/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    {s.id}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{s.name_arabic}</h4>
                    <p className="text-[10px] opacity-50">{s.translated_name.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] opacity-40 font-bold">{s.verses_count} ئایەت</span>
                  <ChevronLeft size={16} className="opacity-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setSelectedSurah(null)}
                className="flex items-center gap-2 text-xs font-bold opacity-60 hover:opacity-100 transition-all"
              >
                <ArrowRight size={14} /> گەڕانەوە بۆ لیست
              </button>
              <h3 className="font-bold text-xl text-emerald-600">{selectedSurah.name_arabic}</h3>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-emerald-600" size={40} />
                <p className="text-sm font-bold opacity-50">خەریکی بارکردنی ئایەتەکانە...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {verses.map((v, idx) => {
                  const hasRecording = !!recordings[v.verse_key];
                  const recording = recordings[v.verse_key];
                  const isThisRecording = isRecording === v.verse_key;
                  const isThisPlaying = playing === v.verse_key;
                  const isThisTrimming = trimming === v.verse_key;
                  const tafseerText = tafseers[v.verse_key] || "تەفسیر بەردەست نییە";

                  return (
                    <div 
                      key={v.id}
                      className={`p-6 rounded-[40px] border transition-all space-y-6 ${
                        isDark ? 'bg-[#212622]/40 border-gray-800/50' : 'bg-white/40 border-gray-100/50'
                      }`}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">تەفسیری ئایەت</span>
                        </div>
                        <p className="text-right leading-relaxed" style={{ fontSize: `${16 * fontSize}px` }}>
                          {tafseerText}
                        </p>
                      </div>

                      <div className="h-px w-full bg-black/5"></div>

                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">تەفسیری دەنگی تۆ</p>
                          {hasRecording && (
                            <span className="text-[10px] font-mono opacity-40">{recording.duration.toFixed(1)}s</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {!hasRecording ? (
                            <button
                              onClick={() => isThisRecording ? stopRecording() : startRecording(v.verse_key)}
                              className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm transition-all ${
                                isThisRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {isThisRecording ? <Square size={18} /> : <Mic size={18} />}
                              <span>{isThisRecording ? 'ڕاگرتنی تۆمارکردن' : 'دەستپێکردنی تۆمارکردن'}</span>
                            </button>
                          ) : (
                            <div className="flex-1 flex flex-col gap-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => playRecording(v.verse_key)}
                                  className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm transition-all ${
                                    isThisPlaying ? 'bg-amber-500 text-white' : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {isThisPlaying ? <Pause size={18} /> : <Play size={18} />}
                                  <span>{isThisPlaying ? 'ڕاگرتن' : 'گوێگرتنەوە'}</span>
                                </button>
                                
                                <button
                                  onClick={() => reRecord(v.verse_key)}
                                  className="p-4 rounded-2xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
                                  title="تۆمارکردنەوە"
                                >
                                  <RefreshCw size={18} />
                                </button>

                                <button
                                  onClick={() => downloadRecording(v.verse_key)}
                                  className="p-4 rounded-2xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all"
                                  title="داگرتن"
                                >
                                  <Download size={18} />
                                </button>

                                <button
                                  onClick={() => startTrimming(v.verse_key)}
                                  className={`p-4 rounded-2xl transition-all ${
                                    isThisTrimming ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  }`}
                                  title="بڕین"
                                >
                                  <Scissors size={18} />
                                </button>

                                <button
                                  onClick={() => deleteRecording(v.verse_key)}
                                  className="p-4 rounded-2xl bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                                  title="سڕینەوە"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>

                              {isThisTrimming && (
                                <div className="p-4 rounded-2xl bg-black/5 space-y-4 animate-in slide-in-from-top duration-300">
                                  <div className="flex items-center justify-between text-[10px] font-bold opacity-60">
                                    <span>بڕینی دەنگ</span>
                                    <span>{trimRange.start.toFixed(1)}s - {trimRange.end.toFixed(1)}s</span>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="space-y-1">
                                      <p className="text-[9px] opacity-50">سەرەتا</p>
                                      <input 
                                        type="range" 
                                        min="0" 
                                        max={recording.duration} 
                                        step="0.1"
                                        value={trimRange.start}
                                        onChange={(e) => setTrimRange(prev => ({ ...prev, start: Math.min(prev.end - 0.1, Number(e.target.value)) }))}
                                        className="w-full h-1 accent-emerald-600"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[9px] opacity-50">کۆتایی</p>
                                      <input 
                                        type="range" 
                                        min="0" 
                                        max={recording.duration} 
                                        step="0.1"
                                        value={trimRange.end}
                                        onChange={(e) => setTrimRange(prev => ({ ...prev, end: Math.max(prev.start + 0.1, Number(e.target.value)) }))}
                                        className="w-full h-1 accent-emerald-600"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => applyTrim(v.verse_key)}
                                      className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2"
                                    >
                                      <Check size={14} /> جێبەجێکردن
                                    </button>
                                    <button 
                                      onClick={() => setTrimming(null)}
                                      className="flex-1 py-2 rounded-xl bg-black/10 font-bold text-xs flex items-center justify-center gap-2"
                                    >
                                      <X size={14} /> پاشگەزبوونەوە
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SoundTafseerMode;

