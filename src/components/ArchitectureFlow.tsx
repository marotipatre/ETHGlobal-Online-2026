"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Code, 
    Zap, 
    Network, 
    Server, 
    ArrowRight, 
    CheckCircle2,
    Play,
    RotateCcw,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Step {
    id: number;
    title: string;
    description: string;
    icon: typeof Code;
    color: string;
    chain: string;
    address?: string;
}

const steps: Step[] = [
    {
        id: 1,
        title: "User Application Contract",
        description: "Deploy your contract on Arc Chain",
        icon: Code,
        color: "bg-[var(--primary)]",
        chain: "Arc Chain",
        address: "0x5E6658ac6cBC9b0109C28BED00bC4Af0F0A3f1CD"
    },
    {
        id: 2,
        title: "Arc Executor",
        description: "Deploy Arc Executor for your contract on Arc Testnet",
        icon: Zap,
        color: "bg-[var(--secondary)]",
        chain: "Arc Testnet",
        address: "0x90Dfd581393104EAe03Fd349b4867A7E8F51313b"
    },
    {
        id: 3,
        title: "Arc Gateway",
        description: "Platform provides Arc Gateway on source chain",
        icon: Network,
        color: "bg-[var(--accent)]",
        chain: "Source Chain",
        address: "0xD5Bb85Ee81342ea97A240b21156d33cb3a4Df985"
    },
    {
        id: 4,
        title: "Relayer",
        description: "Set up off-chain relayer",
        icon: Server,
        color: "bg-[var(--tertiary)]",
        chain: "Off-Chain",
        address: "0xdAF0182De86F904918Db8d07c7340A1EfcDF8244"
    },
    {
        id: 5,
        title: "Connect Relayer",
        description: "Arc Executor sets Relayer address",
        icon: CheckCircle2,
        color: "bg-green-400",
        chain: "Arc Testnet",
    }
];

// Animated Arrow Component for Flowchart
function FlowchartArrow({ 
    isActive, 
    delay = 0,
    direction = "horizontal"
}: { 
    isActive: boolean; 
    delay?: number;
    direction?: "horizontal" | "vertical";
}) {
    return (
        <motion.div
            className={`relative flex items-center justify-center ${
                direction === "horizontal" ? "w-16 h-1" : "w-1 h-16"
            }`}
        >
            {/* Arrow Line */}
            <motion.div
                className={`absolute bg-black ${
                    direction === "horizontal" ? "w-full h-0.5" : "h-full w-0.5"
                }`}
                initial={{ scale: 0, opacity: 0 }}
                animate={isActive ? {
                    scale: 1,
                    opacity: 1,
                } : {
                    scale: 0,
                    opacity: 0,
                }}
                transition={{ 
                    duration: 0.6, 
                    delay,
                    type: "spring",
                    stiffness: 150,
                    damping: 20
                }}
                style={{ 
                    transformOrigin: direction === "horizontal" ? "left center" : "top center"
                }}
            />
            
            {/* Arrow Head */}
            {isActive && (
                <motion.div
                    className={`absolute ${
                        direction === "horizontal" 
                            ? "right-0 w-0 h-0 border-t-[6px] border-b-[6px] border-l-[12px] border-l-black border-t-transparent border-b-transparent"
                            : "bottom-0 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[12px] border-t-black border-l-transparent border-r-transparent"
                    }`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: delay + 0.3 }}
                />
            )}

            {/* Animated Particle */}
            {isActive && (
                <motion.div
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    initial={{ 
                        [direction === "horizontal" ? "left" : "top"]: "0%",
                        opacity: 1
                    }}
                    animate={{ 
                        [direction === "horizontal" ? "left" : "top"]: direction === "horizontal" ? "100%" : "100%",
                        opacity: [1, 1, 0]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                        delay: delay + 0.2
                    }}
                />
            )}
        </motion.div>
    );
}

