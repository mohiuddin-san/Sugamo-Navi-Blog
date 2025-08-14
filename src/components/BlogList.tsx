export function BlogList() {
  const blogs = [
    { id: "1", title: "Getting Started with React", status: "published" },
    { id: "2", title: "Advanced TypeScript Patterns", status: "published" },
    { id: "3", title: "Remix vs Next.js", status: "draft" },
  ];

  return (
    <div className="blog-list-container">
      <h2 className="list-title">Your Articles</h2>
      <div className="published-section">
        <h3 className="section-title">Published</h3>
        {blogs.filter(b => b.status === 'published').map(blog => (
          <div key={blog.id} className="blog-item">
            {blog.title}
          </div>
        ))}
      </div>
      <div className="drafts-section">
        <h3 className="section-title">Drafts</h3>
        {blogs.filter(b => b.status === 'draft').map(blog => (
          <div key={blog.id} className="blog-item draft">
            {blog.title}
          </div>
        ))}
      </div>
      <button className="new-post-button">
        + New Article
      </button>
    </div>
  );
}