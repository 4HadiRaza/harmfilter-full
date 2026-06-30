import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:harmfilter_flutter/models/post_model.dart';
import 'package:harmfilter_flutter/services/firestore_service.dart';
import 'package:harmfilter_flutter/widgets/hf_avatar.dart';
import 'package:harmfilter_flutter/widgets/hf_button.dart';
import 'package:harmfilter_flutter/widgets/hf_card.dart';
import 'package:harmfilter_flutter/widgets/hf_empty_state.dart';
import 'package:harmfilter_flutter/widgets/hf_theme.dart';
import 'package:harmfilter_flutter/widgets/report_post_sheet.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class FilteredPostsScreen extends StatelessWidget {
  final String filter;
  final FirestoreService _firestoreService = FirestoreService();

  FilteredPostsScreen({super.key, required this.filter});

  String _getTitle() {
    switch (filter) {
      case 'safe':
        return 'Safe Posts';
      case 'flagged':
        return 'Flagged Posts';
      case 'all':
      default:
        return 'All Analyzed Posts';
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

  Future<void> _deletePost(BuildContext context, String postId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: Theme.of(context).cardColor,
          title: Text(
            'Delete Post',
            style: GoogleFonts.inter(
              color: HFTheme.primaryTextColor(context),
              fontWeight: FontWeight.bold,
            ),
          ),
          content: Text(
            'Are you sure you want to delete this post? This action cannot be undone.',
            style: GoogleFonts.inter(
              color: HFTheme.secondaryTextColor(context),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: Text(
                'Cancel',
                style: GoogleFonts.inter(color: HFTheme.secondaryTextColor(context)),
              ),
            ),
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: Text(
                'Delete',
                style: GoogleFonts.inter(color: HFTheme.accent, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        );
      },
    );

    if (confirmed != true || !context.mounted) return;

    try {
      await _firestoreService.deletePost(postId);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Post deleted.')),
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete post: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = FirebaseAuth.instance.currentUser;

    if (user == null) {
      return Scaffold(
        backgroundColor: theme.scaffoldBackgroundColor,
        appBar: AppBar(
          backgroundColor: theme.cardColor,
          title: Text(
            _getTitle(),
            style: GoogleFonts.inter(
              color: HFTheme.primaryTextColor(context),
              fontWeight: FontWeight.w700,
              fontSize: 18,
            ),
          ),
          leading: IconButton(
            icon: Icon(LucideIcons.arrowLeft, color: HFTheme.primaryTextColor(context)),
            onPressed: () => context.pop(),
          ),
        ),
        body: const HFEmptyState(
          title: 'Not signed in',
          message: 'Please log in to view posts.',
          icon: LucideIcons.logIn,
        ),
      );
    }

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.cardColor,
        elevation: 0,
        title: Text(
          _getTitle(),
          style: GoogleFonts.inter(
            color: HFTheme.primaryTextColor(context),
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: HFTheme.primaryTextColor(context)),
          onPressed: () => context.pop(),
        ),
      ),
      body: StreamBuilder<List<PostModel>>(
        stream: _firestoreService.getUserPostsStream(user.uid),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator(color: HFTheme.accent));
          }

          if (snapshot.hasError) {
            return HFEmptyState(
              title: 'Error loading posts',
              message: '${snapshot.error}',
              icon: LucideIcons.alertCircle,
            );
          }

          var posts = snapshot.data ?? [];

          // Apply filtering logic
          if (filter == 'safe') {
            posts = posts.where((p) => p.label == 'normal').toList();
          } else if (filter == 'flagged') {
            posts = posts.where((p) => p.label != 'normal').toList();
          }

          if (posts.isEmpty) {
            IconData emptyIcon;
            String emptyMessage;
            if (filter == 'safe') {
              emptyIcon = LucideIcons.shieldAlert;
              emptyMessage = 'No safe posts found from your account.';
            } else if (filter == 'flagged') {
              emptyIcon = LucideIcons.shieldCheck;
              emptyMessage = 'All clear! No flagged posts found.';
            } else {
              emptyIcon = LucideIcons.pencil;
              emptyMessage = 'You have not analyzed or published any posts yet.';
            }

            return HFEmptyState(
              title: 'No posts to display',
              message: emptyMessage,
              icon: emptyIcon,
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
                            HFAvatar(name: post.username, size: 36),
                            const SizedBox(width: 10),
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
                              Container(
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
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    color: labelColor,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              )
                            else
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF00C853).withAlpha(26),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: const Color(0xFF00C853).withAlpha(51),
                                  ),
                                ),
                                child: Text(
                                  'SAFE',
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    color: const Color(0xFF00C853),
                                    fontWeight: FontWeight.w700,
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
                            IconButton(
                              onPressed: () => _deletePost(context, post.id),
                              tooltip: 'Delete post',
                              icon: const Icon(
                                Icons.delete_outline,
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
                            onPressed: () => context.push('/post-detail/${post.id}'),
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
      ),
    );
  }
}