// Flowchart Node Component
function FlowchartNode({ 
    step, 
    index, 
    isActive, 
    isCompleted, 
    isVisible,
    onClick 
}: { 
    step: Step;
    index: number;
    isActive: boolean;
    isCompleted: boolean;
    isVisible: boolean;
    onClick: () => void;
}) {
    const Icon = step.icon;

    return (
        <motion.div
            className="relative flex flex-col items-center cursor-pointer"
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{
                opacity: isVisible ? 1 : 0.3,
                scale: isVisible ? 1 : 0.7,
                y: isVisible ? 0 : 30,
            }}
            transition={{ 
                duration: 0.6, 
                delay: index * 0.2,
                type: "spring",
                stiffness: 150,
                damping: 20
            }}
            onClick={onClick}
            whileHover={!isActive ? { 
                scale: 1.05, 
                y: -5,
                transition: { duration: 0.2 }
            } : {}}
            whileTap={{ scale: 0.98 }}
        >
            {/* Flowchart Node Box */}
            <motion.div
                className={`${step.color} border-2 border-black rounded-lg p-6 min-w-[220px] max-w-[280px] shadow-[4px_4px_0px_0px_#000] relative overflow-hidden ${
                    isActive ? "ring-4 ring-yellow-400 ring-offset-2" : ""
                }`}
                animate={{
                    boxShadow: isActive 
                        ? ["4px 4px 0px 0px #000", "6px 6px 0px 0px #000", "4px 4px 0px 0px #000"]
                        : "4px 4px 0px 0px #000",
                }}
                transition={{
                    duration: 2,
                    repeat: isActive ? Infinity : 0,
                    ease: "easeInOut",
                }}
            >
                {/* Glow effect for active node */}
                {isActive && (
                    <motion.div
                        className="absolute inset-0 bg-yellow-400/20 rounded-lg"
                        animate={{
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                )}

                {/* Step Number Badge */}
                <div className="flex items-start justify-between mb-3 relative z-10">
                    <motion.div 
                        className="w-8 h-8 bg-black text-white rounded-md flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_#000]"
                        animate={isActive ? {
                            scale: [1, 1.15, 1],
                            rotate: [0, 5, -5, 0],
                        } : {}}
                        transition={{
                            duration: 1,
                            repeat: isActive ? Infinity : 0,
                            ease: "easeInOut",
                        }}
                    >
                        {step.id}
                    </motion.div>
                    {isCompleted && (
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ 
                                type: "spring", 
                                stiffness: 300,
                                damping: 20
                            }}
                        >
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </motion.div>
                    )}
                </div>

                {/* Icon */}
                <motion.div 
                    className="mb-3 relative z-10"
                    animate={isActive ? {
                        y: [0, -3, 0],
                        rotate: [0, 3, -3, 0],
                    } : {}}
                    transition={{
                        duration: 1.5,
                        repeat: isActive ? Infinity : 0,
                        ease: "easeInOut",
                    }}
                >
                    <Icon className="w-6 h-6 text-black" />
                </motion.div>

                {/* Title */}
                <motion.h3 
                    className="font-black text-base text-black mb-2 relative z-10"
                    animate={isActive ? {
                        scale: [1, 1.02, 1],
                    } : {}}
                    transition={{
                        duration: 1,
                        repeat: isActive ? Infinity : 0,
                    }}
                >
                    {step.title}
                </motion.h3>

                {/* Description */}
                <motion.p 
                    className="text-xs text-black/80 font-medium mb-3 relative z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isVisible ? 1 : 0.5 }}
                    transition={{ delay: 0.2 }}
                >
                    {step.description}
                </motion.p>

                {/* Chain Badge */}
                <motion.div 
                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-black/10 rounded border border-black/20 relative z-10"
                    whileHover={{ scale: 1.05 }}
                >
                    <Network className="w-3 h-3" />
                    <span className="text-xs font-bold text-black">
                        {step.chain}
                    </span>
                </motion.div>

                {/* Address */}
                {step.address && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{
                            opacity: isVisible ? 1 : 0,
                            height: isVisible ? "auto" : 0,
                            y: isVisible ? 0 : -10,
                        }}
                        transition={{ 
                            duration: 0.4,
                            delay: 0.3
                        }}
                        className="mt-3 text-xs font-mono text-black/60 bg-white/50 px-2 py-1 rounded border border-black/20 truncate relative z-10"
                    >
                        {step.address}
                    </motion.div>
                )}

                {/* Active Indicator */}
                {isActive && (
                    <>
                        <motion.div
                            className="absolute top-2 right-2 w-2.5 h-2.5 bg-yellow-400 rounded-full border-2 border-black z-20"
                            animate={{ 
                                scale: [1, 1.5, 1],
                                opacity: [1, 0.7, 1]
                            }}
                            transition={{ 
                                repeat: Infinity, 
                                duration: 1.5,
                                ease: "easeInOut"
                            }}
                        />
                        <motion.div
                            className="absolute top-2 right-2 w-2.5 h-2.5 bg-yellow-400 rounded-full border-2 border-black z-10"
                            animate={{ 
                                scale: [1, 2, 2],
                                opacity: [0.6, 0, 0]
                            }}
                            transition={{ 
                                repeat: Infinity, 
                                duration: 1.5,
                                ease: "easeOut"
                            }}
                        />
                    </>
                )}
            </motion.div>
        </motion.div>
    );
}

