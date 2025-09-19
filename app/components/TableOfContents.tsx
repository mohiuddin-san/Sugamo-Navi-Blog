// app/components/EnhancedTableOfContents.jsx
import { useMemo } from "react";

type Heading = {
  id: string;
  text: string;
  level: number;
  position: number;
  depth?: number;
  children?: Heading[];
};

type TableOfContentsProps = {
  headings: Heading[];
  onHeadingClick: (position: number, id: string) => void;
  isPreview: boolean;
  content: string;
};

export default function EnhancedTableOfContents({ headings, onHeadingClick, isPreview, content }: TableOfContentsProps) {
  // Build a hierarchical structure of headings
  const tocItems = useMemo(() => {
    const result: Heading[] = [];
    const stack: {level: number, items: Heading[]}[] = [{ level: 1, items: result }];
    
    headings
      .filter(heading => heading.level >= 2 && heading.level <= 6)
      .forEach(heading => {
        const item = { 
          ...heading, 
          depth: heading.level - 2,
          children: [] 
        };
        
        // Find the appropriate parent level
        while (stack.length > 0 && stack[stack.length-1].level >= heading.level) {
          stack.pop();
        }
        
        // Add to current parent's children
        if (stack.length > 0) {
          stack[stack.length-1].items.push(item);
          stack.push({ level: heading.level, items: item.children || [] });
        }
      });
    
    return result;
  }, [headings]);

  // Calculate the actual scroll position in the preview
  const calculateScrollPosition = (position: number) => {
    if (!isPreview) return position;
    
    // For preview mode, we need to account for the title being added
    const titleOffset = `# ${content.split('\n')[0]}\n`.length;
    return position + titleOffset;
  };

  // Render the TOC items recursively
  const renderTocItems = (items: Heading[]) => {
    return items.map((item) => (
      <li 
        key={item.id} 
        className={`toc-item level-${item.level}`}
        style={{ paddingLeft: `${item.depth * 16}px` }}
      >
        <button
          className="toc-link"
          onClick={() => onHeadingClick(calculateScrollPosition(item.position), item.id)}
        >
          {item.text}
        </button>
        {item.children && item.children.length > 0 && (
          <ul className="toc-sublist">
            {renderTocItems(item.children)}
          </ul>
        )}
      </li>
    ));
  };

  return (
    <div className="toc-container">
      <h2 className="toc-title">Table of Contents</h2>
      {tocItems.length > 0 ? (
        <ul className="toc-list">
          {renderTocItems(tocItems)}
        </ul>
      ) : (
        <p className="toc-empty">No headings found</p>
      )}
    </div>
  );
}