const apiKeyInput = document.getElementById("apiKey");
const promptInput = document.getElementById("prompt");
const askButton = document.getElementById("askBtn");
const loading = document.getElementById("loading");
const result = document.getElementById("result");
const errorMessage = document.getElementById("error");

async function askGemini() {
    const apiKey = apiKeyInput.value.trim();
    const prompt = promptInput.value.trim();

    errorMessage.textContent = "";

    if (!apiKey || !prompt) {
        errorMessage.textContent = "Enter your Gemini API key and a prompt.";
        if (!apiKey) apiKeyInput.focus();
        else promptInput.focus();
        return;
    }

    if (prompt.length > 4000) {
        errorMessage.textContent = "Keep your prompt under 4,000 characters.";
        return;
    }

    askButton.disabled = true;
    loading.style.display = "block";

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
                signal: AbortSignal.timeout(45_000)
            }
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error?.message || `Gemini request failed (${response.status}).`);
        }

        const answer = data.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("")
            .trim();

        if (!answer) {
            throw new Error("Gemini returned no text. Try a different prompt.");
        }

        result.textContent = answer;
    } catch (error) {
        errorMessage.textContent = error.name === "TimeoutError"
            ? "Gemini took too long to respond. Please try again."
            : error.message || "Could not reach Gemini. Check your connection and API key.";
    } finally {
        askButton.disabled = false;
        loading.style.display = "none";
    }
}

askButton.addEventListener("click", askGemini);

promptInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        askGemini();
    }
});