import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { getFeed, getSavedPosts, getMyPosts } from "../services/blogService";
import PostCard from "../components/PostCard";
import Button from "../components/Button";
import NotificationBell from "../components/NotificationBell";
import Skeleton from "../components/Skeleton";
import Card from "../components/Card";

export default function BlogFeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [tab, setTab] = useState("feed"); // "feed" | "saved" | "mine"

  const observer = useRef();
  const lastPostElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const loadMore = () => {
    if (!hasMore || loadingMore || posts.length === 0) return;
    setLoadingMore(true);
    const lastPost = posts[posts.length - 1];
    const cursor = lastPost.created_at;
    
    let promise;
    if (tab === "feed") promise = getFeed(cursor);
    else if (tab === "saved") promise = getSavedPosts(cursor);
    else if (tab === "mine") promise = getMyPosts(cursor);
    
    promise.then(res => {
      if (res.data.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => [...prev, ...res.data]);
      }
    }).finally(() => setLoadingMore(false));
  };

  useEffect(() => {
    setLoading(true);
    setHasMore(true);
    let promise;
    if (tab === "feed") {
      promise = getFeed();
    } else if (tab === "saved") {
      promise = getSavedPosts();
    } else if (tab === "mine") {
      promise = getMyPosts();
    }
    
    if (promise) {
      promise
        .then((res) => {
          setPosts(res.data);
          if (res.data.length < 20) setHasMore(false);
        })
        .catch(err => console.error("Failed to fetch posts:", err))
        .finally(() => setLoading(false));
    }
  }, [tab]);

  const removePostFromState = (postId) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  return (
    <div className="max-w-md md:max-w-5xl mx-auto px-4 mt-8">
      <div className="flex items-center justify-between mb-4 border-b-2 border-accent-900 pb-2">
        <h1 className="font-display font-bold text-2xl md:text-3xl">Blog</h1>
        <div className="flex items-center gap-2">
          <div className="md:hidden"><NotificationBell /></div>
          <Link to="/blog/new"><Button>Write a Post</Button></Link>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b-2 border-line w-full">
        <button onClick={() => setTab("feed")} className={`font-mono text-sm md:text-base pb-2 -mb-[2px] border-b-2 ${tab === "feed" ? "border-accent-800 font-bold text-accent-900" : "border-transparent text-ink-muted hover:text-ink"}`}>
          Feed
        </button>
        <button onClick={() => setTab("saved")} className={`font-mono text-sm md:text-base pb-2 -mb-[2px] border-b-2 ${tab === "saved" ? "border-accent-800 font-bold text-accent-900" : "border-transparent text-ink-muted hover:text-ink"}`}>
          Saved Posts
        </button>
        <button onClick={() => setTab("mine")} className={`font-mono text-sm md:text-base pb-2 -mb-[2px] border-b-2 ${tab === "mine" ? "border-accent-800 font-bold text-accent-900" : "border-transparent text-ink-muted hover:text-ink"}`}>
          My Posts
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {loading && (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton variant="circle" className="w-10 h-10 shrink-0" />
                  <div className="flex flex-col flex-1 gap-2">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-24 h-3" />
                  </div>
                </div>
                <Skeleton className="w-full h-16 mt-2" />
              </Card>
            ))}
          </>
        )}
        
        {!loading && posts.length === 0 && (
          <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center p-12 mt-4 border-2 border-dashed border-accent-300 bg-parchment-050 rounded-xl gap-4">
            <p className="text-ink-muted text-center font-mono text-sm md:text-base max-w-sm">
              {tab === "feed" ? "Quiet in here — posts from friends will show up chronologically." : 
               tab === "saved" ? "You haven't saved any posts yet." : "You haven't written any posts yet."}
            </p>
          </div>
        )}

        {!loading && posts.map((post, index) => {
          if (posts.length === index + 1) {
            return <div ref={lastPostElementRef} key={post.id} className="h-full"><PostCard post={post} onDelete={() => removePostFromState(post.id)} /></div>;
          } else {
            return <div key={post.id} className="h-full"><PostCard post={post} onDelete={() => removePostFromState(post.id)} /></div>;
          }
        })}
        
        {loadingMore && (
          <div className="col-span-1 md:col-span-2 flex justify-center mt-4">
            <Card className="flex flex-col gap-3 w-full max-w-md">
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" className="w-10 h-10 shrink-0" />
                <div className="flex flex-col flex-1 gap-2">
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-24 h-3" />
                </div>
              </div>
              <Skeleton className="w-full h-16 mt-2" />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
