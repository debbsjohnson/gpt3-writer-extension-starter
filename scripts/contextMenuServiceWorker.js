const getKey = () => {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(["OPENAI_API_KEY"], (result) => {
			if (result["OPENAI_API_KEY"]) {
				const decodedKey = atob(result["OPENAI_API_KEY"]);
				resolve(decodedKey);
			}
		});
	});
};

const sendMessage = (content) => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const activeTab = tabs[0]?.id;

		chrome.tabs.sendMessage(
			activeTab,
			{ message: "inject", content },
			(response) => {
				if (response === "failed") {
					console.log("injection failed.");
				}
			}
		);
	});
};

const generate = async (prompt) => {
	// Get your API key from storage
	const key = await getKey();
	const url = "https://api.openai.com/v1/completions";

	const completionResponse = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${key}`,
		},
		body: JSON.stringify({
			model: "text-davinci-003",
			prompt: prompt,
			max_tokens: 1250,
			temperature: 0.7,
		}),
	});
  console.log('url fetched')


	const completion = await completionResponse.json()
  console.log(completion);
	return completion.choices.pop();
};

const generateCompletionAction = async (info) => {
	try {

		sendMessage("generating...");

		const { selectionText } = info;
		const basePromptPrefix = `
        Be able to converse, understand skin types and give detailed solutions and product suggestions for skin conditions and skin types
      `;

		const baseCompletion = await generate(
			`${basePromptPrefix}${selectionText}`
		);
    console.log('completed!')

		const secondPrompt = `
        Take the contents of said skin type and condition post below and generate detailed solutions and product names and suggestions in the style of world best dermatologists. Make it feel like a conversation and prescription. Don't just list the points. Go deep into each one. Explain why.
        
        Question/Statement: ${selectionText}
        
        Contents: ${baseCompletion.text}
        
        Response/Solution:
        `;

		const secondPromptCompletion = await generate(secondPrompt);

		sendMessage(secondPromptCompletion.text);
	} catch (error) {
		console.log(error);

		sendMessage(error.toString());
    console.log('generated!');
	}
};

chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		id: "context-run",
		title: "ALUCARD GO",
		contexts: ["selection"],
	});
});

chrome.contextMenus.onClicked.addListener(generateCompletionAction);
