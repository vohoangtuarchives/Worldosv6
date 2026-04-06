"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Centrifuge } from "centrifuge";

export default function AtmospherePlayer() {
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [trackInfo, setTrackInfo] = useState<{ epochName: string; style: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume] = useState(0.2); // Âm lượng chìm, nhẹ nhàng
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  function handleTrackChange(url: string, epochName: string, style: string) {
    if (!audioRef.current || currentTrack === url) return;

    const crossfade = async () => {
        // Fade out
        let v = audioRef.current!.volume;
        while (v > 0.05) {
            v -= 0.05;
            audioRef.current!.volume = Math.max(0, v);
            await new Promise(r => setTimeout(r, 100));
        }
        audioRef.current!.pause();
        
        // Swap track
        audioRef.current!.src = url;
        audioRef.current!.load();
        
        // Play and Fade in
        playPromiseRef.current = audioRef.current!.play();
        if (playPromiseRef.current !== undefined) {
            playPromiseRef.current.catch(error => {
                console.warn("[ATMOSPHERE] Trình duyệt chặn AutoPlay audio. Cần user tương tác.", error);
                setIsPlaying(false);
            });
        }
        
        setTrackInfo({ epochName, style });
        setCurrentTrack(url);
        setIsPlaying(true);

        while (v < volume) {
            v += 0.05;
            audioRef.current!.volume = Math.min(volume, v);
            await new Promise(r => setTimeout(r, 100));
        }
    };

    crossfade();
  }

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
    }

    // Khởi tạo Centrifugo WebSocket
    const centrifuge = new Centrifuge('ws://127.0.0.1:8000/connection/websocket', {});
    centrifuge.connect();

    // Lắng nghe tín hiệu đổi nhạc qua Centrifugo (Kênh global_universe)
    const sub = centrifuge.newSubscription('global_universe');
    sub.on('publication', (ctx: { data: { event: string; payload: { url: string; epochName: string; style: string } } }) => {
      const data = ctx.data;
      if (data && data.event === 'SoundtrackChanged') {
        const payload = data.payload;
        console.log("[ATMOSPHERE] Nhận sóng âm nhạc kỷ nguyên:", payload);
        
        handleTrackChange(payload.url, payload.epochName, payload.style);
      }
    });
    
    sub.subscribe();

    // Default Fallback Ambient nếu chưa có gì
    handleTrackChange(
        "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=cinematic-time-lapse-115672.mp3", 
        "Genesis Era", 
        "default"
    );

    return () => {
      sub.removeAllListeners();
      sub.unsubscribe();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []); // eslint-disable-line

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full cursor-default hover:bg-black/60 transition-colors">
      {/* Nút Play/Pause (User Interact để bypass AutoPlay Policy Web) */}
      <button 
        onClick={togglePlay}
        className="text-gray-400 hover:text-white transition-colors p-1"
      >
        {isPlaying ? (
           // Báo hiệu đang Play (Pulse effect)
           <span className="relative flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
           </span>
        ) : (
           // Đang Pause
           <div className="w-3 h-3 bg-gray-500 rounded-full" />
        )}
      </button>

      {/* Thông tin Track */}
      <AnimatePresence mode="wait">
        {trackInfo && (
            <motion.div 
                key={trackInfo.epochName}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col text-left"
            >
                <span className="text-[10px] uppercase text-gray-500 font-mono font-bold tracking-wider">Atmosphere Lock</span>
                <span className="text-xs text-white font-medium max-w-[150px] truncate">{trackInfo.epochName}</span>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
