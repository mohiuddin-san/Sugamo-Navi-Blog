// MainApp.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TableOfContents from "~/components/TableOfContents";
import Bloglist from "~/components/BlogList";
import Editor from "~/components/Editor";
import ShopManagerPage from "~/components/ShopManagerPage";
import SeeAndDoManagerPage from "~/components/SeeAndDoManagerPage"; // Import the new component
import supabase from '~/supabase';

type Heading = {
  id: string;
  text: string;
  level: number;
};

type AppView = "blog-editor" | "shop-manager" | "see-and-do"; // Add new view

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Panel Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the admin dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MainApp() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const [isPreview, setIsPreview] = useState(false);
  const [headingToScroll, setHeadingToScroll] = useState<string | null>(null);
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>("blog-editor");

  useEffect(() => {
    console.log("Current view:", currentView);
  }, [currentView]);

  const handleHeadingsChange = (newHeadings: Heading[]) => {
    setHeadings(newHeadings);
  };

  const handleHeadingClick = (position: number, id: string) => {
    if (isPreview) {
      setHeadingToScroll(id);
    } else {
      setScrollPosition(position);
    }
  };

  const handleBlogSelect = (blogId: string) => {
    setSelectedBlogId(blogId);
  };

  const handleNewBlog = () => {
    setSelectedBlogId("new");
  };

  const handleViewChange = (view: AppView) => {
    console.log("handleViewChange called with view:", view);
    setCurrentView(view);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Side Menu */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold">Admin Panel</h2>
        </div>
        <nav className="flex-1 flex flex-col p-4 gap-2">
          <button
            className={`p-3 rounded flex items-center gap-2 ${
              currentView === "blog-editor" 
                ? "bg-blue-600 text-white" 
                : "hover:bg-gray-700"
            }`}
            onClick={() => {
              console.log("Blog Editor button clicked");
              handleViewChange("blog-editor");
            }}
          >
            <span>📝</span>
            <span>Blog Editor</span>
          </button>
          <button
            className={`p-3 rounded flex items-center gap-2 ${
              currentView === "shop-manager" 
                ? "bg-blue-600 text-white" 
                : "hover:bg-gray-700"
            }`}
            onClick={() => {
              console.log("Shop Manager button clicked"); 
              handleViewChange("shop-manager");
            }}
          >
            <span>🛍️</span>
            <span>Shop Manager</span>
          </button>
          <button
            className={`p-3 rounded flex items-center gap-2 ${
              currentView === "see-and-do" 
                ? "bg-blue-600 text-white" 
                : "hover:bg-gray-700"
            }`}
            onClick={() => {
              console.log("See and Do button clicked");
              handleViewChange("see-and-do");
            }}
          >
            <span>🏞️</span>
            <span>See and Do</span>
          </button>
          <button
            className="p-3 rounded flex items-center gap-2 hover:bg-gray-700"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
          <button 
            className="p-3 rounded flex items-center gap-2 hover:bg-gray-700 mt-auto"
            onClick={handleLogout}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </nav>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b p-4 flex gap-2 md:hidden">
          <button
            className={`p-2 rounded ${
              currentView === "blog-editor" 
                ? "bg-blue-500 text-white" 
                : "bg-gray-200"
            }`}
            onClick={() => {
              console.log("Mobile Blog Editor button clicked");
              handleViewChange("blog-editor");
            }}
          >
            Blog Editor
          </button>
          <button
            className={`p-2 rounded ${
              currentView === "shop-manager" 
                ? "bg-blue-500 text-white" 
                : "bg-gray-200"
            }`}
            onClick={() => {
              console.log("Mobile Shop Manager button clicked");
              handleViewChange("shop-manager");
            }}
          >
            Shop Manager
          </button>
          <button
            className={`p-2 rounded ${
              currentView === "see-and-do" 
                ? "bg-blue-500 text-white" 
                : "bg-gray-200"
            }`}
            onClick={() => {
              console.log("Mobile See and Do button clicked");
              handleViewChange("see-and-do");
            }}
          >
            See and Do
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-white">
          {currentView === "blog-editor" ? (
            <div className="flex h-full">
              <div className="w-full md:w-1/4 border-r overflow-auto bg-white">
                <Bloglist 
                  onBlogSelect={handleBlogSelect} 
                  onNewBlog={handleNewBlog} 
                />
              </div>
              <div className="hidden md:block md:w-3/4 overflow-auto bg-red-200">
                <div className="w-full h-full">
                  <Editor
                    onHeadingsChange={handleHeadingsChange}
                    scrollToPosition={scrollPosition}
                    onPreviewToggle={() => setIsPreview(!isPreview)}
                    headingToScroll={headingToScroll}
                    onHeadingScrolled={() => setHeadingToScroll(null)}
                    blogId={selectedBlogId}
                  />
                </div>
              </div>
            </div>
          ) : currentView === "shop-manager" ? (
            <div className="h-full overflow-auto bg-white">
              <ShopManagerPage />
            </div>
          ) : (
            <div className="h-full overflow-auto bg-white">
              <SeeAndDoManagerPage />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  return isAuthenticated ? <MainApp /> : <LoginPage />;
}