import React, { useState } from 'react';
import {
    Button,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput
} from 'react-native';
import { askAnju } from '../../utils/anjuApi'; // ✅ adjust path if needed

const AnjuChat = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false); // 🆕 for typing indicator

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, `🧑‍🎓 You: ${userMsg}`]);
    setInput('');
    setLoading(true);

    try {
      const reply = await askAnju(userMsg);
      setMessages(prev => [...prev, `🤖 Anju: ${reply}`]);
    } catch (error) {
      setMessages(prev => [...prev, `❌ Error: Couldn't get response from Anju.`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, padding: 16 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        {messages.map((msg, idx) => (
          <Text key={idx} style={{ marginVertical: 4 }}>{msg}</Text>
        ))}

        {loading && (
          <Text style={{ fontStyle: 'italic', color: 'gray', marginTop: 8 }}>
            ⏳ Anju is typing...
          </Text>
        )}
      </ScrollView>

      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Ask Anju something..."
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 12,
          marginBottom: 8,
          borderRadius: 8,
        }}
      />

      <Button title="Send to Anju" onPress={sendMessage} />
    </KeyboardAvoidingView>
  );
};

export default AnjuChat;
