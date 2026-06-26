import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:harmfilter_flutter/models/post_model.dart';
import 'package:harmfilter_flutter/services/firestore_service.dart';
import 'package:harmfilter_flutter/services/cloudinary_service.dart';
import 'package:harmfilter_flutter/widgets/hf_card.dart';
import 'package:harmfilter_flutter/widgets/hf_button.dart';
import 'package:harmfilter_flutter/widgets/hf_empty_state.dart';
import 'package:harmfilter_flutter/widgets/hf_snackbar.dart';
import 'package:harmfilter_flutter/widgets/hf_theme.dart';
import 'package:harmfilter_flutter/widgets/report_post_sheet.dart';
import 'package:lucide_icons/lucide_icons.dart';

class AnalyzeScreen extends StatefulWidget {
  const AnalyzeScreen({super.key});

  @override
  State<AnalyzeScreen> createState() => _AnalyzeScreenState();
}

class _AnalyzeScreenState extends State<AnalyzeScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _textController = TextEditingController();
  final FirestoreService _firestoreService = FirestoreService();
  final CloudinaryService _cloudinaryService = CloudinaryService();
  final ImagePicker _imagePicker = ImagePicker();
  bool _isPosting = false;

  // Store bytes + name instead of File (works on Web too)
  Uint8List? _selectedImageBytes;
  String? _selectedImageName;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _textController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final picked = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );
      if (picked != null) {
        final bytes = await picked.readAsBytes();
        setState(() {
          _selectedImageBytes = bytes;
          _selectedImageName = picked.name;
        });
      }
    } catch (e) {
      if (mounted) {
        HFSnackbar.show(context, 'Could not pick image: $e', isError: true);
      }
    }
  }

  void _removeImage() {
    setState(() {
      _selectedImageBytes = null;
      _selectedImageName = null;
    });
  }

  Future<void> _handlePost() async {
    final text = _textController.text.trim();
    if (text.isEmpty && _selectedImageBytes == null) return;

    setState(() => _isPosting = true);

    try {
      String? imageUrl;

      // Upload image to Cloudinary first if one is selected
      if (_selectedImageBytes != null) {
        imageUrl = await _cloudinaryService.uploadImage(
          _selectedImageBytes!,
          _selectedImageName ?? 'image.jpg',
        );
      }

      await _firestoreService.addPost(text, imageUrl: imageUrl);
      if (mounted) {
        HFSnackbar.show(context, 'Post published successfully!');
        _textController.clear();
        _removeImage();
        _tabController.animateTo(1);
      }
    } catch (e) {
      if (mounted) {
        HFSnackbar.show(context, 'Error: $e', isError: true);
      }
    } finally {
      if (mounted) {
        setState(() => _isPosting = false);
      }
    }
  }

  Color _getLabelColor(String label) {
    switch (label) {
      case 'normal':
        return const Color(0xFF00C853);
      case 'offensive':
        return const Color(0xFFFF9100);
      case 'hateful':
        return HFTheme.accent;
      default:
        return HFTheme.muted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Tab bar
            Container(
              color: theme.scaffoldBackgroundColor,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: TabBar(
                controller: _tabController,
                indicatorColor: HFTheme.accent,
                indicatorSize: TabBarIndicatorSize.tab,
                labelColor: HFTheme.primaryTextColor(context),
                labelStyle: GoogleFonts.inter(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
                unselectedLabelColor: HFTheme.secondaryTextColor(context),
                unselectedLabelStyle: GoogleFonts.inter(fontSize: 14),
                dividerColor: theme.dividerColor,
                tabs: const [
                  Tab(text: 'Analyze', height: 50),
                  Tab(text: 'Feed', height: 50),
                ],
              ),
            ),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [_buildComposerTab(), _buildFeedTab()],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildComposerTab() {
    final theme = Theme.of(context);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Create a Post',
            style: GoogleFonts.inter(
              color: HFTheme.primaryTextColor(context),
              fontSize: 22,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),
          HFCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _textController,
                  maxLines: 5,
                  style: GoogleFonts.inter(
                    color: HFTheme.primaryTextColor(context),
                    fontSize: 15,
                    height: 1.5,
                  ),
                  decoration: InputDecoration(
                    hintText: "What's on your mind? (English or Roman Urdu)",
                    hintStyle: GoogleFonts.inter(
                      color: HFTheme.secondaryTextColor(context),
                      fontSize: 15,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: theme.dividerColor),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: theme.dividerColor),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: HFTheme.accent),
                    ),
                    filled: true,
                    fillColor: HFTheme.inputFillColor(context),
                    contentPadding: const EdgeInsets.all(14),
                  ),
                ),

                // Image preview
                if (_selectedImageBytes != null) ...[
                  const SizedBox(height: 12),
                  Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.memory(
                          _selectedImageBytes!,
                          width: double.infinity,
                          height: 180,
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        top: 6,
                        right: 6,
                        child: GestureDetector(
                          onTap: _removeImage,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.black.withAlpha(150),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.close,
                              color: Colors.white,
                              size: 18,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],

                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    IconButton(
                      onPressed: _isPosting ? null : _pickImage,
                      tooltip: _selectedImageBytes != null ? 'Change image' : 'Upload image',
                      style: IconButton.styleFrom(
                        side: BorderSide(color: Theme.of(context).dividerColor),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      icon: Icon(
                        _selectedImageBytes != null ? LucideIcons.imagePlus : LucideIcons.image,
                        color: HFTheme.primaryTextColor(context),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 8),
                    _isPosting
                        ? Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                color: HFTheme.accent,
                                strokeWidth: 2,
                              ),
                            ),
                          )
                        : HFButton(
                            label: 'POST',
                            icon: LucideIcons.send,
                            expand: false,
                            onPressed: _handlePost,
                          ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeedTab() {
    return StreamBuilder<List<PostModel>>(
      stream: _firestoreService.getPostsStream(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Center(
            child: CircularProgressIndicator(color: HFTheme.accent),
          );
        }

        if (snapshot.hasError) {
          return Center(
            child: Text(
              'Error: ${snapshot.error}',
              style: GoogleFonts.inter(color: HFTheme.accent, fontSize: 12),
            ),
          );
        }

        final posts = snapshot.data ?? [];

        if (posts.isEmpty) {
          return const HFEmptyState(
            title: 'No posts yet',
            message: 'Be the first to publish from Analyze.',
            icon: LucideIcons.pencil,
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
          itemCount: posts.length,
          itemBuilder: (context, index) {
            final post = posts[index];
            final labelColor = _getLabelColor(post.label);

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: GestureDetector(
                onTap: () => context.push('/post-detail/${post.id}'),
                child: HFCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              post.username,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(
                                color: HFTheme.primaryTextColor(context),
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (post.label != 'normal')
                            Flexible(
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: labelColor.withAlpha(26),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: labelColor.withAlpha(51),
                                  ),
                                ),
                                child: Text(
                                  post.label.toUpperCase(),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    color: labelColor,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ),
                          const SizedBox(width: 6),
                          IconButton(
                            onPressed: () => showReportPostSheet(
                              context,
                              postId: post.id,
                              postContent: post.text,
                              currentFlag: post.label,
                            ),
                            tooltip: 'Report post',
                            icon: const Icon(
                              Icons.flag_outlined,
                              color: Color(0xFF6B7280),
                              size: 18,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        post.text,
                        maxLines: 4,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          color: HFTheme.primaryTextColor(context),
                          fontSize: 14,
                          height: 1.4,
                        ),
                      ),

                      // Image thumbnail in feed
                      if (post.imageUrl != null && post.imageUrl!.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            post.imageUrl!,
                            width: double.infinity,
                            fit: BoxFit.contain,
                            loadingBuilder: (context, child, progress) {
                              if (progress == null) return child;
                              return Container(
                                width: double.infinity,
                                height: 120,
                                decoration: BoxDecoration(
                                  color: HFTheme.inputFillColor(context),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Center(
                                  child: CircularProgressIndicator(
                                    color: HFTheme.accent,
                                    strokeWidth: 2,
                                    value: progress.expectedTotalBytes != null
                                        ? progress.cumulativeBytesLoaded /
                                            progress.expectedTotalBytes!
                                        : null,
                                  ),
                                ),
                              );
                            },
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                width: double.infinity,
                                height: 80,
                                decoration: BoxDecoration(
                                  color: HFTheme.inputFillColor(context),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Center(
                                  child: Icon(
                                    LucideIcons.imageOff,
                                    color: HFTheme.secondaryTextColor(context),
                                    size: 24,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ],

                      if (post.label != 'normal') ...[
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(2),
                                child: LinearProgressIndicator(
                                  value: post.fusedScore,
                                  color: labelColor,
                                  backgroundColor: labelColor.withAlpha(26),
                                  minHeight: 3,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${(post.fusedScore * 100).toStringAsFixed(0)}%',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                color: HFTheme.secondaryTextColor(context),
                              ),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: HFButton(
                          label: 'VIEW DETAILS',
                          icon: LucideIcons.eye,
                          styleType: HFButtonStyleType.ghost,
                          onPressed: () =>
                              context.push('/post-detail/${post.id}'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
