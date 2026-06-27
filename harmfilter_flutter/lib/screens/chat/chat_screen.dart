import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:harmfilter_flutter/widgets/hf_button.dart';
import 'package:harmfilter_flutter/widgets/hf_card.dart';
import 'package:harmfilter_flutter/widgets/hf_input.dart';
import 'package:harmfilter_flutter/widgets/hf_theme.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_generative_ai/google_generative_ai.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<Map<String, dynamic>> _messages = [];
  bool _isTyping = false;

  late final GenerativeModel _model;
  late final ChatSession _chatSession;

  @override
  void initState() {
    super.initState();
    final apiKey = dotenv.env['GEMINI_API_KEY'];
    if (apiKey == null) {
      debugPrint('No GEMINI_API_KEY found in .env');
    }
    _model = GenerativeModel(
      model: 'gemini-flash-latest',
      apiKey: apiKey ?? '',
      systemInstruction: Content.system(
          'You are Compassion Coach, a warm, empathy-focused chatbot. '
          'Your goal is to help users understand why certain language is harmful and constructively help them rewrite harmful text. '
          'CRITICAL RULE: You must automatically mirror the user\'s language. '
          'If the user writes in English, respond ONLY in English. '
          'If the user writes in Roman Urdu, respond ONLY in Roman Urdu. '
          'Never mix the two languages in the same response. '
          'Keep your tone non-judgmental, warm, and helpful. Always address users respectfully.'),
    );
    _chatSession = _model.startChat();
  }

  final List<String> _quickReplies = [
    "Suggest a rewrite",
    "Why is this harmful?",
    "How can I express disagreement?",
    "Teach me about empathy",
  ];

  Future<void> _handleSend() async {
    if (_textController.text.trim().isEmpty) return;

    final userMessage = {
      'id': DateTime.now().toString(),
      'role': 'user',
      'content': _textController.text,
      'timestamp': DateTime.now(),
    };

    setState(() {
      _messages.add(userMessage);
      _isTyping = true;
    });

    final input = _textController.text;
    _textController.clear();
    _scrollToBottom();

    try {
      final response = await _chatSession.sendMessage(Content.text(input));
      final responseContent = response.text ?? "I'm sorry, I didn't understand that.";
      
      if (!mounted) return;

      final botMessage = {
        'id': DateTime.now().toString(),
        'role': 'assistant',
        'content': responseContent,
        'timestamp': DateTime.now(),
      };

      setState(() {
        _messages.add(botMessage);
        _isTyping = false;
      });
      _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _messages.add({
          'id': DateTime.now().toString(),
          'role': 'assistant',
          'content': "Kuch masla ho gaya hai (Something went wrong). Please try again later.",
          'timestamp': DateTime.now(),
        });
        _isTyping = false;
      });
      _scrollToBottom();
      debugPrint('Error from Gemini: $e');
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      color: theme.scaffoldBackgroundColor,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: HFCard(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Icon(LucideIcons.bot, color: HFTheme.accent),
                  const SizedBox(width: 8),
                  Text('Compassion Coach', style: GoogleFonts.inter(color: HFTheme.primaryTextColor(context), fontWeight: FontWeight.w700)),
                  const Spacer(),
                  Text('LIVE', style: GoogleFonts.inter(color: HFTheme.secondaryTextColor(context), fontSize: 10)),
                ],
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: (_messages.isEmpty ? 1 : _messages.length) + (_isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (_messages.isEmpty && index == 0) {
                      return Padding(
                    padding: const EdgeInsets.only(top: 36),
                    child: Text(
                      'How can I help you reframe this conversation?',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(color: HFTheme.primaryTextColor(context), fontSize: 18),
                    ),
                  );
                }

                final adjustedIndex = _messages.isEmpty ? index - 1 : index;
                if (adjustedIndex == _messages.length) {
                  return _buildTypingIndicator();
                }
                final msg = _messages[adjustedIndex];
                final isUser = msg['role'] == 'user';
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isUser ? HFTheme.accent : theme.cardColor,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: isUser ? HFTheme.accent : theme.dividerColor),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          msg['content'],
                          style: TextStyle(color: isUser ? Colors.white : HFTheme.primaryTextColor(context)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _formatTime(msg['timestamp']),
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: isUser ? Colors.white70 : HFTheme.secondaryTextColor(context),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: _quickReplies
                  .map(
                    (reply) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ActionChip(
                        backgroundColor: theme.cardColor,
                        side: BorderSide(color: theme.dividerColor),
                        label: Text(reply, style: GoogleFonts.inter(color: HFTheme.primaryTextColor(context), fontSize: 11)),
                        onPressed: () {
                          _textController.text = reply;
                          _textController.selection = TextSelection.fromPosition(
                            TextPosition(offset: _textController.text.length),
                          );
                        },
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: HFInput(
                    controller: _textController,
                    label: 'Message',
                    hint: 'Describe what you want to say...',
                  ),
                ),
                const SizedBox(width: 10),
                SizedBox(
                  width: 52,
                  child: HFButton(
                    label: '',
                    icon: LucideIcons.send,
                    onPressed: _isTyping ? null : _handleSend,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    final theme = Theme.of(context);
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        child: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: theme.cardColor,
              child: Icon(LucideIcons.bot, size: 16, color: HFTheme.accent),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.cardColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(
                    width: 4,
                    height: 4,
                    child: CircularProgressIndicator(strokeWidth: 1),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Typing...',
                    style: TextStyle(fontSize: 12, color: HFTheme.secondaryTextColor(context)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    return "${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}";
  }
}
