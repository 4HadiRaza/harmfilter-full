import { getPosts } from "@/app/actions/posts";
import { getCurrentAdmin } from "@/app/actions/auth";
import { PostsTable } from "@/components/posts/posts-table";

export default async function PostsPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return null;

  const searchParams = await props.searchParams;

  const filters = {
    label: searchParams.label,
    language: searchParams.language,
    search: searchParams.search,
  };

  const { posts } = await getPosts(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Posts Explorer</h1>
        <p className="text-sm text-zinc-500 mt-1">Browse and moderate all platform content</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <PostsTable
          initialPosts={posts}
          filters={filters}
          adminUid={admin.uid}
          adminEmail={admin.email}
          detailPostId={searchParams.detail}
        />
      </div>
    </div>
  );
}
