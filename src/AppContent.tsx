import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Search, 
  PlusSquare, 
  Heart, 
  MessageCircle, 
  User, 
  LogOut, 
  Camera, 
  Send,
  MoreHorizontal,
  X,
  Link as LinkIcon,
  Hash,
  Edit2,
  Check,
  Instagram,
  Twitter,
  Github,
  Globe
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { 
  db, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc,
  OperationType,
  handleFirestoreError,
  limit,
  storage
} from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { formatDistanceToNow } from 'date-fns';
import { cn } from './lib/utils';

// --- Types ---
interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  imageUrl: string;
  caption: string;
  likesCount: number;
  createdAt: any;
}

interface Story {
  id: string;
  authorId: string;
  authorPhoto: string;
  imageUrl: string;
  createdAt: any;
}

// --- Components ---

const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const { logout, profile } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 md:top-0 md:bottom-auto md:flex-col md:w-20 md:h-screen md:py-8 md:px-0">
      <div className="hidden md:block mb-8">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-display font-bold text-xl">
          交
        </div>
      </div>
      
      <button onClick={() => setActiveTab('home')} className={cn("p-2 rounded-xl transition-colors", activeTab === 'home' ? "text-brand-600 bg-brand-50" : "text-slate-400")}>
        <Home size={24} />
      </button>
      <button onClick={() => setActiveTab('search')} className={cn("p-2 rounded-xl transition-colors", activeTab === 'search' ? "text-brand-600 bg-brand-50" : "text-slate-400")}>
        <Search size={24} />
      </button>
      <button onClick={() => setActiveTab('upload')} className={cn("p-2 rounded-xl transition-colors", activeTab === 'upload' ? "text-brand-600 bg-brand-50" : "text-slate-400")}>
        <PlusSquare size={24} />
      </button>
      <button onClick={() => setActiveTab('messages')} className={cn("p-2 rounded-xl transition-colors", activeTab === 'messages' ? "text-brand-600 bg-brand-50" : "text-slate-400")}>
        <MessageCircle size={24} />
      </button>
      <button onClick={() => setActiveTab('profile')} className={cn("p-2 rounded-xl transition-colors", activeTab === 'profile' ? "text-brand-600 bg-brand-50" : "text-slate-400")}>
        {profile?.photoURL ? (
          <img src={profile.photoURL} alt="Profile" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <User size={24} />
        )}
      </button>
      
      <div className="hidden md:flex flex-col mt-auto gap-4">
         <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <LogOut size={24} />
        </button>
      </div>
    </nav>
  );
};

const StoryBar = () => {
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(10));
    return onSnapshot(q, (snapshot) => {
      setStories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'stories'));
  }, []);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-4">
      <motion.div 
        whileTap={{ scale: 0.95 }}
        className="flex-shrink-0 flex flex-col items-center gap-1"
      >
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-white">
          <PlusSquare size={20} className="text-slate-400" />
        </div>
        <span className="text-[10px] font-medium text-slate-500">Your Story</span>
      </motion.div>
      
      {stories.map((story) => (
        <div key={story.id} className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-brand-400 to-brand-600">
            <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
              <img src={story.authorPhoto || `https://picsum.photos/seed/${story.authorId}/100`} alt="Story" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
          <span className="text-[10px] font-medium text-slate-500 truncate w-16 text-center">User</span>
        </div>
      ))}
    </div>
  );
};

const PostCard = ({ post, ...props }: { post: Post, [key: string]: any }) => {
  const { user, signIn } = useAuth();
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    if (!user) {
      alert('請先登入以按讚貼文！');
      return;
    }
    setLiked(!liked);
    try {
      await updateDoc(doc(db, 'posts', post.id), {
        likesCount: post.likesCount + (liked ? -1 : 1)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `posts/${post.id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden card-shadow mb-6"
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={post.authorPhoto || `https://picsum.photos/seed/${post.authorId}/100`} alt={post.authorName} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
          <span className="font-semibold text-sm">{post.authorName}</span>
        </div>
        <button className="text-slate-400">
          <MoreHorizontal size={20} />
        </button>
      </div>
      
      <div className="aspect-square bg-slate-100 overflow-hidden">
        <img src={post.imageUrl} alt="Post content" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <button onClick={handleLike} className={cn("transition-colors", liked ? "text-red-500 fill-red-500" : "text-slate-700")}>
            <Heart size={24} />
          </button>
          <button className="text-slate-700">
            <MessageCircle size={24} />
          </button>
          <button className="text-slate-700">
            <Send size={24} />
          </button>
        </div>
        
        <div className="font-bold text-sm mb-1">{post.likesCount} likes</div>
        <div className="text-sm">
          <span className="font-bold mr-2">{post.authorName}</span>
          {post.caption}
        </div>
        <div className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider">
          {post.createdAt?.seconds ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000)) + ' ago' : 'Just now'}
        </div>
      </div>
    </motion.div>
  );
};

