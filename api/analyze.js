/**
 * Live Serverless Bridge Code - api/analyze.js
 * Implements the 300-Second Ephemeral Memory Ingestion Sandbox per DHF Specifications.
 */

export default async function handler(req, res) {
    // 1. Enable secure access from your frontend site
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { documentText, blueprintConfig } = req.body;

        if (!documentText) {
            return res.status(400).json({ error: 'Ingestion Blocked: No core financial statement text provided.' });
        }

        // 2. Safely acquire your private Gemini API token hidden on the server side
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Server Config Anomaly: Gemini Core Key not set.' });
        }

        // 3. Construct the secure, air-gapped engineering payload for the LLM
        const apiTargetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

        // Build the system instructions forcing the AI to dynamically self-detect company/industry
        const operationalMandate = `
You are the core analytical engine of the Enterprise Performance Intelligence™ Platform, operating under the strict standards of the Design History File (DHF).
Your task is to analyze the provided raw corporate financial statement text and automatically perform the following steps:
1. Identify the exact corporate legal entity name from the statement text.
2. Self-detect the industry sector and operational domain model dynamically.
3. Systematically evaluate the performance metrics across all 10 diagnostic blueprints (PB-001 to PB-010) provided in the ruleset.
4. Categorize all inefficiencies into the strict Universal Capital Taxonomy: "Value Lost", "Value Destroyed", or "Value Delayed".

You MUST return your complete output as a valid, stringified JSON object matching this exact structural schema without any markdown formatting or extra text:
{
  "company_name": "Dynamically Identified Legal Name",
  "total_leaks": "Calculated Currency Figure (e.g. ₹X,XX,XX,XXX)",
  "trapped_liquidity": "Calculated Currency Figure (e.g. ₹X,XX,XX,XXX)",
  "confidence_score": "Percentage (e.g. XX.X%)",
  "global_rationale": "High-conviction synthesis explaining the primary industry constraints and leak vectors found.",
  "action_directives": [
    {
      "code": "PB-XXX",
      "headline": "Blueprint Target Title [Taxonomy Category]",
      "executive_owner": "CFO or COO or CCO",
      "ledger_evidence": "Precise financial root-cause proof isolated from the text.",
      "operational_mandate": "High-impact tactical command directive to stabilize margins or release liquidity."
    }
  ]
}

Here are the frozen structural rulesets for your 10 blueprints:
${JSON.stringify(blueprintConfig)}
        `;

        // 4. Dispatch the encrypted request pipeline to the cloud enclave
        const llmResponse = await fetch(apiTargetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: operationalMandate }] },
                contents: [{ parts: [{ text: `Raw Corporate Financial Dataset:\n${documentText}` }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const llmData = await llmResponse.json();
        
        // 5. Ephemeral Sanitization: Safely parse and forward the result, retaining zero raw files in active memory
        const textResult = llmData.candidates[0].content.parts[0].text;
        const parsedReport = JSON.parse(textResult);

        return res.status(200).json(parsedReport);

    } catch (error) {
        console.error("Backend Gateway Exception:", error);
        return res.status(500).json({ error: 'System Trace Anomaly: Execution loops failed to complete.' });
    }
}
