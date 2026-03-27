import React, { useState, useRef, useEffect } from 'react';
import { Mic, StopCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Verse } from '../types';
import { GoogleGenAI } from "@google/genai";

interface RecitationModeProps {
  verse: Verse;
  theme: string;
  accentColor: string;
  onClose: () => void;
}

const RecitationMode: React.FC<RecitationModeProps> = ({ verse, theme, accentColor, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'correct' | 'incorrect'>('idle');
  const [transcription, setTranscription] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];
    
    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };
    
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      processAudio(audioBlob);
    };
    
    mediaRecorderRef.current.start();
    setIsRecording(true);
    setStatus('recording');
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setStatus('processing');
  };

  const processAudio = async (audioBlob: Blob) => {
    // This is where we would send the audio to Gemini for transcription and verification
    // For now, let's simulate the process
    
    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      
      // Call Gemini API to transcribe and verify
      // Note: This requires the @google/genai SDK
      // const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      // ...
      
      // Simulate verification
      setTimeout(() => {
        setTranscription("Simulation: " + verse.text_uthmani.substring(0, 10)); // Mock
        setStatus(Math.random() > 0.5 ? 'correct' : 'incorrect');
      }, 2000);
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/50">
      <div className={`w-full max-w-md p-6 rounded-[32px] shadow-2xl ${theme.startsWith('#0') || theme.startsWith('#1') ? 'bg-[#212622]' : 'bg-white'}`}>
        <h2 className="text-xl font-bold mb-4 text-center">خوێندنەوەی ئایەت</h2>
        <div className="text-2xl font-arabic text-center mb-6" dir="rtl">{verse.text_uthmani}</div>
        
        <div className="flex justify-center mb-6">
          {status === 'idle' && (
            <button onClick={startRecording} className="p-6 rounded-full text-white shadow-lg" style={{ backgroundColor: accentColor }}>
              <Mic size={48} />
            </button>
          )}
          {status === 'recording' && (
            <button onClick={stopRecording} className="p-6 rounded-full text-white shadow-lg bg-red-500">
              <StopCircle size={48} />
            </button>
          )}
          {status === 'processing' && (
            <div className="p-6 rounded-full text-white shadow-lg bg-gray-500">
              <Loader2 size={48} className="animate-spin" />
            </div>
          )}
          {status === 'correct' && (
            <div className="p-6 rounded-full text-white shadow-lg bg-emerald-500">
              <CheckCircle2 size={48} />
            </div>
          )}
          {status === 'incorrect' && (
            <div className="p-6 rounded-full text-white shadow-lg bg-red-500">
              <XCircle size={48} />
            </div>
          )}
        </div>
        
        <p className="text-center font-bold mb-4">
          {status === 'idle' && "پەنجە بنێ بە مایکرۆفۆنەکە بۆ دەستپێکردن"}
          {status === 'recording' && "تۆمارکردن... خوێندنەوەکەت ئەنجام بدە"}
          {status === 'processing' && "پشکنینی خوێندنەوەکەت..."}
          {status === 'correct' && "بەڕاستی خوێندتەوە! پیرۆزە."}
          {status === 'incorrect' && "هەڵەت هەیە. تکایە دووبارە هەوڵ بدەرەوە."}
        </p>
        
        <button onClick={onClose} className="w-full py-3 rounded-xl font-bold bg-gray-200">داخستن</button>
      </div>
    </div>
  );
};

export default RecitationMode;