const BioCard = () => {
  const { profile, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState(profile?.bio || '');
  const [editedInterests, setEditedInterests] = useState(profile?.interests.join(', ') || '');
  const [editedLinks, setEditedLinks] = useState(profile?.links.join(', ') || '');
  
  if (!profile) return null;

  const handleSave = async () => {
    if (!user) return;
    try {
      const updatedProfile = {
        ...profile,
        bio: editedBio,
        interests: editedInterests.split(',').map(s => s.trim()).filter(s => s !== ''),
        links: editedLinks.split(',').map(s => s.trim()).filter(s => s !== ''),
      };
      await setDoc(doc(db, 'users', user.uid), updatedProfile);
      setIsEditing(false);
      // Profile will be updated via AuthProvider's listener if we had one, 
      // but here we might need to refresh or rely on the fact that AuthProvider
      // will eventually get the new data if it's listening.
      // For now, let's assume the user might need to refresh or we'd need a real-time listener in AuthProvider.
      window.location.reload(); // Simple way to sync for now
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const getLinkIcon = (url: string) => {
    if (url.includes('instagram.com')) return <Instagram size={14} />;
    if (url.includes('twitter.com') || url.includes('x.com')) return <Twitter size={14} />;
    if (url.includes('github.com')) return <Github size={14} />;
    return <Globe size={14} />;
  };

  return (
    <div className="bg-white rounded-3xl p-6 card-shadow border border-slate-100 relative overflow-hidden mb-8">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
      
      <div className="flex flex-col items-center text-center relative z-10">
        <div className="w-24 h-24 rounded-3xl overflow-hidden mb-4 border-4 border-white shadow-lg rotate-3 relative group">
          <img src={profile.photoURL || `https://picsum.photos/seed/${profile.uid}/200`} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <button className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
            <Camera size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-display font-bold text-slate-900">{profile.displayName}</h2>
          <button onClick={() => setIsEditing(!isEditing)} className="p-1 text-slate-400 hover:text-brand-600 transition-colors">
            {isEditing ? <X size={16} /> : <Edit2 size={16} />}
          </button>
        </div>

        {isEditing ? (
          <div className="w-full space-y-3 mt-2">
            <textarea 
              value={editedBio}
              onChange={(e) => setEditedBio(e.target.value)}
              placeholder="Your bio..."
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none h-20"
            />
            <input 
              value={editedInterests}
              onChange={(e) => setEditedInterests(e.target.value)}
              placeholder="Interests (comma separated)..."
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <input 
              value={editedLinks}
              onChange={(e) => setEditedLinks(e.target.value)}
              placeholder="Social links (comma separated)..."
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <button 
              onClick={handleSave}
              className="w-full py-2 bg-brand-600 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2"
            >
              <Check size={16} /> Save Changes
            </button>
          </div>
        ) : (
          <>
            <p className="text-slate-500 text-sm mb-6 max-w-[240px]">{profile.bio || "No bio yet. Tap the edit icon to introduce yourself."}</p>
            
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {profile.interests.length > 0 ? profile.interests.map(tag => (
                <span key={tag} className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-medium flex items-center gap-1">
                  <Hash size={10} /> {tag}
                </span>
              )) : (
                <span className="text-xs text-slate-400 italic">No interests added</span>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {profile.links.length > 0 ? profile.links.map((link, idx) => (
                <a 
                  key={idx} 
                  href={link.startsWith('http') ? link : `https://${link}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-brand-50 hover:text-brand-600 transition-all"
                  title={link}
                >
                  {getLinkIcon(link)}
                </a>
              )) : (
                <span className="text-xs text-slate-400 italic">No links added</span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 w-full">
              <button className="flex items-center justify-center gap-2 py-3 bg-brand-600 text-white rounded-2xl font-medium text-sm hover:bg-brand-700 transition-colors">
                <MessageCircle size={18} /> Message
              </button>
              <button className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-2xl font-medium text-sm hover:bg-slate-200 transition-colors">
                <LinkIcon size={18} /> Share
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const UploadView = ({ onComplete }: { onComplete: () => void }) => {
  const { user, profile, signIn } = useAuth();
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
          <PlusSquare size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">想要分享你的生活嗎？</h2>
        <p className="text-slate-500 mb-6 max-w-xs">登入帳號即可發佈貼文、按讚以及與他人互動。</p>
        <button 
          onClick={signIn}
          className="px-8 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
        >
          立即登入
        </button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!user || !imageFile) return;
    setIsUploading(true);
    try {
      // 1. Upload to Storage
      const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      // 2. Save to Firestore
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: profile?.displayName || 'User',
        authorPhoto: profile?.photoURL || '',
        imageUrl: downloadUrl,
        caption,
        likesCount: 0,
        createdAt: new Date()
      });
      onComplete();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'posts');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-display font-bold mb-6">New Post</h2>
      <div className="space-y-6">
        <label className="block">
          <div className="aspect-square bg-slate-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden cursor-pointer hover:bg-slate-50 transition-colors">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera size={48} className="text-slate-300 mb-2" />
                <p className="text-slate-400 text-sm font-medium">Click to select a photo</p>
                <p className="text-slate-300 text-xs mt-1">Supports JPG, PNG</p>
              </>
            )}
          </div>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
          />
        </label>
        
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Caption</label>
          <textarea 
            placeholder="Write a caption..." 
            className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all h-32 resize-none text-sm"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
        
        <button 
          onClick={handleUpload}
          disabled={isUploading || !imageFile}
          className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            "Share Post"
          )}
        </button>
      </div>
    </div>
  );
};

// --- Main App Views ---

const HomeView = () => {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
    return onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'posts'));
  }, []);

  return (
    <div className="max-w-lg mx-auto pt-6 pb-24 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-bold text-brand-600">交友交流社群軟體</h1>
        <div className="flex gap-4">
          <Heart size={24} className="text-slate-700" />
          <MessageCircle size={24} className="text-slate-700" />
        </div>
      </div>
      
      <StoryBar />
      
      <div className="mt-6">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
        {posts.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p>No posts yet. Be the first to share!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileView = () => {
  const { user, profile, logout, signIn } = useAuth();
  
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white">
        <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center text-brand-600 mb-6">
          <User size={40} />
        </div>
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">個人檔案</h1>
        <p className="text-slate-500 mb-8 max-w-xs">登入後即可建立個人 Bio-Card，展示你的社群連結與興趣。</p>
        <button 
          onClick={signIn}
          className="w-full max-w-xs flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" alt="Google" className="w-5 h-5" />
          連結 Google 帳號
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pt-12 pb-24 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-display font-bold">Profile</h1>
        <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
          <LogOut size={20} />
        </button>
      </div>
      
      <BioCard />
      
      <div className="grid grid-cols-3 gap-1">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="aspect-square bg-slate-200 rounded-lg overflow-hidden">
            <img src={`https://picsum.photos/seed/post${i}/300`} alt="Post" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        ))}
      </div>
    </div>
  );
};

const LoginView = () => {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 bg-brand-600 rounded-3xl flex items-center justify-center text-white font-display font-bold text-4xl mb-8 shadow-2xl shadow-brand-200"
      >
        交
      </motion.div>
      <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">歡迎來到 交友交流社群軟體</h1>
      <p className="text-slate-500 text-center mb-12 max-w-xs">The interactive social space for deep connection and visual identity.</p>
      
      <button 
        onClick={signIn}
        className="w-full max-w-xs flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" alt="Google" className="w-5 h-5" />
        Continue with Google
      </button>
      
      <p className="mt-8 text-xs text-slate-400 text-center max-w-[200px]">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 md:pl-20">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="min-h-screen">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HomeView />
            </motion.div>
          )}
          {activeTab === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UploadView onComplete={() => setActiveTab('home')} />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ProfileView />
            </motion.div>
          )}
          {activeTab === 'messages' && (
            <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center h-screen text-slate-400">
              Messages feature coming soon!
            </motion.div>
          )}
          {activeTab === 'search' && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center h-screen text-slate-400">
              Search feature coming soon!
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
