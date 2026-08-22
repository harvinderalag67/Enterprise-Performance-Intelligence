const GEMINI_MODEL = "gemini-3.1-pro-preview";

export async function secureAnalyze(req, res, next) {
    try {
        const { documentText, blueprintConfig = {} } = req.body;

        if (
            typeof documentText !== "string" ||
            documentText.trim().length === 0
        ) {
            return res.status(400).json({
                error: "No financial statement text was provided."
            });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return res.status(500).json({
                error: "AI service is not configured."
            });
        }

        const operationalMandate = `
You are the core analytical engine of the Enterprise Performance Intelligence Platform.

Your task is to analyze the provided corporate financial statement text.

You must:

1. Identify the corporate legal entity name if it can be established from the evidence.
2. Identify the industry sector and operational context if supported by the evidence.
3. Evaluate the available financial evidence against the supplied diagnostic blueprint configuration.
4. Identify potential Value Lost, Value Destroyed, and Value Delayed only where supported by the supplied evidence.
5. Do not invent financial facts, company details, industry information, or diagnostic findings.

Return only a valid JSON object matching this structure:

{
  "company_name": "Identified company name or Not established",
  "total_leaks": "Calculated figure or Not established",
  "trapped_liquidity": "Calculated figure or Not established",
  "confidence_score": "Percentage",
  "global_rationale": "Evidence-based executive synthesis",
  "action_directives": [
    {
      "code": "PB-XXX",
      "headline": "Diagnostic finding",
      "executive_owner": "CFO, COO, CCO, or other appropriate owner",
      "ledger_evidence": "Specific evidence from the supplied financial data",
      "operational_mandate": "Evidence-based recommended action"
    }
  ]
}

If the supplied evidence is insufficient for a conclusion, explicitly state that the relevant item is "Not established".

Diagnostic blueprint configuration:

${JSON.stringify(blueprintConfig)}
`;

        const apiTargetUrl =
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

        const geminiResponse = await fetch(apiTargetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [
                        {
                            text: operationalMandate
                        }
                    ]
                },
                contents: [
                    {
                        parts: [
                            {
                                text:
                                    `Raw Corporate Financial Dataset:\n\n${documentText}`
                            }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!geminiResponse.ok) {
            const providerError = await geminiResponse.text();

            console.error(
                "EPI AI provider request failed:",
                geminiResponse.status,
                providerError
            );

            return res.status(502).json({
                error: "AI analysis service is temporarily unavailable."
            });
        }

        const geminiData = await geminiResponse.json();

        const textResult =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResult) {
            console.error(
                "Gemini returned no usable analysis content:",
                JSON.stringify(geminiData)
            );

            return res.status(502).json({
                error: "AI analysis service returned an invalid response."
            });
        }

        let parsedReport;

        try {
            parsedReport = JSON.parse(textResult);
        } catch (parseError) {
            console.error(
                "Unable to parse Gemini analysis response:",
                textResult
            );

            return res.status(502).json({
                error: "AI analysis service returned an invalid response."
            });
        }

        return res.status(200).json(parsedReport);

    } catch (error) {
        next(error);
    }
}