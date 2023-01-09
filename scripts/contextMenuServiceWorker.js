const getKey = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['openai-key'], (result) => {
            if (result['openai-key']) {
                const decodedKey = atob(result['openai-key']);
                resolve(decodedKey);
            }
        });
    });
};
const generate = async (prompt) => {
    const key = await getKey();
    const url = 'https://api.openai.com/v1/completions';
    const completionResponse = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: 'text-davinci-003',
            prompt: prompt,
            max_tokens: 700,
            temperature: 0.7,
        }),
    });
    const completion = await completionResponse.json();
    console.log(completion.choices)
    return completion.choices.pop();
}

const generateCompletionAction = async (info) => {
    sendMessage('generating...');

    try {
        const { selectionText } = info;
        const basePromptPrefix = `
	Write me an email on the topic given below.

	Topic:
	`;
        const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);
        sendMessage(baseCompletion.text);
        console.log(baseCompletion.text)
    } catch (error) {
        console.log(error);
        sendMessage(error.toString());
    }
}

const sendMessage = (content) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0].id;
  
      chrome.tabs.sendMessage(
        activeTab,
        { message: 'inject', content },
        (response) => {
          if (response.status === 'failed') {
            console.log('injection failed.');
          }
        }
      );
    });
  }



chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'context-run',
        title: 'Generate Email',
        contexts: ['selection'],
    });
});


chrome.contextMenus.onClicked.addListener(generateCompletionAction);

