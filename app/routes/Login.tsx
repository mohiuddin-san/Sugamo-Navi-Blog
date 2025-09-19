import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TableOfContents from "~/components/TableOfContents";
import Bloglist from "~/components/BlogList";
import Editor from "~/components/Editor";
import ShopManagerPage from "~/components/ShopManagerPage";
import supabase from '~/supabase';

type Heading = {
  id: string;
  text: string;
  level: number;
};

type AppView = "blog-editor" | "shop-manager";

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
          <div className="border-t border-gray-700 my-2"></div>
          <button className="p-3 rounded flex items-center gap-2 hover:bg-gray-700">
            <span>📊</span>
            <span>Analytics</span>
          </button>
          <button className="p-3 rounded flex items-center gap-2 hover:bg-gray-700">
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
              <div className="hidden md:block md:w-2/4 overflow-auto bg-white">
                <Editor
                  onHeadingsChange={handleHeadingsChange}
                  scrollToPosition={scrollPosition}
                  onPreviewToggle={() => setIsPreview(!isPreview)}
                  headingToScroll={headingToScroll}
                  onHeadingScrolled={() => setHeadingToScroll(null)}
                  blogId={selectedBlogId}
                />
              </div>
              <div className="hidden md:block md:w-1/4 border-l overflow-auto bg-white">
                <TableOfContents
                  headings={headings}
                  onHeadingClick={handleHeadingClick}
                  isPreview={isPreview}
                />
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto bg-white">
              <ShopManagerPage />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProtectedApp() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
      } else {
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) {
          navigate('/login');
        } else {
          setIsAuthenticated(true);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <MainApp /> : null;
}