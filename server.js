const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: Replace 'your-api-key-here' with your actual OpenAI API key
const openai = new OpenAI({
    apiKey: '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' // PUT YOUR API KEY HERE
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'MediReport AI Backend is running!' });
});

// Main analysis endpoint
app.post('/analyze', async (req, res) => {
    try {
        const { reportText } = req.body;

        if (!reportText || reportText.trim().length < 50) {
            return res.status(400).json({ 
                error: 'Report text is too short or empty' 
            });
        }

        console.log('Analyzing report... (text length:', reportText.length, 'characters)');

        // Call OpenAI API with detailed medical analysis prompt
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost-effective model
            messages: [
                {
                    role: "system",
                    content: `You are an expert medical report analyzer. Analyze medical reports and provide comprehensive explanations in simple, easy-to-understand language for patients.

Your response MUST be a valid JSON object with this exact structure:
{
  "reportType": "string",
  "confidence": number (70-95),
  "whyTestDone": "detailed explanation (3-4 sentences)",
  "mainFindings": ["finding 1", "finding 2", "finding 3", ...],
  "positiveFindings": ["positive 1", "positive 2", ...],
  "negativeFindings": ["concern 1", "concern 2", ...],
  "worryLevel": "low" | "medium" | "high",
  "shouldWorry": "clear answer with reasoning (2-3 sentences)",
  "stage": "stage description",
  "severity": "severity description",
  "treatability": "treatability description",
  "treatmentApproach": "treatment overview (2-3 sentences)",
  "medicines": [
    {
      "name": "Medicine name (Brand name)",
      "purpose": "what it treats",
      "dosage": "dosage amount",
      "timing": "when to take",
      "duration": "how long",
      "effects": "expected effects",
      "notes": "important notes"
    }
  ],
  "diet": [
    {
      "category": "Category name",
      "items": ["item 1", "item 2", ...]
    }
  ],
  "exercise": [
    {
      "category": "Category name",
      "activities": ["activity 1", "activity 2", ...]
    }
  ],
  "nextSteps": [
    {
      "step": "step title",
      "actions": ["action 1", "action 2", ...]
    }
  ],
  "finalSummary": "comprehensive summary in simple language (5-8 sentences)",
  "specialtyNeeded": "specialist type"
}

IMPORTANT RULES:
1. Base your analysis ONLY on the actual report content
2. Be specific about findings mentioned in the report
3. If values are mentioned (like Hb 10.5), reference them specifically
4. Provide detailed, practical advice
5. Use simple language that patients can understand
6. Your ENTIRE response must be valid JSON - no text before or after`
                },
                {
                    role: "user",
                    content: `Please analyze this medical report and provide a comprehensive explanation:

${reportText}

Remember: Respond ONLY with valid JSON. Extract actual findings from the report and provide specific, detailed analysis based on what's written in the report.`
                }
            ],
            temperature: 0.3,
            max_tokens: 3000
        });

        const aiResponse = completion.choices[0].message.content;
        console.log('AI Response received, length:', aiResponse.length);

        // Parse the JSON response
        let analysis;
        try {
            let cleanResponse = aiResponse.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            }
            if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/```\n?/g, '');
            }
            
            analysis = JSON.parse(cleanResponse);
            console.log('Analysis parsed successfully');
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            return res.status(500).json({ 
                error: 'Failed to parse AI response',
                details: parseError.message
            });
        }

        res.json({
            success: true,
            analysis: analysis,
            tokensUsed: completion.usage.total_tokens
        });

    } catch (error) {
        console.error('Analysis Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to analyze report',
            details: error.message 
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ MediReport AI Backend running!`);
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`\n⚠️  IMPORTANT: Add your OpenAI API key in server.js\n`);
});
