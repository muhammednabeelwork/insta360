import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { EventImage } from '@/types';
import { Loader2, Zap } from 'lucide-react';

const STATIC_SLIDES = [
  {
    id: 's1',
    title: 'Welcome to EventLive 2026',
    subtitle: 'Innovation • Connectivity • Future',
    description: 'Celebrate live moments, claim your digital certificates, and join a community of innovators.',
    gradient: 'from-blue-600 to-indigo-900'
  },
  {
    id: 's2',
    title: 'Water, Sanitation & Hygiene',
    subtitle: 'Global Growth & Opportunity',
    description: 'Around 3.5 billion people still lack safely managed sanitation. We accelerate affordable, off‑grid, climate‑resilient sanitation technologies and systems that keep human waste out of the environment, improve health, and boost economic opportunity.',
    gradient: 'from-primary to-secondary'
  },
  {
    id: 's3',
    title: 'At a Glance',
    subtitle: 'The scale of the challenge',
    description: 'More than 3.5 billion people lack safely managed sanitation; poor sanitation contributes to waterborne disease and prevents economic opportunity.',
    gradient: 'from-emerald-600 to-teal-900'
  },
  {
    id: 's4',
    title: 'Our Strategy',
    subtitle: 'Innovation + Commercialization',
    description: 'We focus on affordable, complete, and sustainable waste treatment solutions that eliminate pathogens, are energy efficient, off‑grid, and resilient to climate and water stresses.',
    gradient: 'from-purple-600 to-pink-900'
  },
  {
    id: 's5',
    title: 'Reinvented Toilet Challenge',
    subtitle: 'Breakthrough technologies',
    description: 'Since 2011, investments have produced innovations available for licensing, production, and commercialization to meet diverse community needs.',
    gradient: 'from-orange-600 to-red-700'
  },
];
const STATIC_COUNT = STATIC_SLIDES.length;

export default function BigScreen() {
  const [images, setImages] = useState<EventImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageRotationIndex, setImageRotationIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Deriving URLs
  const certificateUrl = useMemo(() => {
    // In a real app, this would be the actual hosted URL
    return `${window.location.origin}/certificate`;
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'images'),
      where('isVisible', '==', true),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const imgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventImage));
      setImages(imgs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % (STATIC_COUNT + 1); // static slides + 1 dynamic image slide
        if (next === STATIC_COUNT) {
          // If we are moving to the image slide, increment the rotation index
          setImageRotationIndex((prevImgIdx) => (images.length > 0 ? (prevImgIdx + 1) % images.length : 0));
        }
        return next;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [images.length]);

  const currentImage = images.length > 0 ? images[imageRotationIndex] : null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
        <p className="text-xl font-medium tracking-widest uppercase">Initializing Display...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex flex-col font-sans">
      <AnimatePresence mode="wait">
        {currentIndex < STATIC_COUNT ? (
          <motion.div
            key={STATIC_SLIDES[currentIndex].id}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-0 flex flex-col items-center justify-center text-white px-12 bg-gradient-to-br ${STATIC_SLIDES[currentIndex].gradient}`}
          >
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-6xl md:text-8xl font-black text-center mb-4 uppercase tracking-tighter"
            >
              {STATIC_SLIDES[currentIndex].title}
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-xl md:text-3xl font-light text-center opacity-90 uppercase tracking-[0.2em] mb-4"
            >
              {STATIC_SLIDES[currentIndex].subtitle}
            </motion.p>
            {STATIC_SLIDES[currentIndex].description && (
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.8 }}
                className="max-w-4xl text-center text-lg md:text-xl font-medium opacity-90 leading-relaxed"
              >
                {STATIC_SLIDES[currentIndex].description}
              </motion.p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="dynamic-image"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden"
          >
            {currentImage ? (
              <div className="relative w-full h-full">
                <motion.img
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 6 }}
                  src={currentImage.url}
                  className="w-full h-full object-cover opacity-60"
                  alt="Background"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative p-2 bg-white rounded-xl shadow-2xl overflow-hidden max-w-[80vw] max-h-[70vh]"
                   >
                     <img src={currentImage.url} className="max-w-full max-h-[60vh] object-contain rounded-lg" alt="Event Moment" />
                     {imageRotationIndex === 0 && (
                        <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
                          <Zap className="w-3 h-3" /> NOW SHOWING
                        </div>
                     )}
                   </motion.div>
                </div>
              </div>
            ) : (
              <div className="text-white text-center">
                <p className="text-4xl font-light italic">Waiting for event captures...</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent QR Code Sidebar/Corner */}
      <div className="absolute bottom-8 right-8 z-50 flex items-end gap-6 bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-2xl">
        <div className="text-right hidden md:block">
          <p className="text-white font-bold text-lg leading-tight mb-1">GET YOUR<br />CERTIFICATE</p>
          <p className="text-white/60 text-xs tracking-widest uppercase">Scan to Start</p>
        </div>
        <div className="bg-white p-2 rounded-xl shadow-inner">
          <QRCodeSVG value={certificateUrl} size={120} level="H" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-1.5 bg-primary/30 w-full z-40">
        <motion.div
          key={currentIndex}
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 6, ease: 'linear' }}
          className="h-full bg-primary"
        />
      </div>
    </div>
  );
}