export function ArchitectureFlow() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (isPlaying && currentStep < steps.length) {
            const timer = setTimeout(() => {
                setCompletedSteps(prev => new Set([...prev, currentStep]));
                setCurrentStep(prev => prev + 1);
            }, 2500);

            return () => clearTimeout(timer);
        } else if (currentStep >= steps.length) {
            setIsPlaying(false);
        }
    }, [isPlaying, currentStep]);

    const handlePlay = () => {
        setCurrentStep(0);
        setCompletedSteps(new Set());
        setIsPlaying(true);
    };

    const handleReset = () => {
        setCurrentStep(0);
        setCompletedSteps(new Set());
        setIsPlaying(false);
    };

    const handleStepClick = (stepId: number) => {
        if (!isPlaying) {
            setCurrentStep(stepId);
            setCompletedSteps(new Set(Array.from({ length: stepId }, (_, i) => i)));
        }
    };

    return (
        <div className="w-full">
            {/* Controls */}
            <motion.div 
                className="flex items-center justify-center gap-4 mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                        onClick={handlePlay}
                        disabled={isPlaying}
                        variant="primary"
                        className="flex items-center gap-2"
                    >
                        <motion.div
                            animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                            transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
                        >
                            <Play className="w-4 h-4" />
                        </motion.div>
                        {isPlaying ? "Playing..." : "Play Animation"}
                    </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                        onClick={handleReset}
                        variant="secondary"
                        className="flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </Button>
                </motion.div>
            </motion.div>

            {/* Flowchart Container */}
            <motion.div 
                className="bg-white border-2 border-black rounded-xl p-8 md:p-12 shadow-[6px_6px_0px_0px_#000] relative overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <motion.div
                        className="absolute inset-0"
                        animate={{
                            backgroundPosition: ["0% 0%", "100% 100%"],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "linear",
                        }}
                        style={{
                            backgroundImage: "radial-gradient(circle, black 1px, transparent 1px)",
                            backgroundSize: "50px 50px",
                        }}
                    />
                </div>

                {/* Flowchart Flow - Horizontal Layout */}
                <div className="relative z-10 overflow-x-auto pb-4">
                    <div className="flex items-center justify-center min-w-max gap-4 md:gap-8 px-4">
                        {steps.map((step, index) => {
                            const isActive = currentStep === index;
                            const isCompleted = completedSteps.has(index);
                            const isVisible = index <= currentStep;
                            const showArrow = index < steps.length - 1;

                            return (
                                <div key={step.id} className="flex items-center">
                                    {/* Flowchart Node */}
                                    <FlowchartNode
                                        step={step}
                                        index={index}
                                        isActive={isActive}
                                        isCompleted={isCompleted}
                                        isVisible={isVisible}
                                        onClick={() => handleStepClick(index)}
                                    />

                                    {/* Arrow Connector */}
                                    {showArrow && (
                                        <FlowchartArrow
                                            isActive={isCompleted}
                                            delay={index * 0.3}
                                            direction="horizontal"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Progress Indicator */}
                <motion.div 
                    className="mt-8 pt-6 border-t-2 border-black relative z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <motion.span 
                            className="font-bold text-black"
                            animate={isPlaying ? {
                                scale: [1, 1.05, 1],
                            } : {}}
                            transition={{
                                duration: 1,
                                repeat: isPlaying ? Infinity : 0,
                            }}
                        >
                            Setup Progress
                        </motion.span>
                        <motion.span 
                            className="font-black text-black"
                            key={completedSteps.size}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            {completedSteps.size} / {steps.length}
                        </motion.span>
                    </div>
                    <div className="w-full h-4 bg-white border-2 border-black rounded-full overflow-hidden shadow-[2px_2px_0px_0px_#000]">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width: `${(completedSteps.size / steps.length) * 100}%`,
                            }}
                            transition={{ 
                                duration: 0.8,
                                type: "spring",
                                stiffness: 100,
                                damping: 20
                            }}
                            className="h-full bg-[var(--primary)] relative overflow-hidden"
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                animate={{
                                    x: ["-100%", "100%"],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                            />
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Step-by-step Instructions */}
            <motion.div 
                className="mt-8 bg-[var(--secondary)] border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_#000] relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                {/* Animated background pattern */}
                <motion.div
                    className="absolute inset-0 opacity-5"
                    animate={{
                        backgroundPosition: ["0% 0%", "100% 100%"],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "linear",
                    }}
                    style={{
                        backgroundImage: "linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black), linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black)",
                        backgroundSize: "30px 30px",
                        backgroundPosition: "0 0, 15px 15px",
                    }}
                />
                
                <motion.h3 
                    className="font-black text-xl text-black mb-4 relative z-10 flex items-center gap-2"
                    key={`title-${currentStep}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.span
                        animate={isPlaying ? {
                            rotate: [0, 10, -10, 0],
                        } : {}}
                        transition={{
                            duration: 1,
                            repeat: isPlaying ? Infinity : 0,
                            ease: "easeInOut",
                        }}
                    >
                        <Sparkles className="w-5 h-5" />
                    </motion.span>
                    Current Step: {currentStep < steps.length ? steps[currentStep].title : "Complete!"}
                </motion.h3>
                
                <AnimatePresence mode="wait">
                    {currentStep < steps.length && (
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: -30, y: 10 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            exit={{ opacity: 0, x: 30, y: -10, scale: 0.9 }}
                            transition={{ 
                                duration: 0.5,
                                type: "spring",
                                stiffness: 200,
                                damping: 20
                            }}
                            className="relative z-10"
                        >
                            <motion.p 
                                className="text-black/80 font-medium"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                {steps[currentStep].description}
                            </motion.p>
                            {steps[currentStep].address && (
                                <motion.div 
                                    className="mt-3 p-3 bg-white/50 border border-black/20 rounded-md"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <motion.p 
                                        className="text-xs font-mono text-black break-all"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        Address: {steps[currentStep].address}
                                    </motion.p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                    {currentStep >= steps.length && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ 
                                duration: 0.8,
                                type: "spring",
                                stiffness: 200,
                                damping: 15
                            }}
                            className="text-center relative z-10"
                        >
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 10, -10, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                            </motion.div>
                            <motion.p 
                                className="font-black text-xl text-black"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                Architecture Setup Complete! 🎉
                            </motion.p>
                            <motion.p 
                                className="text-black/80 font-medium mt-2"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                Your application is now ready to accept intents from any source chain.
                            </motion.p>
                            {/* Celebration particles */}
                            {[...Array(12)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                                    initial={{
                                        x: "50%",
                                        y: "50%",
                                        scale: 0,
                                    }}
                                    animate={{
                                        x: `${50 + Math.cos((i / 12) * Math.PI * 2) * 100}%`,
                                        y: `${50 + Math.sin((i / 12) * Math.PI * 2) * 100}%`,
                                        scale: [0, 1, 0],
                                        opacity: [1, 1, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.1,
                                        ease: "easeOut",
                                    }}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
