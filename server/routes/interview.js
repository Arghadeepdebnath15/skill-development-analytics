const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs');
const path = require('path');
const { supabase } = require('../db');

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `interview-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

// [NEW] Generate a fresh technical question
router.get('/generate-question', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });
        const prompt = "Generate one high-impact technical interview question for a software engineering student. Output only the question text.";
        const result = await model.generateContent(prompt);
        res.json({ question: result.response.text().trim() });
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
});

// [NEW] Fast text-to-text follow-up generation for hands-free mode
router.post('/chat-next', async (req, res) => {
    const { transcript, history, currentQuestion } = req.body;
    try {
        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });
        const prompt = `
        System: Professional Technical Interviewer. Generate a follow-up.
        History: ${JSON.stringify(history)}
        Latest Question: "${currentQuestion}"
        Latest Answer: "${transcript}"
        
        Output JSON:
        {
          "filler_phrase": "Conversational filler acknowledging the answer",
          "next_question": "Challenging technical follow-up"
        }
        Strictly JSON output.
        `;
        
        const result = await model.generateContent(prompt);
        const jsonStr = result.response.text().replace(/```json|```/g, '').trim();
        res.json(JSON.parse(jsonStr));
    } catch (err) {
        console.error('Chat Followup Error:', err);
        res.status(500).json({ error: 'Failed to generate follow-up' });
    }
});

router.post('/analyze-interview', upload.single('video'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No video file provided' });
    }

    const { studentId, turnCount, history, currentQuestion: prevQuestion } = req.body;
    const videoPath = req.file.path;
    const turn = parseInt(turnCount) || 1;
    const parsedHistory = history ? JSON.parse(history) : [];

    try {
        console.log(`--- Phase 1: Turn ${turn} Analysis ---`);
        const uploadResult = await fileManager.uploadFile(videoPath, {
            mimeType: req.file.mimetype || 'video/mp4',
            displayName: `Turn ${turn} Recording`,
        });

        // Wait for file to be processed
        let file = await fileManager.getFile(uploadResult.file.name);
        while (file.state === "PROCESSING") {
            process.stdout.write(".");
            await new Promise((resolve) => setTimeout(resolve, 2000));
            file = await fileManager.getFile(uploadResult.file.name);
        }

        if (file.state === "FAILED") throw new Error("Video processing failed.");

        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });
        
        console.log('--- Phase 2: Transcribing & Evaluating Turn ---');
        const prompt = `
        System: You are a professional technical interviewer. Evaluate the candidate's last answer and generate a follow-up.
        
        Session History: ${JSON.stringify(parsedHistory)}
        Current Technical Question: "${prevQuestion || "Explain your technical skills"}"
        
        Analyze the audio/video provided for this exact turn.
        
        Give output in JSON format exactly as follows:
        {
          "transcript": "exact transcription of the audio",
          "technical_score": number (0-10),
          "communication_score": number (0-10),
          "confidence_score": number (0-10),
          "overall_score": number (0-10),
          "is_correct": boolean,
          "accuracy_notes": "one sentence explaining technical correctness",
          "strengths": ["point1", "point2"],
          "weaknesses": ["point1", "point2"],
          "final_feedback": "short paragraph about this turn",
          "filler_phrase": "A naturally spoken, supportive filler phrase (e.g. 'That's a solid explanation of X', 'Interesting approach to Y', 'I see your point about Z')",
          "next_question": "A contextually relevant technical follow-up question that tests deeper knowledge. If turn count is 4, make it a final challenging question. If turn count is 5, set this to null."
        }

        Critical Instructions:
        1. Zero Bias: Be extremely strict.
        2. Technical Focus: Prioritize correctness over confidence.
        3. Continuity: Ensure 'next_question' feels like a natural progression from the candidate's previous response.
        `;

        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResult.file.mimeType,
                    fileUri: uploadResult.file.uri,
                },
            },
            { text: prompt },
        ]);

        let evalJson;
        try {
            const rawText = result.response.text();
            const jsonStr = rawText.replace(/```json|```/g, '').trim();
            evalJson = JSON.parse(jsonStr);
        } catch (e) {
            console.error('Failed to parse evaluation JSON:', e);
            throw new Error('AI returned malformed analysis results.');
        }

        const transcript = evalJson.transcript;

        console.log('--- Phase 4: Saving to Supabase ---');
        
        // Validate UUID for studentId to avoid DB errors
        const isValidUUID = (uuid) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
        const finalStudentId = (studentId && isValidUUID(studentId)) ? studentId : null;

        const { data, error } = await supabase
            .from('interview_results')
            .insert([{
                student_id: finalStudentId,
                transcript: transcript,
                scores: {
                    technical: evalJson.technical_score,
                    communication: evalJson.communication_score,
                    confidence: evalJson.confidence_score,
                    overall: evalJson.overall_score
                },
                strengths: evalJson.strengths,
                weaknesses: evalJson.weaknesses,
                final_feedback: evalJson.final_feedback
            }])
            .select();

        if (error) throw error;

        // Cleanup local file
        fs.unlinkSync(videoPath);

        res.json({
            success: true,
            analysis: evalJson,
            databaseId: data[0].id
        });

    } catch (err) {
        console.error('CRITICAL: Interview Analysis Failed');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        console.error('Error Stack:', err.stack);
        
        // Cleanup on error
        if (videoPath && fs.existsSync(videoPath)) {
            try { fs.unlinkSync(videoPath); } catch(e) {}
        }
        res.status(500).json({ 
            error: 'Interview analysis failed', 
            details: err.message,
            phase: 'Internal Server Error' 
        });
    }
});

module.exports = router;
