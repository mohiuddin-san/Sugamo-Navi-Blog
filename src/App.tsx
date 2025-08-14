import { useState } from "react";
import { BlogList } from "./components/BlogList";
import { Editor } from "./components/Editor";
import { TableOfContents } from "./components/TableOfContents";

export default function App() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const [isPreview, setIsPreview] = useState(false);
  const [headingToScroll, setHeadingToScroll] = useState<string | null>(null);

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

  return (
    <div className="app-container">
      <div className="left-panel">
        <BlogList />
      </div>
      <div className="editor-panel">
        <Editor 
          onHeadingsChange={handleHeadingsChange}
          scrollToPosition={scrollPosition}
          onPreviewToggle={() => setIsPreview(!isPreview)}
          headingToScroll={headingToScroll}
          onHeadingScrolled={() => setHeadingToScroll(null)}
        />
      </div>
      <div className="right-panel">
        <TableOfContents 
          headings={headings} 
          onHeadingClick={handleHeadingClick}
          isPreview={isPreview}
        />
      </div>
    </div>
  );
}