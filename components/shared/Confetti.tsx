'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiProps {
    active: boolean;
    onComplete?: () => void;
    duration?: number;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    rotation: number;
    color: string;
    scale: number;
    delay: number;
}

const COLORS = [
    '#8B5CF6', // primary purple
    '#A78BFA', // light purple
    '#10B981', // success green
    '#F59E0B', // warning amber
    '#3B82F6', // info blue
    '#EC4899', // pink
    '#F97316', // orange
];

function generateParticles(count: number): Particle[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        rotation: Math.random() * 360,
        color: COLORS[Math.floor(Math.random() * COLORS.length)] || '#8B5CF6',
        scale: 0.5 + Math.random() * 0.8,
        delay: Math.random() * 0.3,
    }));
}

export default function Confetti({ active, onComplete, duration = 2000 }: ConfettiProps) {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    const handleComplete = useCallback(() => {
        onComplete?.();
    }, [onComplete]);

    useEffect(() => {
        if (active) {
            setParticles(generateParticles(30));
            setIsVisible(true);

            const timer = setTimeout(() => {
                setIsVisible(false);
                handleComplete();
            }, duration);

            return () => clearTimeout(timer);
        }
        return undefined;
    }, [active, duration, handleComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
                    {particles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            initial={{
                                x: `${particle.x}vw`,
                                y: `${particle.y}vh`,
                                rotate: 0,
                                scale: 0,
                                opacity: 1,
                            }}
                            animate={{
                                y: '110vh',
                                rotate: particle.rotation + 720,
                                scale: particle.scale,
                                opacity: [1, 1, 0.8, 0],
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 1.5 + Math.random(),
                                delay: particle.delay,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                            style={{
                                position: 'absolute',
                                width: '10px',
                                height: '10px',
                                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                                backgroundColor: particle.color,
                            }}
                        />
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
}
