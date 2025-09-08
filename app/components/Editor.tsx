import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Toolbar } from "~/components/Toolbar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github.css";
import { ResizableBox } from "react-resizable";
import OGPPreview from "~/components/OGPPreview";
import "react-resizable/css/styles.css";
import supabase from "~/supabase";

import { FiImage, FiX, FiUpload } from "react-icons/fi";

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
  blogId?: string | null;
};

export default function Editor({
  onHeadingsChange,
  scrollToPosition,
  onPreviewToggle,
  headingToScroll,
  onHeadingScrolled,
  blogId: initialBlogId,
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
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [publishDate, setPublishDate] = useState("");
  const [blogId, setBlogId] = useState<string | null>(initialBlogId || null);
  const [topImage, setTopImage] = useState<string | null>(null);
  const [topImageFileName, setTopImageFileName] = useState<string | null>(null);
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const headingElements = useRef<{ [key: string]: HTMLElement | null }>({});
  const scrollRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const topImageInputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    console.log("Categories fetch useEffect running");
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name", { ascending: true });
      if (error) {
        console.error("Error fetching categories:", error);
      } else {
        setCategoriesList(data);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    console.log("Title extraction useEffect running", { content });
    if (content) {
      const h1Match = content.match(/^#\s+(.+)$/m);
      if (h1Match && !title) {
        setTitle(h1Match[1]);
      }
    }
  }, [content, title]);

  useEffect(() => {
    console.log("Blog fetch useEffect running", { initialBlogId, blogId });
    if (initialBlogId === null || initialBlogId === "new") {
      setContent("");
      setTitle("");
      setSelectedCategories([]);
      setTopImage(null);
      setTopImageFileName(null);
      setBlogId(null);
    } else if (initialBlogId !== blogId) {
      const fetchBlog = async () => {
        const { data, error } = await supabase
          .from("blogs")
          .select("title, details, top_image, status, publish_date, category_id")
          .eq("id", initialBlogId)
          .single();
        if (error) {
          console.error("Fetch blog error:", error);
          alert("Failed to load blog");
          return;
        }
        setTitle(data.title || "");
        setContent(data.details || "");
        setTopImage(data.top_image || null);
        setBlogId(initialBlogId);

        const primaryCat = data.category_id ? [data.category_id] : [];
        const { data: catData, error: catError } = await supabase
          .from("blog_categories")
          .select("category_id")
          .eq("blog_id", initialBlogId);
        if (catError) console.error("Fetch blog categories error:", catError);
        else {
          const allCatIds = [...primaryCat, ...catData.map((cat) => cat.category_id)];
          if (allCatIds.length > 0) {
            const { data: catNames, error: namesError } = await supabase
              .from("categories")
              .select("name")
              .in("id", allCatIds);
            if (namesError) console.error("Fetch category names error:", namesError);
            else setSelectedCategories(catNames.map((cat) => cat.name));
          } else {
            setSelectedCategories([]);
          }
        }
      };
      fetchBlog();
    }
  }, [initialBlogId, blogId]);

  const togglePreview = useCallback(() => {
    const newPreviewState = !isPreview;
    setIsPreview(newPreviewState);
    setSelectedImageId(null);
    setSelectedImageDimensions(null);
    setCursorNode(null);
    setCursorOffset(0);
    if (onPreviewToggle) {
      onPreviewToggle(newPreviewState);
    }
  }, [isPreview, onPreviewToggle]);

  const getPositionInMarkdown = (node: Node, offset: number): number => {
    if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
      const textContent = node.textContent || "";
      return content.indexOf(textContent) + offset;
    }
    return content.length;
  };

  const debouncedHandlePreviewClick = useCallback(
    debounce((e: React.MouseEvent<HTMLDivElement>) => {
      if (!previewRef.current) return;
      const range = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (range) {
        const markdownPosition = getPositionInMarkdown(range.startContainer, range.startOffset);
        setCursorPosition(markdownPosition);
        setCursorNode(range.startContainer);
        setCursorOffset(range.startOffset);

        let targetElement: HTMLElement | null = range.startContainer.parentElement;
        while (targetElement && !["P", "H1", "H2", "H3", "H4", "H5", "H6"].includes(targetElement.tagName)) {
          targetElement = targetElement.parentElement;
        }

        if (targetElement) {
          const previousHighlights = previewRef.current.querySelectorAll(".cursor-highlight");
          previousHighlights.forEach((el) => el.classList.remove("cursor-highlight"));
          targetElement.classList.add("cursor-highlight");
          setTimeout(() => {
            targetElement?.classList.remove("cursor-highlight");
          }, 2000);
        }
      }
    }, 300),
    [content]
  );

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    debouncedHandlePreviewClick(e);
  };

  const uploadImageToSupabase = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("blog-images")
      .upload(fileName, file);
    if (error) {
      console.error("Upload error:", error);
      alert("Image upload failed");
      return null;
    }
    const publicUrl = supabase.storage.from("blog-images").getPublicUrl(fileName).data.publicUrl;
    return { url: publicUrl, fileName };
  };

  const handleTopImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const uploaded = await uploadImageToSupabase(file);
      if (uploaded) {
        if (topImageFileName) {
          await supabase.storage.from("blog-images").remove([topImageFileName]);
        }
        setTopImage(uploaded.url);
        setTopImageFileName(uploaded.fileName);
      }
    }
  };

  const handleImageUpload = async (files: FileList, layout: "single" | "side-by-side" = "single") => {
    const validFiles = Array.from(files).filter((file) => file.type.match("image.*"));
    if (validFiles.length === 0) {
      alert("Please select at least one image file");
      return;
    }

    const position = isPreview ? cursorPosition : textareaRef.current ? textareaRef.current.selectionStart : content.length;

    let newContent = content;
    let imageMarkdowns: string[] = [];

    for (const [index, file] of validFiles.entries()) {
      const uploaded = await uploadImageToSupabase(file);
      if (!uploaded) continue;

      const { url, fileName } = uploaded;
      const imageId = Math.random().toString(36).substring(2, 9);

      const img = new Image();
      img.src = url;
      await new Promise((resolve) => { img.onload = resolve; });

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
        fileName,
      });

      const imageMd = `![image ${index + 1}](${url}?${params.toString()})`;
      imageMarkdowns.push(imageMd);
    }

    let combinedMarkdown = "";
    if (layout === "side-by-side" && imageMarkdowns.length > 1) {
      combinedMarkdown = `[side-by-side: ${imageMarkdowns.join("|")}]`;
    } else {
      combinedMarkdown = imageMarkdowns.join("\n\n");
    }

    newContent = content.substring(0, position) + combinedMarkdown + content.substring(position);
    setContent(newContent);
    setCursorNode(null);
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
  };

  const triggerImageUpload = (layout: "single" | "side-by-side") => {
    if (fileInputRef.current) {
      setImageLayout(layout);
      fileInputRef.current.click();
    }
  };

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
          newContent = newContent.slice(0, match.index) + newFull + newContent.slice(match.index + fullMatch.length);
          break;
        }
      }
      setContent(newContent);
    }, 300),
    [content, isPreview]
  );

  const removeImage = async (id: string) => {
    if (previewRef.current && isPreview) {
      scrollRef.current = previewRef.current.scrollTop;
    }
    const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let newContent = content;
    let fileNameToDelete = null;
    while ((match = regex.exec(content)) !== null) {
      const fullMatch = match[0];
      const urlStr = match[2];
      const [, paramStr] = urlStr.split("?");
      if (!paramStr) continue;
      const params = new URLSearchParams(paramStr);
      if (params.get("id") === id) {
        fileNameToDelete = params.get("fileName");
        newContent = newContent.slice(0, match.index) + newContent.slice(match.index + fullMatch.length);
        break;
      }
    }
    if (fileNameToDelete) {
      const { error } = await supabase.storage.from("blog-images").remove([fileNameToDelete]);
      if (error) console.error("Delete error:", error);
    }
    setContent(newContent);
    setSelectedImageId(null);
    setSelectedImageDimensions(null);
    setCursorNode(null);
    setCursorOffset(0);
  };

  const handleOGPCardInsert = (url: string) => {
    if (!url) return;

    try {
      new URL(url);
      const position = isPreview ? cursorPosition : textareaRef.current ? textareaRef.current.selectionStart : content.length;
      const newContent = `${content.substring(0, position)}\n\n[ogp:${url}]${content.substring(position)}`;
      setContent(newContent);
      setUrlForOGP("");
      setCursorNode(null);
      setCursorOffset(0);

      if (!isPreview && textareaRef.current) {
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.selectionStart = position + 7 + url.length;
            textareaRef.current.selectionEnd = position + 7 + url.length;
          }
        }, 0);
      }
    } catch (e) {
      alert("Please enter a valid URL");
    }
  };

  const handleOGPPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const urlMatch = pastedText.match(/(https?:\/\/[^\s]+)/g);
    if (urlMatch) {
      setUrlForOGP(urlMatch[0]);
    }
  };

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

  const registerHeading = (id: string, element: HTMLElement | null) => {
    if (element) {
      headingElements.current[id] = element;
    }
  };

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

  const getOrCreateCategoryIds = async (categoryNames: string[]) => {
    const categoryIds: string[] = [];
    for (const catName of categoryNames) {
      if (!catName) continue;
      const { data: existing, error: findError } = await supabase
        .from("categories")
        .select("id")
        .eq("name", catName)
        .single();
      if (findError && findError.code !== "PGRST116") {
        console.error("Category fetch error:", findError);
        alert("Failed to fetch category");
        return null;
      }
      if (existing) {
        categoryIds.push(existing.id);
        continue;
      }
      const { data: newCat, error: insertError } = await supabase
        .from("categories")
        .insert([{ name: catName }])
        .select("id")
        .single();
      if (insertError) {
        console.error("Category insert error:", insertError);
        alert("Failed to create category");
        return null;
      }
      categoryIds.push(newCat.id);
    }
    return categoryIds;
  };

  const saveBlog = async (status: "draft" | "publish", date?: string) => {
    if (!title) {
      alert("Please enter a title");
      return;
    }
    if (selectedCategories.length === 0 && !newCategory.trim()) {
      alert("Please select or add at least one category");
      return;
    }

    const allCategories = [...selectedCategories, newCategory.trim()].filter((cat, index, self) => cat && self.indexOf(cat) === index);
    const categoryIds = await getOrCreateCategoryIds(allCategories);
    if (!categoryIds || categoryIds.length === 0) return;

    const payload = {
      title,
      top_image: topImage || null,
      details: content,
      status,
      category_id: categoryIds[0], // Primary category
      publish_date: status === "publish" ? date : null,
    };

    try {
      let currentBlogId = blogId;
      if (blogId) {
        const { error } = await supabase.from("blogs").update(payload).eq("id", blogId);
        if (error) throw error;
        await supabase.from("blog_categories").delete().eq("blog_id", blogId); // Clear old additional categories
        alert("Blog updated successfully!");
      } else {
        const { data, error } = await supabase.from("blogs").insert([payload]).select("id").single();
        if (error) throw error;
        currentBlogId = data.id;
        setBlogId(currentBlogId);
        alert("Blog saved successfully!");
      }

      const additionalCatIds = categoryIds.slice(1);
      if (additionalCatIds.length > 0) {
        const categoryEntries = additionalCatIds.map((catId) => ({ blog_id: currentBlogId, category_id: catId }));
        const { error: catError } = await supabase.from("blog_categories").insert(categoryEntries);
        if (catError) throw catError;
      }
      setSelectedCategories(allCategories.slice(0, -1));
      setNewCategory("");
    } catch (error) {
      console.error("Save blog error:", error);
      alert("Failed to save blog");
    }
  };

  const handleSaveDraft = () => {
    saveBlog("draft");
  };

  const handlePublish = () => {
    setShowDateDialog(true);
  };

  const confirmPublish = () => {
    if (!publishDate) {
      alert("Please select a publish date");
      return;
    }
    saveBlog("publish", new Date(publishDate).toISOString());
    setShowDateDialog(false);
    setPublishDate("");
  };

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
      console.log("ImageComponent useEffect running", { isSelected, width, height, selectedImageDimensions });
      if (isSelected && (selectedImageDimensions?.width !== width || selectedImageDimensions?.height !== height)) {
        setSelectedImageDimensions({ width, height });
      }
    }, [isSelected, width, height, selectedImageDimensions]);

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
        <button
          onClick={() => removeImage(id)}
          style={{
            position: "absolute",
            top: "5px",
            right: "5px",
            padding: "2px 6px",
            background: "red",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          Remove
        </button>
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
                setCursorNode(null);
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
              setCursorNode(null);
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

  useEffect(() => {
    console.log("Headings useEffect running", { content, isPreview });
    if (onHeadingsChange) {
      const headings = extractHeadingsFromMarkdown(content);
      onHeadingsChange(headings);
    }
  }, [content, isPreview, onHeadingsChange]);

  useEffect(() => {
    console.log("Scroll to position useEffect running", { scrollToPosition, isPreview });
    if (scrollToPosition !== undefined && textareaRef.current && !isPreview) {
      textareaRef.current.scrollTop = scrollToPosition;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(scrollToPosition, scrollToPosition);
    }
  }, [scrollToPosition, isPreview]);

  useEffect(() => {
    console.log("Heading scroll useEffect running", { headingToScroll, isPreview });
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

  useEffect(() => {
    console.log("Preview scroll useEffect running", { content });
    if (previewRef.current && scrollRef.current > 0) {
      previewRef.current.scrollTop = scrollRef.current;
      scrollRef.current = 0;
    }
  }, [content]);

  useEffect(() => {
    console.log("Cursor scroll useEffect running", { cursorNode, cursorOffset });
    if (cursorRef.current) {
      cursorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [cursorNode, cursorOffset]);

  return (
    <div className="editor-container" ref={editorContainerRef}>
      {fullscreenImage && (
        <div className="image-modal" onClick={() => setFullscreenImage(null)}>
          <img src={fullscreenImage} alt="Fullscreen" onClick={(e) => e.stopPropagation()} />
          <button className="close-button" onClick={() => setFullscreenImage(null)}>
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

      <div className="top-image-section">
        <label className="section-label">Featured Image</label>
        <div 
          className={`top-image-upload ${!topImage ? 'empty' : ''}`}
          onClick={() => topImageInputRef.current?.click()}
        >
          {topImage ? (
            <>
              <img src={topImage} alt="Featured preview" className="top-image-preview" />
              <button 
                className="remove-image-button"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (topImageFileName) {
                    await supabase.storage.from("blog-images").remove([topImageFileName]);
                  }
                  setTopImage(null);
                  setTopImageFileName(null);
                }}
              >
                <FiX />
              </button>
            </>
          ) : (
            <div className="upload-placeholder">
              <FiUpload size={24} />
              <span>Click to upload featured image</span>
              <span className="recommended-size">Recommended: 1200×630px</span>
            </div>
          )}
          <input
            type="file"
            ref={topImageInputRef}
            accept="image/*"
            onChange={handleTopImageUpload}
            style={{ display: "none" }}
          />
        </div>
      </div>

      <div className="category-section">
        <label className="section-label">Categories</label>
        <div className="category-selector">
          <div className="selected-categories">
            {selectedCategories.map((cat, index) => (
              <span key={index} className="category-tag">
                {cat}
                <button 
                  onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== cat))}
                  className="remove-category"
                >
                  <FiX size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="category-input-container">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onFocus={() => setShowCategoryDropdown(true)}
              placeholder="Add new category"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCategory.trim()) {
                  setSelectedCategories([...selectedCategories, newCategory.trim()]);
                  setNewCategory('');
                  setShowCategoryDropdown(false);
                }
              }}
            />
            {showCategoryDropdown && categoriesList.length > 0 && (
              <div className="category-dropdown">
                {categoriesList
                  .filter(cat => !selectedCategories.includes(cat.name))
                  .map((cat) => (
                    <div 
                      key={cat.id}
                      className="category-option"
                      onClick={() => {
                        setSelectedCategories([...selectedCategories, cat.name]);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      {cat.name}
                    </div>
                  ))}
                <button
                  className="close-dropdown"
                  onClick={() => setShowCategoryDropdown(false)}
                  style={{
                    position: "absolute",
                    top: "5px",
                    right: "5px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <FiX size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
            onPaste={handleOGPPaste}
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
        <button className="save-button" onClick={handleSaveDraft}>
          Save Draft
        </button>
        <button className="publish-button" onClick={handlePublish}>
          Publish
        </button>
      </div>

      {showDateDialog && (
        <div className="date-dialog">
          <div className="date-dialog-content">
            <h3>Select Publish Date</h3>
            <input
              type="datetime-local"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
            />
            <div className="date-dialog-buttons">
              <button onClick={confirmPublish}>Confirm</button>
              <button onClick={() => setShowDateDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}