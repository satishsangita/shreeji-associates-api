import { useState, useRef, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: "0",
  role: "assistant",
  content: "Namaste! I am your AI Legal Assistant tailored for Indian Law. I can help you with BNS, BNSS, Case Laws, property documents, and drafting suggestions. How can I assist you today?",
  timestamp: Date.now(),
};

const QUICK_PROMPTS = [
  "Section 138 NI Act procedure",
  "Sale deed stamp duty Gujarat",
  "Mortgage deed clauses",
  "Title search checklist",
];

export default function AIAssistantScreen() {
  const colors = useColors();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const chatMutation = trpc.ai.chat.useMutation();

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Build conversation history (exclude the initial greeting)
      const history = messages
        .filter((m) => m.id !== "0")
        .map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("model" as const),
          parts: [{ text: m.content }],
        }));

      const result = await chatMutation.mutateAsync({
        message: trimmed,
        history,
      });

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.text,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `⚠️ ${err.message || "An error occurred. Please check your connection and try again."}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, chatMutation]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={[styles.avatarSmall, { backgroundColor: colors.primary }]}>
            <IconSymbol name="sparkles" size={14} color="#F5A623" />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.bubbleUser, { backgroundColor: colors.primary }]
              : [styles.bubbleAssistant, { backgroundColor: colors.surface, borderColor: colors.border }],
          ]}
        >
          <Text style={[styles.bubbleText, { color: isUser ? "#FFFFFF" : colors.foreground }]}>
            {item.content}
          </Text>
        </View>
        {isUser && (
          <View style={[styles.avatarSmall, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarSmallText}>SP</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={[styles.headerIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <IconSymbol name="sparkles" size={20} color="#F5A623" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>AI Legal Assistant</Text>
          <Text style={styles.headerSubtitle}>Powered by Gemini · Indian Law Specialist</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={[styles.content, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingRow}>
            <View style={[styles.avatarSmall, { backgroundColor: colors.primary }]}>
              <IconSymbol name="sparkles" size={14} color="#F5A623" />
            </View>
            <View style={[styles.loadingBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.muted }]}>Thinking...</Text>
            </View>
          </View>
        )}

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <View style={styles.quickPromptsContainer}>
            <Text style={[styles.quickPromptsLabel, { color: colors.muted }]}>Quick questions:</Text>
            <View style={styles.quickPromptsRow}>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.quickPromptChip, { backgroundColor: colors.surface, borderColor: colors.primary + "40" }]}
                  onPress={() => sendMessage(prompt)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickPromptText, { color: colors.primary }]}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Disclaimer */}
        <Text style={[styles.disclaimer, { color: colors.muted }]}>
          AI responses may be inaccurate. Always verify with official legal texts.
        </Text>

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask for judgments on section 138 NI Act..."
            placeholderTextColor={colors.muted + "80"}
            style={[styles.textInput, { color: colors.foreground, borderColor: colors.border }]}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: input.trim() && !loading ? colors.primary : colors.border },
            ]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            activeOpacity={0.85}
          >
            <IconSymbol name="paperplane.fill" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
  },
  headerIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  content: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -8 },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 12, gap: 8 },
  messageRowUser: { flexDirection: "row-reverse" },
  avatarSmall: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarSmallText: { fontSize: 9, fontWeight: "800", color: "#1A3C8F" },
  bubble: { maxWidth: "78%", borderRadius: 16, padding: 12 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  loadingBubble: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 16, padding: 12 },
  loadingText: { fontSize: 13 },
  quickPromptsContainer: { paddingHorizontal: 16, marginBottom: 8 },
  quickPromptsLabel: { fontSize: 11, fontWeight: "600", marginBottom: 8 },
  quickPromptsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickPromptChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  quickPromptText: { fontSize: 12, fontWeight: "500" },
  disclaimer: { fontSize: 10, textAlign: "center", paddingHorizontal: 16, paddingBottom: 6 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderTopWidth: 0.5,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});
