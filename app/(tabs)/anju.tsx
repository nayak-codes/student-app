


import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { AIMessage, sendMessage } from '../../src/services/aiService';

type MessageType = 'text' | 'resource' | 'question';
type Sender = 'user' | 'anju';

interface Resource {
  title: string;
  type: 'video' | 'pdf' | 'article';
  url: string;
}

interface Message {
  id: string;
  text: string;
  sender: Sender;
  type: MessageType;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered';
  data?: {
    subject?: string;
    resources?: Resource[];
    options?: string[];
  };
}

const AnjuChatScreen = () => {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m Anju, your AI learning companion. I can help with:\n• Concept explanations\n• Study resources\n• Problem solving\n• Exam preparation\n\nWhat would you like help with today?',
      sender: 'anju',
      type: 'text',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Educational quick actions
  const quickActions = [
    {
      icon: 'lightbulb-outline',
      text: 'Explain a concept',
      prompt: 'Can you explain the concept of photosynthesis?'
    },
    {
      icon: 'book',
      text: 'Find study material',
      prompt: 'I need resources about World War II'
    },
    {
      icon: 'help-outline',
      text: 'Solve a problem',
      prompt: 'Can you help me solve this math problem?'
    },
    {
      icon: 'assignment',
      text: 'Exam preparation',
      prompt: 'I need help preparing for my biology exam'
    }
  ];

  // Sample educational resources database
  const resourceDatabase: Record<string, Resource[]> = {
    'photosynthesis': [
      {
        title: 'Photosynthesis Explained (Video)',
        type: 'video',
        url: 'https://www.khanacademy.org/science/biology/photosynthesis-in-plants'
      },
      {
        title: 'Photosynthesis PDF Guide',
        type: 'pdf',
        url: 'https://example.com/pdfs/photosynthesis'
      }
    ],
    'world war ii': [
      {
        title: 'WWII Documentary (Video)',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=Q78COTwT7nE'
      },
      {
        title: 'WWII Encyclopedia Article',
        type: 'article',
        url: 'https://www.britannica.com/event/World-War-II'
      }
    ]
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      type: 'text',
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Use real AI service
    setTimeout(async () => {
      setMessages(prev => prev.map(msg =>
        msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
      ));
      setIsTyping(true);

      try {
        // Build conversation history for AI
        const conversationHistory: AIMessage[] = messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

        // Get AI response
        const aiResponse = await sendMessage(
          inputText,
          conversationHistory,
          {
            exam: userProfile?.exam,
            name: userProfile?.name
          }
        );

        // Create AI message
        const anjuMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          sender: 'anju',
          type: 'text',
          timestamp: new Date(),
          status: 'delivered'
        };

        setMessages(prev => [...prev, anjuMessage]);
      } catch (error: any) {
        console.error('AI Error:', error);

        // Fallback error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: error.message || 'Sorry, I\'m having trouble responding right now. Please try again!',
          sender: 'anju',
          type: 'text',
          timestamp: new Date(),
          status: 'delivered'
        };

        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }, 500);
  };

  const generateAnjuResponse = (query: string) => {
    setTimeout(() => {
      setIsTyping(false);
      let response: Message;

      if (query.includes('explain') || query.includes('what is')) {
        response = createExplanationResponse(query);
      } else if (query.includes('find') || query.includes('resource') || query.includes('material')) {
        response = createResourceResponse(query);
      } else if (query.includes('solve') || query.includes('problem')) {
        response = createProblemSolvingResponse(query);
      } else if (query.includes('exam') || query.includes('prepare')) {
        response = createExamPreparationResponse(query);
      } else {
        response = createDefaultResponse();
      }

      setMessages(prev => [...prev, response]);
    }, 1500);
  };

  const createExplanationResponse = (query: string): Message => {
    const subject = extractSubject(query);
    return {
      id: (Date.now() + 1).toString(),
      text: `Here's an explanation of ${subject}:\n\n${getConceptExplanation(subject)}`,
      sender: 'anju',
      type: 'text',
      timestamp: new Date(),
      data: {
        subject
      }
    };
  };

  const createResourceResponse = (query: string): Message => {
    const subject = extractSubject(query);
    const resources = resourceDatabase[subject] || [];
    return {
      id: (Date.now() + 1).toString(),
      text: resources.length > 0
        ? `I found these resources about ${subject}:`
        : `I couldn't find specific resources about ${subject}. Try asking about another topic.`,
      sender: 'anju',
      type: 'resource',
      timestamp: new Date(),
      data: {
        subject,
        resources: resources.length > 0 ? resources : undefined
      }
    };
  };

  const createProblemSolvingResponse = (query: string): Message => {
    const subject = extractSubject(query);
    return {
      id: (Date.now() + 1).toString(),
      text: `Let's work through this ${subject} problem together. First, what specific part are you struggling with?`,
      sender: 'anju',
      type: 'text',
      timestamp: new Date()
    };
  };

  const createExamPreparationResponse = (query: string): Message => {
    const subject = extractSubject(query);
    return {
      id: (Date.now() + 1).toString(),
      text: `For your ${subject} exam preparation, I recommend:\n1. Reviewing key concepts\n2. Practicing with sample questions\n3. Creating a study schedule\n\nWould you like me to suggest specific resources?`,
      sender: 'anju',
      type: 'text',
      timestamp: new Date()
    };
  };

  const createDefaultResponse = (): Message => {
    const responses = [
      "I'd be happy to help with that. Could you clarify your question?",
      "That's an interesting topic. Here's what I know...",
      "I'm here to assist with your learning. Could you provide more details?",
      "Let me think about how best to help you with this..."
    ];
    return {
      id: (Date.now() + 1).toString(),
      text: responses[Math.floor(Math.random() * responses.length)],
      sender: 'anju',
      type: 'text',
      timestamp: new Date()
    };
  };

  const extractSubject = (query: string): string => {
    return query.replace(/explain|what is|find|resource|material|solve|problem|exam|prepare/g, '').trim();
  };

  const getConceptExplanation = (subject: string): string => {
    const explanations: Record<string, string> = {
      'photosynthesis': 'Photosynthesis is the process by which plants convert light energy into chemical energy. It occurs in chloroplasts and involves two main stages: the light-dependent reactions and the Calvin cycle. The overall equation is: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.',
      'mitosis': 'Mitosis is the process of cell division that results in two genetically identical daughter cells. It consists of four phases: prophase, metaphase, anaphase, and telophase, followed by cytokinesis.',
      'quadratic equations': 'A quadratic equation is any equation that can be written in the form ax² + bx + c = 0. Solutions can be found using the quadratic formula: x = [-b ± √(b² - 4ac)] / 2a.'
    };
    return explanations[subject] || `I don't have a detailed explanation for ${subject} in my database. Would you like me to search for reliable resources about this topic?`;
  };

  const handleQuickAction = (prompt: string) => {
    setInputText(prompt);
  };

  const handleResourcePress = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Error opening URL:", err));
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => {
    switch (item.type) {
      case 'resource':
        return (
          <View style={[styles.messageContainer, styles.anjuContainer]}>
            <View style={styles.avatar}>
              <FontAwesome name="graduation-cap" size={20} color="#6C63FF" />
            </View>
            <View style={styles.anjuBubble}>
              <Text style={styles.anjuText}>{item.text}</Text>
              {item.data?.resources?.map((resource, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.resourceCard}
                  onPress={() => handleResourcePress(resource.url)}
                >
                  <MaterialIcons
                    name={resource.type === 'video' ? 'play-circle-outline' :
                      resource.type === 'pdf' ? 'picture-as-pdf' : 'article'}
                    size={24}
                    color="#6C63FF"
                  />
                  <Text style={styles.resourceTitle}>{resource.title}</Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.timestamp}>
                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        );

      default:
        return (
          <View style={[
            styles.messageContainer,
            item.sender === 'user' ? styles.userContainer : styles.anjuContainer
          ]}>
            {item.sender === 'anju' && (
              <View style={styles.avatar}>
                <FontAwesome name="graduation-cap" size={20} color="#6C63FF" />
              </View>
            )}
            <View style={[
              styles.bubble,
              item.sender === 'user' ? styles.userBubble : styles.anjuBubble
            ]}>
              <Text style={[
                styles.messageText,
                item.sender === 'user' ? styles.userText : styles.anjuText
              ]}>
                {item.text}
              </Text>
              <View style={styles.footer}>
                <Text style={[
                  styles.time,
                  item.sender === 'user' ? styles.userTime : styles.anjuTime
                ]}>
                  {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {item.sender === 'user' && item.status && (
                  <View style={styles.status}>
                    {item.status === 'sending' && (
                      <ActivityIndicator size={12} color="rgba(255,255,255,0.7)" />
                    )}
                    {item.status === 'sent' && (
                      <FontAwesome name="check" size={12} color="rgba(255,255,255,0.7)" />
                    )}
                  </View>
                )}
              </View>
            </View>
            {item.sender === 'user' && (
              <View style={styles.avatar}>
                <FontAwesome name="user" size={20} color="#757575" />
              </View>
            )}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.anjuAvatar}>
            <FontAwesome name="graduation-cap" size={28} color="#6C63FF" />
          </View>
          <View>
            <Text style={styles.anjuName}>Anju</Text>
            <Text style={styles.anjuTitle}>AI Learning Companion</Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
      />

      {messages.length <= 1 && (
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Learning Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(action.prompt)}
              >
                <MaterialIcons
                  name={action.icon as any}
                  size={24}
                  color="#6C63FF"
                />
                <Text style={styles.quickActionText}>{action.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {isTyping && (
        <View style={[styles.messageContainer, styles.anjuContainer]}>
          <View style={styles.avatar}>
            <FontAwesome name="graduation-cap" size={20} color="#6C63FF" />
          </View>
          <View style={styles.anjuBubble}>
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#6C63FF" />
              <Text style={styles.typingText}>Anju is thinking...</Text>
            </View>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask Anju about any topic..."
          placeholderTextColor="#999"
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: inputText.trim() ? '#6C63FF' : '#EDE9FE' }
          ]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Ionicons
            name={inputText.trim() ? "send" : "send-outline"}
            size={20}
            color={inputText.trim() ? "#fff" : "#6C63FF"}
          />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anjuAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  anjuName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  anjuTitle: {
    fontSize: 14,
    color: '#718096',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-end',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  anjuContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
  },
  bubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#6C63FF',
    borderBottomRightRadius: 4,
    marginLeft: 8,
  },
  anjuBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    color: '#FFFFFF',
  },
  anjuText: {
    color: '#2D3748',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  time: {
    fontSize: 11,
  },
  userTime: {
    color: 'rgba(255,255,255,0.7)',
    marginRight: 4,
  },
  anjuTime: {
    color: '#A0AEC0',
  },
  status: {
    marginLeft: 4,
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#718096',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  quickActionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2D3748',
    flexShrink: 1,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resourceTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#2D3748',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#718096',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  textInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    fontSize: 16,
    marginRight: 8,
    color: '#2D3748',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 11,
    color: '#A0AEC0',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});

export default AnjuChatScreen;