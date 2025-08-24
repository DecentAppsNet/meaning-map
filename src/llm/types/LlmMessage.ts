type LlmMessage = {
    role: 'system' | 'user' | 'assistant',
    content: string
}

export default LlmMessage;
