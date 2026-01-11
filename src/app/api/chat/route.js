'use server';

export async function POST(req) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response(
                JSON.stringify({ error: 'Messages array is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const apiKey = 'AIzaSyCkZOcGJ031749NIWMLQPF-m1Cr4BxIEmk';
        const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

        // Extract phone/email
        let userPhone = null;
        let userEmail = null;

        for (const msg of messages) {
            const phoneMatch = msg.content.match(/\b\d{10}\b/);
            const emailMatch = msg.content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
            if (phoneMatch) userPhone = phoneMatch[0];
            if (emailMatch) userEmail = emailMatch[0];
        }

        let contextData = '';

        // Helper function
        async function fetchAPI(endpoint, queryParams = '') {
            try {
                const url = `http://localhost:3000/api/${endpoint}${queryParams ? '?' + queryParams : ''}`;
                const response = await fetch(url);
                if (response.ok) {
                    return await response.json();
                }
            } catch (err) {
                console.log(`Error fetching ${endpoint}:`, err);
            }
            return null;
        }

        // WALLET
        if (lastUserMessage.includes('wallet') || lastUserMessage.includes('balance')) {
            if (userPhone || userEmail) {
                const query = userPhone ? `phone=${userPhone}` : `email=${userEmail}`;
                const data = await fetchAPI('wallet', query);

                if (data?.success && data.walletBalance !== undefined) {
                    contextData += `\n\nWALLET: ₹${data.walletBalance}. Tell user their wallet balance is ₹${data.walletBalance}.`;
                }
            } else {
                contextData += `\n\nAsk for phone number to check wallet.`;
            }
        }

        // BOOKINGS
        if (lastUserMessage.includes('booking') || lastUserMessage.includes('appointment')) {
            if (userPhone || userEmail) {
                const query = userPhone ? `phone=${userPhone}` : `email=${userEmail}`;
                const data = await fetchAPI('bookings', query);

                if (data?.success && data.bookings && Array.isArray(data.bookings) && data.bookings.length > 0) {
                    contextData += `\n\nBOOKINGS (${data.bookings.length}):`;
                    data.bookings.slice(0, 3).forEach((b, i) => {
                        contextData += `\n${i + 1}. ${b.testName || 'Test'} at ${b.labName || 'Lab'} on ${b.appointmentDate || 'Date'} ${b.formattedTime || ''}`;
                    });
                } else {
                    contextData += `\n\nNo bookings found.`;
                }
            } else {
                contextData += `\n\nAsk for phone to check bookings.`;
            }
        }

        // TESTS
        if (lastUserMessage.includes('test') && !lastUserMessage.includes('booking')) {
            const data = await fetchAPI('tests');
            if (data?.success && data.tests && Array.isArray(data.tests) && data.tests.length > 0) {
                contextData += `\n\nTESTS (${data.tests.length} available):`;
                data.tests.slice(0, 5).forEach((t, i) => {
                    contextData += `\n${i + 1}. ${t.testName} - ₹${t.price}`;
                });
            }
        }

        // PACKAGES
        if (lastUserMessage.includes('package')) {
            const data = await fetchAPI('health-packages');
            if (data?.success && data.packages && Array.isArray(data.packages) && data.packages.length > 0) {
                contextData += `\n\nPACKAGES:`;
                data.packages.slice(0, 3).forEach((p, i) => {
                    contextData += `\n${i + 1}. ${p.packageName} - ₹${p.price}`;
                });
            }
        }

        const systemPrompt = `You are Rights Diagnostics AI - a helpful healthcare assistant.

Be warm and professional. Use real data from context below when available.

${contextData}`;

        const contents = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : m.role,
            parts: [{ text: m.content }]
        }));

        const requestBody = {
            systemInstruction: {
                role: 'system',
                parts: [{ text: systemPrompt }]
            },
            contents
        };

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const apiResponse = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!apiResponse.ok) {
            const errText = await apiResponse.text();
            console.error('Gemini API error:', apiResponse.status, errText);
            return new Response(
                JSON.stringify({
                    error: 'Gemini API request failed',
                    status: apiResponse.status,
                    details: errText
                }),
                { status: 502, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const data = await apiResponse.json();
        const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(assistantText));
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive'
            }
        });
    } catch (err) {
        console.error('Chat route error:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: err.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
