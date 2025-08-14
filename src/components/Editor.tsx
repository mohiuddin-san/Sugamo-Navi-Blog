
import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Toolbar } from "./Toolbar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github.css";
import { ResizableBox } from "react-resizable";
import OGPPreview from "./OGPPreview";
import "react-resizable/css/styles.css";

// Simple debounce function
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

type Heading = {
  id: string;
  text: string;
  level: number;
  position: number;
  parentId?: string | null;
};

type EditorProps = {
  onHeadingsChange?: (headings: Heading[]) => void;
  scrollToPosition?: number;
  onPreviewToggle?: (isPreview: boolean) => void;
  headingToScroll?: string | null;
  onHeadingScrolled?: () => void;
};

export function Editor({
  onHeadingsChange,
  scrollToPosition,
  onPreviewToggle,
  headingToScroll,
  onHeadingScrolled,
}: EditorProps) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [activeColor, setActiveColor] = useState("#000000");
  const [activeBgColor, setActiveBgColor] = useState("#ffffff");
  const [urlForOGP, setUrlForOGP] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedImageDimensions, setSelectedImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [imageLayout, setImageLayout] = useState<"single" | "side-by-side">("single");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorNode, setCursorNode] = useState<Node | null>(null);
  const [cursorOffset, setCursorOffset] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const headingElements = useRef<{ [key: string]: HTMLElement | null }>({});
  const scrollRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<HTMLSpanElement | null>(null);

  // Toggle preview mode
  const togglePreview = () => {
    const newPreviewState = !isPreview;
    setIsPreview(newPreviewState);
    setSelectedImageId(null);
    setSelectedImageDimensions(null);
    setCursorNode(null); // Clear cursor when switching modes
    setCursorOffset(0);
    if (onPreviewToggle) {
      onPreviewToggle(newPreviewState);
    }
  };

  // Calculate markdown position from preview click
  const getPositionInMarkdown = (node: Node, offset: number): number => {
    if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
      const textContent = node.textContent || '';
      return content.indexOf(textContent) + offset;
    }
    return content.length;
  };

  // Handle clicks in preview mode to set cursor position and show cursor
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;

    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (range) {
      const markdownPosition = getPositionInMarkdown(range.startContainer, range.startOffset);
      setCursorPosition(markdownPosition);
      setCursorNode(range.startContainer);
      setCursorOffset(range.startOffset);

      // Find the closest markdown element (e.g., p, h1, h2, etc.)
      let targetElement: HTMLElement | null = range.startContainer.parentElement;
      while (targetElement && !['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(targetElement.tagName)) {
        targetElement = targetElement.parentElement;
      }

      if (targetElement) {
        // Remove previous highlights
        const previousHighlights = previewRef.current.querySelectorAll('.cursor-highlight');
        previousHighlights.forEach((el) => el.classList.remove('cursor-highlight'));

        // Add highlight to the clicked element
        targetElement.classList.add('cursor-highlight');

        // Remove highlight after 2 seconds
        setTimeout(() => {
          targetElement?.classList.remove('cursor-highlight');
        }, 2000);
      }
    }
  };

  // Handle image upload with layout option
  const handleImageUpload = (files: FileList, layout: "single" | "side-by-side" = "single") => {
    const validFiles = Array.from(files).filter((file) => file.type.match("image.*"));
    if (validFiles.length === 0) {
      alert("Please select at least one image file");
      return;
    }

    const position = isPreview ? cursorPosition : 
                   (textareaRef.current ? textareaRef.current.selectionStart : content.length);

    let newContent = content;
    let imageMarkdowns: string[] = [];

    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const baseUrl = event.target.result.toString();
          const imageId = Math.random().toString(36).substring(2, 9);

          const img = new Image();
          img.src = baseUrl;
          img.onload = () => {
            let initWidth = img.width;
            let initHeight = img.height;

            if (layout === "single") {
              const maxWidth = 800;
              if (initWidth > maxWidth) {
                initHeight = (maxWidth / initWidth) * initHeight;
                initWidth = maxWidth;
              }
            } else {
              const targetWidth = 300;
              initHeight = (targetWidth / initWidth) * initHeight;
              initWidth = targetWidth;
            }

            initWidth = Math.round(initWidth);
            initHeight = Math.round(initHeight);

            const params = new URLSearchParams({
              id: imageId,
              width: initWidth.toString(),
              height: initHeight.toString(),
              align: "none",
            });

            const imageMd = `![image ${index + 1}](${baseUrl}?${params.toString()})`;
            imageMarkdowns.push(imageMd);

            if (imageMarkdowns.length === validFiles.length) {
              let combinedMarkdown = "";
              if (layout === "side-by-side" && imageMarkdowns.length > 1) {
                combinedMarkdown = `[side-by-side: ${imageMarkdowns.join("|")}]`;
              } else {
                combinedMarkdown = imageMarkdowns.join("\n\n");
              }

              newContent = content.substring(0, position) + combinedMarkdown + content.substring(position);
              setContent(newContent);
              setCursorNode(null); // Clear cursor after image insertion
              setCursorOffset(0);

              if (!isPreview && textareaRef.current) {
                setTimeout(() => {
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.selectionStart = position + combinedMarkdown.length;
                    textareaRef.current.selectionEnd = position + combinedMarkdown.length;
                  }
                }, 0);
              }
            }
          };
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Trigger file input click for preview mode
  const triggerImageUpload = (layout: "single" | "side-by-side") => {
    if (fileInputRef.current) {
      setImageLayout(layout);
      fileInputRef.current.click();
    }
  };

  // Debounced applyColorStyle
  const debouncedApplyColorStyle = useCallback(
    debounce((color: string, isBgColor: boolean) => {
      if (!isPreview && textareaRef.current) {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);

        if (!selectedText) return;

        const style = isBgColor ? `background-color: ${color}; color: inherit;` : `color: ${color};`;
        const styledText = `<span style="${style}">${selectedText}</span>`;
        const newContent = content.substring(0, start) + styledText + content.substring(end);
        setContent(newContent);

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + styledText.length;
            textareaRef.current.selectionEnd = start + styledText.length;
            textareaRef.current.focus();
          }
        }, 0);
      }
    }, 300),
    [content, isPreview]
  );

  // Debounced updateImageInContent
  const debouncedUpdateImageInContent = useCallback(
    debounce((id: string, updates: { [key: string]: string | number }) => {
      if (previewRef.current && isPreview) {
        scrollRef.current = previewRef.current.scrollTop;
      }

      const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      let newContent = content;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const fullMatch = match[0];
        const alt = match[1];
        const urlStr = match[2];
        const [baseUrl, paramStr] = urlStr.split("?");
        if (!paramStr) continue;
        const params = new URLSearchParams(paramStr);
        if (params.get("id") === id) {
          Object.entries(updates).forEach(([key, value]) => {
            params.set(key, value.toString());
          });
          const newUrlStr = `${baseUrl}?${params.toString()}`;
          const newFull = `![${alt}](${newUrlStr})`;
          newContent =
            newContent.slice(0, match.index) + newFull + newContent.slice(match.index + fullMatch.length);
          break;
        }
      }
      setContent(newContent);
    }, 300),
    [content, isPreview]
  );

  // Remove image from content
  const removeImage = (id: string) => {
    if (previewRef.current && isPreview) {
      scrollRef.current = previewRef.current.scrollTop;
    }
    const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let newContent = content;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const fullMatch = match[0];
      const urlStr = match[2];
      const [, paramStr] = urlStr.split("?");
      if (!paramStr) continue;
      const params = new URLSearchParams(paramStr);
      if (params.get("id") === id) {
        newContent = newContent.slice(0, match.index) + newContent.slice(match.index + fullMatch.length);
        break;
      }
    }
    setContent(newContent);
    setSelectedImageId(null);
    setSelectedImageDimensions(null);
    setCursorNode(null); // Clear cursor after image removal
    setCursorOffset(0);
  };

  // Handle OGP card insertion
  const handleOGPCardInsert = (url: string) => {
    if (!url) return;

    try {
      new URL(url);
      const newContent = `${content}\n\n[ogp:${url}]`;
      setContent(newContent);
      setUrlForOGP("");
      setCursorNode(null); // Clear cursor after OGP insertion
      setCursorOffset(0);
    } catch (e) {
      alert("Please enter a valid URL");
    }
  };

  // Extract headings from markdown source
  const extractHeadingsFromMarkdown = (markdown: string): Heading[] => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: Heading[] = [];
    let match;
    const stack: { level: number; id: string }[] = [];

    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^\w]+/g, "-");

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      const parentId = stack.length > 0 ? stack[stack.length - 1].id : null;
      headings.push({
        level,
        text,
        id,
        position: match.index,
        parentId,
      });
      stack.push({ level, id });
    }
    return headings;
  };

  // Register heading in components for markdown mode
  const registerHeading = (id: string, element: HTMLElement | null) => {
    if (element) {
      headingElements.current[id] = element;
    }
  };

  // Handle formatting commands
  const handleFormat = (command: string, value?: string) => {
    if (!isPreview && !textareaRef.current) return;

    const textarea = textareaRef.current!;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let newContent = content;
    let newCursorPos = start;

    switch (command) {
      case "bold":
        newContent = `${content.substring(0, start)}**${selectedText}**${content.substring(end)}`;
        newCursorPos = end + 2;
        break;
      case "italic":
        newContent = `${content.substring(0, start)}_${selectedText}_${content.substring(end)}`;
        newCursorPos = end + 1;
        break;
      case "underline":
        newContent = `${content.substring(0, start)}<u>${selectedText}</u>${content.substring(end)}`;
        newCursorPos = end + 4;
        break;
      case "formatBlock":
        if (value === "h1") {
          newContent = `${content.substring(0, start)}# ${selectedText}\n${content.substring(end)}`;
        } else if (value === "h2") {
          newContent = `${content.substring(0, start)}## ${selectedText}\n${content.substring(end)}`;
        } else if (value === "h3") {
          newContent = `${content.substring(0, start)}### ${selectedText}\n${content.substring(end)}`;
        }
        break;
      case "insertUnorderedList":
        newContent = `${content.substring(0, start)}- ${selectedText}\n${content.substring(end)}`;
        break;
      case "insertOrderedList":
        newContent = `${content.substring(0, start)}1. ${selectedText}\n${content.substring(end)}`;
        break;
      case "createLink":
        newContent = `${content.substring(0, start)}[${selectedText}](${value})${content.substring(end)}`;
        newCursorPos = end + 3 + (value?.length || 0);
        break;
      case "insertImage":
        const imageId = Math.random().toString(36).substring(2, 9);
        newContent = `${content.substring(0, start)}![${selectedText || "image"}](${value}?id=${imageId}&width=400&height=300&align=none)${content.substring(end)}`;
        newCursorPos = end + 13 + (value?.length || 0) + imageId.length + 13;
        break;
      case "insertText":
        newContent = `${content.substring(0, start)}${value}${content.substring(end)}`;
        newCursorPos = start + (value?.length || 0);
        break;
      case "insertCodeBlock":
        newContent = `${content.substring(0, start)}\`\`\`\n${selectedText}\n\`\`\`${content.substring(end)}`;
        newCursorPos = end + 8;
        break;
      case "setImageLayout":
        setImageLayout(value as "single" | "side-by-side");
        break;
      default:
        return;
    }

    setContent(newContent);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Memoized img component with enhanced resizing
  const ImageComponent = memo(({ node, ...props }: any) => {
    const src = props.src || "";
    const [baseUrl, paramStr] = src.split("?");
    const params = new URLSearchParams(paramStr || "");
    const id = params.get("id") || "";
    const width = parseInt(params.get("width") || "400", 10);
    const height = parseInt(params.get("height") || "300", 10);
    const align = params.get("align") || "none";

    const isSelected = id === selectedImageId;

    useEffect(() => {
      if (isSelected) {
        setSelectedImageDimensions({ width, height });
      }
    }, [isSelected, width, height]);

    const containerStyle: React.CSSProperties = {
      position: "relative",
      display: "inline-block",
      maxWidth: "100%",
    };

    if (align === "left") {
      Object.assign(containerStyle, {
        float: "left",
        margin: "10px 20px 10px 0",
        clear: "both",
      });
    } else if (align === "right") {
      Object.assign(containerStyle, {
        float: "right",
        margin: "10px 0 10px 20px",
        clear: "both",
      });
    } else if (align === "center") {
      Object.assign(containerStyle, {
        display: "block",
        margin: "20px auto",
        textAlign: "center",
      });
    }

    return (
      <div className={`image-container align-${align}`} style={containerStyle}>
        {isSelected && isPreview ? (
          <ResizableBox
            width={width}
            height={height}
            minConstraints={[50, 50]}
            maxConstraints={[1200, 1200]}
            lockAspectRatio={false}
            resizeHandles={["s", "w", "e", "n", "sw", "se", "nw", "ne"]}
            onResizeStop={(e, data) => {
              const newWidth = Math.round(data.size.width);
              const newHeight = Math.round(data.size.height);
              debouncedUpdateImageInContent(id, {
                width: newWidth,
                height: newHeight,
              });
              setSelectedImageDimensions({
                width: newWidth,
                height: newHeight,
              });
            }}
            className="resizable-image-box"
          >
            <img
              src={baseUrl}
              alt={props.alt || ""}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                cursor: "move",
                border: isSelected ? "2px dashed #3b82f6" : "none",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageId(id);
                setCursorNode(null); // Clear cursor when selecting image
                setCursorOffset(0);
              }}
              onDoubleClick={() => setFullscreenImage(baseUrl)}
            />
          </ResizableBox>
        ) : (
          <img
            src={baseUrl}
            alt={props.alt || ""}
            style={{
              width: `${width}px`,
              maxWidth: "100%",
              height: `${height}px`,
              objectFit: "contain",
              cursor: "pointer",
              border: isSelected ? "2px dashed #3b82f6" : "none",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageId(id);
              setCursorNode(null); // Clear cursor when selecting image
              setCursorOffset(0);
            }}
            onDoubleClick={() => setFullscreenImage(baseUrl)}
          />
        )}
        {props.alt && <div className="image-caption">{props.alt}</div>}
        {isSelected && isPreview && (
          <div className="image-controls">
            <div className="alignment-buttons">
              <button
                onClick={() => debouncedUpdateImageInContent(id, { align: "left" })}
                className={align === "left" ? "active" : ""}
              >
                Left
              </button>
              <button
                onClick={() => debouncedUpdateImageInContent(id, { align: "center" })}
                className={align === "center" ? "active" : ""}
              >
                Center
              </button>
              <button
                onClick={() => debouncedUpdateImageInContent(id, { align: "right" })}
                className={align === "right" ? "active" : ""}
              >
                Right
              </button>
              <button
                onClick={() => debouncedUpdateImageInContent(id, { align: "none" })}
                className={align === "none" ? "active" : ""}
              >
                Inline
              </button>
              <button
                onClick={() => removeImage(id)}
                className="remove-button"
              >
                Remove
              </button>
            </div>
            <div className="dimension-controls">
              <label>
                Width:
                <input
                  type="number"
                  value={selectedImageDimensions?.width || width}
                  onChange={(e) => {
                    e.preventDefault();
                    const newWidth = parseInt(e.target.value, 10);
                    if (!isNaN(newWidth)) {
                      setSelectedImageDimensions((prev) => ({ ...prev!, width: newWidth }));
                      debouncedUpdateImageInContent(id, { width: newWidth });
                    }
                  }}
                />
                px
              </label>
              <label>
                Height:
                <input
                  type="number"
                  value={selectedImageDimensions?.height || height}
                  onChange={(e) => {
                    e.preventDefault();
                    const newHeight = parseInt(e.target.value, 10);
                    if (!isNaN(newHeight)) {
                      setSelectedImageDimensions((prev) => ({ ...prev!, height: newHeight }));
                      debouncedUpdateImageInContent(id, { height: newHeight });
                    }
                  }}
                />
                px
              </label>
            </div>
          </div>
        )}
      </div>
    );
  }, (prevProps, nextProps) => {
    return (
      prevProps.src === nextProps.src &&
      prevProps.alt === nextProps.alt &&
      prevProps.id === nextProps.id &&
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height &&
      prevProps.align === nextProps.align
    );
  });

  // Custom markdown components
  const markdownComponents = {
    h1: ({ node, ...props }: any) => (
      <h1 id={props.id} ref={(el) => registerHeading(props.id || "", el)} {...props} />
    ),
    h2: ({ node, ...props }: any) => (
      <h2 id={props.id} ref={(el) => registerHeading(props.id || "", el)} {...props} />
    ),
    h3: ({ node, ...props }: any) => (
      <h3 id={props.id} ref={(el) => registerHeading(props.id || "", el)} {...props} />
    ),
    h4: ({ node, ...props }: any) => (
      <h4 id={props.id} ref={(el) => registerHeading(props.id || "", el)} {...props} />
    ),
    h5: ({ node, ...props }: any) => (
      <h5 id={props.id} ref={(el) => registerHeading(props.id || "", el)} {...props} />
    ),
    h6: ({ node, ...props }: any) => (
      <h6 id={props.id} ref={(el) => registerHeading(props.id || "", el)} {...props} />
    ),
    table: ({ node, ...props }: any) => (
      <div className="table-container">
        <table {...props} />
      </div>
    ),
    img: ImageComponent,
    p: ({ node, children, ...props }: any) => {
      if (typeof children === "string" && children.startsWith("[side-by-side:")) {
        const images = children.match(/!\[.*?\]\(.*?\)/g) || [];
        return (
          <div className="side-by-side-container">
            {images.map((imgMd: string, index: number) => (
              <div key={index} className="side-by-side-image">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={markdownComponents}
                >
                  {imgMd}
                </ReactMarkdown>
              </div>
            ))}
          </div>
        );
      }
      // Insert cursor in paragraph
      return (
        <p {...props}>
          {cursorNode && cursorNode.parentElement === node && typeof children === "string" ? (
            <>
              {children.substring(0, cursorOffset)}
              <span ref={cursorRef} className="blinking-cursor">|</span>
              {children.substring(cursorOffset)}
            </>
          ) : (
            children
          )}
        </p>
      );
    },
    span: ({ node, ...props }: any) => {
      return <span {...props} style={props.style} />;
    },
    a: ({ node, href, children, ...props }: any) => {
      if (href?.startsWith("ogp:")) {
        const actualUrl = href.replace("ogp:", "");
        return <OGPPreview url={actualUrl} />;
      }
      return (
        <a href={href} {...props}>
          {children}
        </a>
      );
    },
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline ? (
        <div className="code-block">
          <div className="code-language">{match?.[1] || "code"}</div>
          <code className={className} {...props}>
            {children}
          </code>
        </div>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  // Update headings when content or preview changes
  useEffect(() => {
    if (onHeadingsChange) {
      const headings = extractHeadingsFromMarkdown(content);
      onHeadingsChange(headings);
    }
  }, [content, isPreview, onHeadingsChange]);

  // Handle scroll to position in edit mode
  useEffect(() => {
    if (scrollToPosition !== undefined && textareaRef.current && !isPreview) {
      textareaRef.current.scrollTop = scrollToPosition;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(scrollToPosition, scrollToPosition);
    }
  }, [scrollToPosition, isPreview]);

  // Handle scroll to heading in preview mode
  useEffect(() => {
    if (headingToScroll && isPreview) {
      const element = headingElements.current[headingToScroll];
      if (element && previewRef.current) {
        element.scrollIntoView({ behavior: "smooth" });
        element.classList.add("heading-highlight");
        setTimeout(() => {
          element.classList.remove("heading-highlight");
        }, 1500);
        if (onHeadingScrolled) {
          onHeadingScrolled();
        }
      }
    }
  }, [headingToScroll, isPreview, onHeadingScrolled]);

  // Restore scroll position after content update
  useEffect(() => {
    if (previewRef.current && scrollRef.current > 0) {
      previewRef.current.scrollTop = scrollRef.current;
      scrollRef.current = 0;
    }
  }, [content]);

  // Scroll to cursor when it appears
  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [cursorNode, cursorOffset]);

  return (
    <div className="editor-container" ref={editorContainerRef}>
      {fullscreenImage && (
        <div className="image-modal" onClick={() => setFullscreenImage(null)}>
          <img
            src={fullscreenImage}
            alt="Fullscreen"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="close-button"
            onClick={() => setFullscreenImage(null)}
          >
            Close
          </button>
        </div>
      )}

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Blog title"
        className="editor-title"
      />

      <Toolbar
        onFormat={handleFormat}
        onPreviewToggle={togglePreview}
        isPreview={isPreview}
        onImageUpload={handleImageUpload}
        imageLayout={imageLayout}
        onImageLayoutChange={(layout) => setImageLayout(layout)}
      />

      <div className="editor-toolbar">
        <div className="color-picker">
          <label>
            Text Color
            <input
              type="color"
              value={activeColor}
              onChange={(e) => setActiveColor(e.target.value)}
            />
          </label>
          <button
            onClick={() => debouncedApplyColorStyle(activeColor, false)}
            className="apply-color-button"
          >
            Apply Text Color
          </button>
          <label>
            Background
            <input
              type="color"
              value={activeBgColor}
              onChange={(e) => setActiveBgColor(e.target.value)}
            />
          </label>
          <button
            onClick={() => debouncedApplyColorStyle(activeBgColor, true)}
            className="apply-color-button"
          >
            Apply Background Color
          </button>
        </div>

        <div className="ogp-input">
          <input
            type="text"
            value={urlForOGP}
            onChange={(e) => setUrlForOGP(e.target.value)}
            placeholder="Enter URL for OGP card"
            onKeyDown={(e) => e.key === "Enter" && handleOGPCardInsert(urlForOGP)}
          />
          <button onClick={() => handleOGPCardInsert(urlForOGP)}>Add OGP Card</button>
        </div>
      </div>

      {isPreview && (
        <div className="editor-toolbar" style={{ marginBottom: "10px" }}>
          <button
            className="toolbar-button"
            onClick={() => triggerImageUpload("single")}
          >
            Add Single Image
          </button>
          <button
            className="toolbar-button"
            onClick={() => triggerImageUpload("side-by-side")}
          >
            Add Side-by-Side Images
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                handleImageUpload(e.target.files, imageLayout);
              }
            }}
          />
        </div>
      )}

      {isPreview ? (
        <div
          ref={previewRef}
          className="markdown-preview"
          onClick={handlePreviewClick}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={markdownComponents}
          >
            {`# ${title}\n${content}`}
          </ReactMarkdown>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="editor-content"
          placeholder="Write your blog content here (Markdown supported)..."
        />
      )}

      <div className="editor-actions">
        <button className="save-button">Save Draft</button>
        <button className="publish-button">Publish</button>
      </div>
    </div>
  );
}
