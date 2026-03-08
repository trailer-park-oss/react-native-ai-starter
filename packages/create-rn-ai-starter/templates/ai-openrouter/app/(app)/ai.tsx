import { useState, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { useTokens } from '@/design-system'
import { useChat } from '@/providers/ai'
import type { ChatMessage } from '@/providers/ai/ai.interface'

function MessageBubble({
  message,
  colors,
  typography,
}: {
  message: ChatMessage
  colors: ReturnType<typeof useTokens>['colors']
  typography: ReturnType<typeof useTokens>['typography']
}) {
  const isUser = message.role === 'user'

  return (
    <View
      style={[
        styles.messageBubble,
        isUser
          ? { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 }
          : { alignSelf: 'flex-start', backgroundColor: colors.surfaceRaised, borderBottomLeftRadius: 4 },
      ]}
    >
      <Text
        style={{
          color: isUser ? colors.textOnPrimary : colors.text,
          fontSize: typography.body.fontSize,
          lineHeight: typography.body.lineHeight,
        }}
      >
        {message.content || '...'}
      </Text>
    </View>
  )
}

export default function AiChatScreen() {
  const { colors, typography, spacing, radius } = useTokens()
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat({
    systemPrompt: 'You are a helpful, friendly assistant. Keep responses concise.',
  })
  const [input, setInput] = useState('')
  const flatListRef = useRef<FlatList>(null)

  const handleSend = async () => {
    if (!input.trim()) return
    const text = input
    setInput('')
    await sendMessage(text)
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text
            style={{
              fontSize: typography.headingLarge.fontSize,
              fontWeight: typography.headingLarge.fontWeight,
              color: colors.text,
              marginBottom: spacing.sm,
            }}
          >
            AI Chat
          </Text>
          <Text
            style={{
              fontSize: typography.body.fontSize,
              color: colors.textSubtle,
              textAlign: 'center',
              lineHeight: typography.bodyLarge.lineHeight,
            }}
          >
            Powered by OpenRouter. Send a message to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} colors={colors} typography={typography} />
          )}
          contentContainerStyle={{ padding: spacing.md }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.criticalSubtle }]}>
          <Text style={{ color: colors.critical, fontSize: typography.caption.fontSize }}>
            {error}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.inputBar,
          { borderTopColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceRaised,
              color: colors.text,
              fontSize: typography.body.fontSize,
              borderRadius: radius.xl,
            },
          ]}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSubtle}
          multiline
          maxLength={4000}
          editable={!isLoading}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={isLoading || !input.trim()}
          style={[
            styles.sendButton,
            {
              backgroundColor: input.trim() ? colors.primary : colors.surfaceRaised,
              borderRadius: radius.full,
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.textOnPrimary} />
          ) : (
            <Text style={[styles.sendButtonText, { color: colors.textOnPrimary }]}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginVertical: 4,
  },
  errorBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  sendButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
})
