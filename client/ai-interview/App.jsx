import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, StopCircle, RefreshCw, CheckCircle, AlertTriangle, Star, BarChart3, MessageSquare, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INTERVIEW_LIMIT_SECONDS = 180; // 3 minutes

const App = () => {
    const [step, setStep] = useState('welcome'); // welcome, recording, processing, results
    const [timeLeft, setTimeLeft] = useState(INTERVIEW_LIMIT_SECONDS);
    const [isRecording, setIsRecording] = useState(false);
    const [videoUrl, setVideoUrl] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState(null);
    const [isAvatarMode, setIsAvatarMode] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState("Explain your technical skills and a project you worked on recently.");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [turnCount, setTurnCount] = useState(1);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [fillerPhrase, setFillerPhrase] = useState("");

    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const fullTranscriptRef = useRef("");
    const turnTranscriptRef = useRef("");
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    // Initial webcam setup
    useEffect(() => {
        if (step === 'recording' && !isRecording) {
            startWebcam();
        }
        return () => stopWebcam();
    }, [step]);

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError("Could not access webcam or microphone. Please check permissions.");
        }
    };

    const stopWebcam = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const fetchNewQuestion = async () => {
        try {
            const response = await fetch('/api/interview/generate-question');
            const data = await response.json();
            if (data.question) {
                setCurrentQuestion(data.question);
                return data.question;
            }
        } catch (err) {
            console.error("Failed to fetch dynamic question:", err);
        }
        return currentQuestion;
    };

    const speakQuestion = (text) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to find a professional female voice
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Samantha'));
        if (femaleVoice) utterance.voice = femaleVoice;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const handleStartInterviewFlow = async () => {
        if (isAvatarMode) {
            setStep('processing'); // Visual feedback for question generation
            await fetchNewQuestion();
            setStep('recording');
        } else {
            setStep('recording');
        }
    };

    const initSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("Speech Recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript;
            
            if (result.isFinal) {
                turnTranscriptRef.current += " " + transcript;
                fullTranscriptRef.current += " " + transcript;
            }

            // Reset silence timer on every speech result
            if (isRecording) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => {
                    handleSilenceDetected();
                }, 3000); // 3 seconds silence
            }
        };

        recognition.onend = () => {
            if (isRecording) recognition.start(); // Keep it alive during recording
        };

        recognitionRef.current = recognition;
    };

    const handleSilenceDetected = async () => {
        if (!isRecording || isSpeaking || turnCount >= 5) return;

        console.log("Silence detected. Generating next question...");
        const transcript = turnTranscriptRef.current.trim();
        turnTranscriptRef.current = ""; // Clear for next turn

        try {
            const response = await fetch('/api/interview/chat-next', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript,
                    history: sessionHistory,
                    currentQuestion
                })
            });

            const data = await response.json();
            if (data.next_question) {
                const newHistory = [...sessionHistory, { 
                    question: currentQuestion, 
                    transcript,
                    is_correct: true, // Placeholder until final analysis
                    technical_score: 5,
                    communication_score: 5,
                    confidence_score: 5,
                    overall_score: 5,
                    accuracy_notes: "Real-time acknowledgement",
                    strengths: [],
                    weaknesses: []
                }];
                setSessionHistory(newHistory);
                setTurnCount(prev => prev + 1);
                setCurrentQuestion(data.next_question);
                setFillerPhrase(data.filler_phrase);
                
                speakQuestion(`${data.filler_phrase}. ${data.next_question}`);
            }
        } catch (err) {
            console.error("Failed to fetch next question during silence:", err);
        }
    };

    const startRecording = () => {
        const stream = videoRef.current.srcObject;
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            setVideoUrl(URL.createObjectURL(blob));
            uploadAndAnalyze(blob);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        startTimer();

        // Initialize and start Speech Recognition
        if (isAvatarMode) {
            initSpeechRecognition();
            recognitionRef.current.start();
            speakQuestion(currentQuestion);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
            setStep('processing');
        }
    };

    const startTimer = () => {
        setTimeLeft(INTERVIEW_LIMIT_SECONDS);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    stopRecording();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const uploadAndAnalyze = async (blob) => {
        const formData = new FormData();
        formData.append('video', blob, 'turn.webm');
        formData.append('studentId', 'temp-student-id');
        formData.append('turnCount', turnCount);
        formData.append('history', JSON.stringify(sessionHistory));
        formData.append('currentQuestion', currentQuestion);

        try {
            const response = await fetch('/api/interview/analyze-interview', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Analysis failed');

            const data = await response.json();
            const turnAnalysis = data.analysis;
            
            // Collect this turn's result
            const newHistory = [...sessionHistory, { ...turnAnalysis, question: currentQuestion }];
            setSessionHistory(newHistory);

            if (isAvatarMode && turnCount < 5 && turnAnalysis.next_question) {
                // Legacy check - in hands-free mode this shouldn't be reached often
                setTurnCount(prev => prev + 1);
                setCurrentQuestion(turnAnalysis.next_question);
                setFillerPhrase(turnAnalysis.filler_phrase || "Got it.");
                setStep('recording');
            } else {
                setAnalysis(turnAnalysis);
                setStep('results');
                if (recognitionRef.current) recognitionRef.current.stop();
            }
        } catch (err) {
            setError("Analysis failed. Please try again.");
            setStep('welcome');
        }
    };

    // Special handler for Turn 5 finish
    useEffect(() => {
        if (isAvatarMode && isRecording && turnCount === 5) {
            // Automatically stop after a bit of silence on the last question
            const checkFinal = setTimeout(() => {
                if (isRecording) stopRecording();
            }, 10000); // 10s auto-stop for final wrap up
            return () => clearTimeout(checkFinal);
        }
    }, [turnCount, isRecording, isAvatarMode]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="app-wrapper" style={{ background: 'var(--bg-main)', minHeight: '100vh', display: 'flex' }}>
            {/* Unified Sidebar (Simplified for React) */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src="https://shardauniversity.com/img/logo-mobile.png" style={{ height: '40px', filter: 'brightness(0) invert(1)', marginBottom: '10px', display: 'block' }} />
                    Sharda Skills
                </div>
                <nav>
                    <a href="/" className="sidebar-link"><span>🏠</span> Home Portal</a>
                    <a href="/admin/index.html" className="sidebar-link text-white"><span>📈</span> Analytics Hub</a>
                    <a href="/ai-interview/index.html" className="sidebar-link active"><span>🤖</span> AI Interview</a>
                    <a href="/student/index.html" className="sidebar-link"><span>👤</span> Personal Records</a>
                </nav>
            </aside>

            <div className="main-container" style={{ flex: 1, marginLeft: '280px' }}>
                <header className="top-header" style={{ height: '80px', display: 'flex', alignItems: 'center', padding: '0 3rem', background: 'white', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ fontWeight: 900, letterSpacing: '-1px' }}>AI INTERVIEW LAB</h2>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-main)', padding: '5px 15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: isAvatarMode ? 'var(--primary)' : 'var(--text-muted)' }}>AVATAR MODE</span>
                            <div 
                                onClick={() => setIsAvatarMode(!isAvatarMode)}
                                style={{ width: '40px', height: '20px', background: isAvatarMode ? 'var(--primary)' : '#ccc', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}
                            >
                                <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: isAvatarMode ? '22px' : '2px', transition: '0.3s' }} />
                            </div>
                        </div>
                        <span className="badge" style={{ background: 'var(--primary)', color: 'white' }}>GEMINI 3 FLASH</span>
                    </div>
                </header>

                <main className="main-content" style={{ padding: '3rem' }}>
                    <AnimatePresence mode="wait">
                        {step === 'welcome' && (
                            <motion.div 
                                key="welcome"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="card"
                                style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '4rem' }}
                            >
                                <div style={{ background: 'rgba(79, 70, 229, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', margin: '0 auto 2rem' }}>
                                    <Video size={40} color="var(--primary)" />
                                </div>
                                <h1 style={{ fontWeight: 950, fontSize: '2.5rem', marginBottom: '1rem' }}>Technical Interview Analysis</h1>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>
                                    You have **3 minutes** to explain your technical skills and a project you've worked on. 
                                    Our AI will analyze your communication, confidence, and technical depth.
                                </p>
                                {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', fontWeight: 800 }}>{error}</div>}
                                <button className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }} onClick={handleStartInterviewFlow}>
                                    Start Interview
                                </button>
                            </motion.div>
                        )}

                        {step === 'recording' && (
                            <motion.div 
                                key="recording"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="recording-view"
                                style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}
                            >
                                <div className="video-card card" style={{ padding: '1rem', background: '#000', overflow: 'hidden', height: '500px', position: 'relative' }}>
                                    <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                                    
                                    <div style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '99px', backdropFilter: 'blur(10px)', color: 'white' }}>
                                        <div className={`pulse-icon ${isRecording ? 'pulse' : ''}`} style={{ background: isRecording ? 'var(--error)' : 'var(--text-muted)' }} />
                                        <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{isRecording ? 'LIVE RECORDING' : 'WITCHING WEBCAM...'}</span>
                                        {isAvatarMode && <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>| TURN {turnCount}/5</span>}
                                    </div>

                                    {isRecording && (
                                        <div style={{ position: 'absolute', top: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                                            <div style={{ color: 'white', background: 'rgba(239, 68, 68, 0.9)', padding: '8px 24px', borderRadius: '12px', fontWeight: 900, fontSize: '1.5rem' }}>
                                                {formatTime(timeLeft)}
                                            </div>
                                            {isAvatarMode && !isSpeaking && (
                                                <div style={{ background: 'rgba(16, 185, 129, 0.8)', color: 'white', padding: '5px 15px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, animation: 'pulse 1s infinite' }}>
                                                    AVATAR IS LISTENING...
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* AI Avatar Overlay */}
                                    <AnimatePresence>
                                        {isAvatarMode && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                style={{ position: 'absolute', bottom: '2rem', right: '2rem', width: '150px', height: '150px', borderRadius: '50%', border: '4px solid var(--primary)', overflow: 'hidden', background: '#222', zIndex: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                            >
                                                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isSpeaking ? 1 : 0.7, transform: isSpeaking ? 'scale(1.05)' : 'scale(1)', transition: '0.3s' }} />
                                                {isSpeaking && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'var(--primary)', animation: 'pulse 1s infinite' }} />}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Captions Overlay */}
                                    <AnimatePresence>
                                        {isAvatarMode && isSpeaking && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '190px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', color: 'white', padding: '1.5rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, borderLeft: '4px solid var(--primary)', zIndex: 11 }}
                                            >
                                                {isSpeaking && fillerPhrase ? `"${fillerPhrase}"` : currentQuestion}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="controls-card card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <h3 style={{ fontWeight: 900 }}>{isAvatarMode ? "AI Avatar Question" : "Standard Question"}</h3>
                                    <div style={{ background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, borderLeft: '4px solid var(--primary)', minHeight: '100px' }}>
                                        {currentQuestion}
                                    </div>

                                    <div style={{ marginTop: 'auto' }}>
                                        {!isRecording ? (
                                            <button className="btn btn-primary" style={{ width: '100%', padding: '1.2rem' }} onClick={startRecording}>
                                                Start Recording
                                            </button>
                                        ) : (
                                            <button className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', background: 'var(--error)' }} onClick={stopRecording}>
                                                Stop Interview
                                            </button>
                                        )}
                                        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1rem', fontWeight: 700 }}>
                                            Session will auto-stop after 3:00
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 'processing' && (
                            <motion.div 
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ textAlign: 'center', padding: '5rem 0' }}
                            >
                                <div className="loading-spinner" style={{ margin: '0 auto 2rem', border: '4px solid var(--border)', borderTop: '4px solid var(--primary)', borderRadius: '50%', width: '60px', height: '60px', animation: 'spin 1s linear infinite' }} />
                                <h2 style={{ fontWeight: 950, fontSize: '2rem' }}>{isAvatarMode ? `Processing Turn ${turnCount}` : 'Analyzing Your Response'}</h2>
                                <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Gemini is evaluating your technical depth...</p>
                            </motion.div>
                        )}

                        {step === 'results' && (
                            <motion.div 
                                key="results"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}
                            >
                                <div className="left-panel">
                                    <div style={{ background: 'rgba(79, 70, 229, 0.05)', border: '1px solid rgba(79, 70, 229, 0.2)', padding: '10px 15px', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }} />
                                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase' }}>Session Complete: 5 Turns Analyzed</span>
                                    </div>

                                    <div className="card" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                                            <BarChart3 color="var(--primary)" />
                                            <h3 style={{ fontWeight: 950 }}>Aggregate Session Performance</h3>
                                        </div>

                                        {sessionHistory.length > 0 && (
                                            <div style={{ background: 'var(--bg-main)', padding: '15px', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.6, marginBottom: '4px' }}>TECHNICAL ACCURACY RATE</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 950, color: (sessionHistory.filter(h => h.is_correct).length / sessionHistory.length) > 0.7 ? 'var(--success)' : 'var(--error)' }}>
                                                    {Math.round((sessionHistory.filter(h => h.is_correct).length / sessionHistory.length) * 100)}% Correct
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                            {[
                                                { label: 'Avg Technical', val: Math.round(sessionHistory.reduce((acc, curr) => acc + curr.technical_score, 0) / (sessionHistory.length || 1)) },
                                                { label: 'Avg Comm.', val: Math.round(sessionHistory.reduce((acc, curr) => acc + curr.communication_score, 0) / (sessionHistory.length || 1)) },
                                                { label: 'Avg Confidence', val: Math.round(sessionHistory.reduce((acc, curr) => acc + curr.confidence_score, 0) / (sessionHistory.length || 1)) },
                                                { label: 'Overall Metric', val: Math.round(sessionHistory.reduce((acc, curr) => acc + curr.overall_score, 0) / (sessionHistory.length || 1)), primary: true }
                                            ].map(score => (
                                                <div key={score.label} className="score-box" style={{ background: score.primary ? 'var(--primary)' : 'var(--bg-main)', color: score.primary ? 'white' : 'inherit', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.8, textTransform: 'uppercase', marginBottom: '5px' }}>{score.label}</div>
                                                    <div style={{ fontSize: '2rem', fontWeight: 950 }}>{score.val}/10</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => window.location.reload()}>
                                        Start New Session
                                    </button>
                                </div>

                                <div className="right-panel">
                                    <div className="card" style={{ padding: '2rem', height: '100%', overflowY: 'auto', maxHeight: '700px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                                            <Zap color="var(--accent)" />
                                            <h3 style={{ fontWeight: 950 }}>Turn-by-Turn Breakdown</h3>
                                        </div>

                                        {sessionHistory.map((turn, i) => (
                                            <div key={i} style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                    <span style={{ fontWeight: 900, fontSize: '0.7rem', color: 'var(--primary)' }}>TURN {i + 1}</span>
                                                    <span style={{ fontWeight: 900, fontSize: '0.7rem', color: turn.is_correct ? 'var(--success)' : 'var(--error)' }}>{turn.is_correct ? 'CORRECT' : 'INCORRECT'}</span>
                                                </div>
                                                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '10px' }}>Q: {turn.question}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '10px' }}>"{turn.accuracy_notes}"</div>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    {turn.strengths.slice(0, 2).map((s, si) => (
                                                        <span key={si} style={{ fontSize: '0.6rem', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '4px', fontWeight: 800 }}>{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .pulse { animation: pulseAnim 2s infinite; }
                @keyframes pulseAnim {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
        </div>
    );
};

export default App;
