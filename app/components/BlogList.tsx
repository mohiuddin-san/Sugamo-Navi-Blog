import { useState, useEffect } from "react";
import supabase from "~/supabase";

export default function BlogList({ onBlogSelect, onNewBlog }) {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState({});
  const [subcategories, setSubcategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        // Fetch blogs with category_id and subcategory_ids
        const { data: blogData, error: blogError } = await supabase
          .from("blogs")
          .select("id, title, top_image, status, publish_date, category_id, subcategory_ids")
          .order("created_at", { ascending: false });

        if (blogError) throw blogError;

        console.log("Fetched blogs:", blogData);
        setBlogs(blogData);

        // Get unique category IDs
        const categoryIds = [
          ...new Set(blogData.map(blog => blog.category_id).filter(id => id !== null))
        ];
        console.log("Category IDs to fetch:", categoryIds);

        // Fetch category names
        let catMap = {};
        if (categoryIds.length > 0) {
          const { data: catData, error: catError } = await supabase
            .from("categories")
            .select("id, name")
            .in("id", categoryIds);

          if (catError) throw catError;

          catMap = {};
          if (catData) {
            catData.forEach(cat => {
              catMap[cat.id] = cat.name;
            });
          }
          console.log("Fetched categories:", catMap);
          setCategories(catMap);
        } else {
          console.log("No category IDs found");
        }

        // Get unique subcategory IDs
        const subcategoryIds = [
          ...new Set(
            blogData
              .filter(blog => blog.subcategory_ids && blog.subcategory_ids.length > 0)
              .flatMap(blog => blog.subcategory_ids)
          )
        ];
        console.log("Subcategory IDs to fetch:", subcategoryIds);

        // Fetch subcategory names
        let subcatMap = {};
        if (subcategoryIds.length > 0) {
          const { data: subcatData, error: subcatError } = await supabase
            .from("subcategories")
            .select("id, name")
            .in("id", subcategoryIds);

          if (subcatError) throw subcatError;

          subcatMap = {};
          if (subcatData) {
            subcatData.forEach(subcat => {
              subcatMap[subcat.id] = subcat.name;
            });
          }
          console.log("Fetched subcategories:", subcatMap);
          setSubcategories(subcatMap);
        } else {
          console.log("No subcategory IDs found");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const handleBlogClick = (blogId) => {
    onBlogSelect?.(blogId);
  };

  const { publishBlogs, draftBlogs } = blogs.reduce((acc, blog) => {
    const status = blog.status?.toLowerCase()?.trim();
    const isPublished = status === "publish";

    // Use "Uncategorized" if no category_id
    const categoryName = blog.category_id && categories[blog.category_id]
      ? categories[blog.category_id]
      : "Uncategorized";

    if (isPublished) {
      if (!acc.publishBlogs[categoryName]) acc.publishBlogs[categoryName] = [];
      acc.publishBlogs[categoryName].push(blog);
    } else {
      if (!acc.draftBlogs[categoryName]) acc.draftBlogs[categoryName] = [];
      acc.draftBlogs[categoryName].push(blog);
    }

    return acc;
  }, { publishBlogs: {}, draftBlogs: {} });

  if (loading) return <div className="loading">Loading blogs...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="blog-list-container">
      <h2 className="list-title">Your Articles</h2>

      <div className="section">
        <h3 className="section-title text-amber-300">Published</h3>
        {Object.keys(publishBlogs).length > 0 ? (
          Object.entries(publishBlogs).map(([category, categoryBlogs]) => (
            <div key={`published-${category}`} className="category-section">
              <h4 className="category-title">{category}</h4>
              {categoryBlogs.map(blog => (
                <BlogItem
                  key={blog.id}
                  blog={blog}
                  categoryName={category}
                  subcategoryNames={
                    blog.subcategory_ids && blog.subcategory_ids.length > 0
                      ? blog.subcategory_ids.map(id => subcategories[id] || "Unknown").filter(name => name !== "Unknown")
                      : []
                  }
                  onClick={() => handleBlogClick(blog.id)}
                />
              ))}
            </div>
          ))
        ) : (
          <div className="no-data">No published articles</div>
        )}
      </div>

      <div className="section">
        <h3 className="section-title text-amber-400">Drafts</h3>
        {Object.keys(draftBlogs).length > 0 ? (
          Object.entries(draftBlogs).map(([category, categoryBlogs]) => (
            <div key={`drafts-${category}`} className="category-section">
              <h4 className="category-title">{category}</h4>
              {categoryBlogs.map(blog => (
                <BlogItem
                  key={blog.id}
                  blog={blog}
                  categoryName={category}
                  subcategoryNames={
                    blog.subcategory_ids && blog.subcategory_ids.length > 0
                      ? blog.subcategory_ids.map(id => subcategories[id] || "Unknown").filter(name => name !== "Unknown")
                      : []
                  }
                  onClick={() => handleBlogClick(blog.id)}
                  isDraft
                />
              ))}
            </div>
          ))
        ) : (
          <div className="no-data">No draft articles</div>
        )}
      </div>

      <button className="new-post-button" onClick={onNewBlog}>
        + New Article
      </button>
    </div>
  );
}

function BlogItem({ blog, onClick, isDraft = false, categoryName, subcategoryNames }) {
  return (
    <div
      className={`blog-item ${isDraft ? 'draft' : ''}`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {blog.top_image && (
        <img
          src={blog.top_image}
          alt={`${blog.title} preview`}
          className="blog-image"
          style={{
            width: "50px",
            height: "50px",
            objectFit: "cover",
            marginRight: "10px"
          }}
        />
      )}
      <div className="blog-info">
        <h4>{blog.title}</h4>
        <span className="blog-category">Category: {categoryName}</span>
        {subcategoryNames.length > 0 && (
          <span className="blog-subcategories">
            Subcategories: {subcategoryNames.join(", ")}
          </span>
        )}
        {blog.publish_date && (
          <span className="blog-date">
            Published: {new Date(blog.publish_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}