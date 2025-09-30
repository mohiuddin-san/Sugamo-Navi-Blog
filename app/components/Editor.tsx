import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Toolbar } from "~/components/Toolbar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github.css";
import OGPPreview from "~/components/OGPPreview";
import supabase from "~/supabase";
import { FiImage, FiX, FiUpload } from "react-icons/fi";
import { toString } from 'mdast-util-to-string';

type Language = "en" | "ja";

const editorTranslations = {
  en: {
    blogTitle: "Blog title",
    featuredImage: "Featured Image",
    clickToUpload: "Click to upload featured image",
    recommended: "Recommended: 1200×630px",
    category: "Category",
    selectOrType: "Select or type category name",
    typeToCreate: "Type to create new category",
    pressEnter: "Press Enter to create",
    asNewCategory: "as new category",
    addCategory: "Add Category",
    close: "Close",
    subcategories: "Subcategories",
    selectOrTypeSub: "Select or type subcategory name",
    typeToCreateSub: "Type to create new subcategory",
    asNewSubcategory: "as new subcategory",
    addSubcategory: "Add Subcategory",
    noSubcategories: "No subcategories found. You can create new ones above.",
    textColor: "Text Color",
    applyTextColor: "Apply Text Color",
    background: "Background",
    applyBackgroundColor: "Apply Background Color",
    enterUrlOGP: "Enter URL for OGP card",
    addOGPCard: "Add OGP Card",
    addSingleImage: "Add Single Image",
    addSideBySide: "Add Side-by-Side Images",
    writeContent: "Write your blog content here (Markdown supported)...",
    publishDate: "Publish Date",
    selectPublishDate: "Select publish date",
    saveDraft: "Save Draft",
    publish: "Publish",
    remove: "Remove",
    pleaseEnterTitle: "Please enter a title",
    pleaseSelectCategory: "Please select or add a category",
    pleaseSelectDate: "Please select a publish date",
    blogSavedSuccess: "Blog saved successfully!",
    blogUpdatedSuccess: "Blog updated successfully!",
    failedToSave: "Failed to save blog",
    failedToUpdate: "Failed to update blog",
    uncategorized: "Uncategorized"
  },
  ja: {
    blogTitle: "ブログタイトル",
    featuredImage: "アイキャッチ画像",
    clickToUpload: "クリックしてアイキャッチ画像をアップロード",
    recommended: "推奨: 1200×630px",
    category: "カテゴリー",
    selectOrType: "カテゴリー名を選択または入力",
    typeToCreate: "新しいカテゴリーを作成するには入力してください",
    pressEnter: "Enterキーを押して",
    asNewCategory: "を新しいカテゴリーとして作成",
    addCategory: "カテゴリーを追加",
    close: "閉じる",
    subcategories: "サブカテゴリー",
    selectOrTypeSub: "サブカテゴリー名を選択または入力",
    typeToCreateSub: "新しいサブカテゴリーを作成するには入力してください",
    asNewSubcategory: "を新しいサブカテゴリーとして作成",
    addSubcategory: "サブカテゴリーを追加",
    noSubcategories: "サブカテゴリーが見つかりません。上記で新しいサブカテゴリーを作成できます。",
    textColor: "テキストカラー",
    applyTextColor: "テキストカラーを適用",
    background: "背景",
    applyBackgroundColor: "背景色を適用",
    enterUrlOGP: "OGPカードのURLを入力",
    addOGPCard: "OGPカードを追加",
    addSingleImage: "画像を追加",
    addSideBySide: "横並び画像を追加",
    writeContent: "ブログコンテンツをここに記入してください（Markdown対応）...",
    publishDate: "公開日",
    selectPublishDate: "公開日を選択",
    saveDraft: "下書き保存",
    publish: "公開",
    remove: "削除",
    pleaseEnterTitle: "タイトルを入力してください",
    pleaseSelectCategory: "カテゴリーを選択または追加してください",
    pleaseSelectDate: "公開日を選択してください",
    blogSavedSuccess: "ブログが正常に保存されました！",
    blogUpdatedSuccess: "ブログが正常に更新されました！",
    failedToSave: "ブログの保存に失敗しました",
    failedToUpdate: "ブログの更新に失敗しました",
    uncategorized: "未分類"
  }
};

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
  language: Language;
};

type Category = {
  id: number;
  name: string;
};

type Subcategory = {
  id: number;
  name: string;
};

export default function Editor({
  onHeadingsChange,
  scrollToPosition,
  onPreviewToggle,
  headingToScroll,
  onHeadingScrolled,
  blogId: initialBlogId,
  language = "en"
}: EditorProps) {
  const t = editorTranslations[language];
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [activeColor, setActiveColor] = useState("#000000");
  const [activeBgColor, setActiveBgColor] = useState("#ffffff");
  const [urlForOGP, setUrlForOGP] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorNode, setCursorNode] = useState<Node | null>(null);
  const [cursorOffset, setCursorOffset] = useState(0);
  const [publishDate, setPublishDate] = useState("");
  const [blogId, setBlogId] = useState<string | null>(initialBlogId || null);
  const [topImage, setTopImage] = useState<string | null>(null);
  const [topImageFileName, setTopImageFileName] = useState<string | null>(null);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [subcategoriesList, setSubcategoriesList] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false);
  const [imageLayout, setImageLayout] = useState<"single" | "side-by-side">("single");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const headingElements = useRef<{ [key: string]: HTMLElement | null }>({});
  const scrollRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const topImageInputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<HTMLSpanElement | null>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const subcategoryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCategoriesAndSubcategories = async () => {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name")
        .order("name", { ascending: true });

      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
        alert("Failed to fetch categories: " + categoriesError.message);
        return;
      }

      setCategoriesList(categoriesData || []);

      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from("subcategories")
        .select("id, name")
        .order("name", { ascending: true });

      if (subcategoriesError) {
        console.error("Error fetching subcategories:", subcategoriesError);
        alert("Failed to fetch subcategories: " + subcategoriesError.message);
        return;
      }

      setSubcategoriesList(subcategoriesData || []);
    };

    fetchCategoriesAndSubcategories();
  }, []);

  useEffect(() => {
    if (content) {
      const h1Match = content.match(/^#\s+(.+)$/m);
      if (h1Match && !title) {
        setTitle(h1Match[1]);
      }
    }
  }, [content, title]);

  useEffect(() => {
    if (initialBlogId === null || initialBlogId === "new") {
      setContent("");
      setTitle("");
      setSelectedCategory("");
      setSelectedSubcategories([]);
      setTopImage(null);
      setTopImageFileName(null);
      setBlogId(null);
      setPublishDate("");
    } else if (initialBlogId !== blogId) {
      const fetchBlog = async () => {
        const { data, error } = await supabase
          .from("blogs")
          .select("id, title, details, top_image, publish_date, category_id, subcategory_ids")
          .eq("id", initialBlogId)
          .single();
        if (error) {
          console.error("Fetch blog error:", error);
          alert("Failed to load blog: " + error.message);
          return;
        }
        setTitle(data.title || "");
        setContent(data.details || "");
        setTopImage(data.top_image || null);
        setPublishDate(data.publish_date ? new Date(data.publish_date).toISOString().split("T")[0] : "");
        setBlogId(initialBlogId);

        if (data.category_id) {
          const { data: categoryData, error: categoryError } = await supabase
            .from("categories")
            .select("name")
            .eq("id", data.category_id)
            .single();
          if (categoryError) {
            console.error("Fetch category error:", categoryError);
            alert("Failed to fetch category: " + categoryError.message);
            return;
          }
          setSelectedCategory(categoryData.name || "");
        } else {
          setSelectedCategory("");
        }

        if (data.subcategory_ids && data.subcategory_ids.length > 0) {
          const { data: subcategoriesData, error: subcategoriesError } = await supabase
            .from("subcategories")
            .select("name")
            .in("id", data.subcategory_ids);
          if (subcategoriesError) {
            console.error("Fetch subcategories error:", subcategoriesError);
            alert("Failed to fetch subcategories: " + subcategoriesError.message);
            return;
          }
          setSelectedSubcategories(subcategoriesData.map(sub => sub.name) || []);
        } else {
          setSelectedSubcategories([]);
        }
      };
      fetchBlog();
    }
  }, [initialBlogId, blogId]);

  const togglePreview = useCallback(() => {
    const newPreviewState = !isPreview;
    setIsPreview(newPreviewState);
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
        while (targetElement && !["P", "H1", "H2", "H3", "H4", "H5", "H6", "DIV"].includes(targetElement.tagName)) {
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

    let imageHtmls: string[] = [];

    for (const [index, file] of validFiles.entries()) {
      const uploaded = await uploadImageToSupabase(file);
      if (!uploaded) continue;

      const { url, fileName } = uploaded;
      const imageId = Math.random().toString(36).substring(2, 9);

      const params = new URLSearchParams({
        id: imageId,
        fileName,
      });

      const imageHtml = `<img src="${url}?${params.toString()}" alt="Image ${index + 1}" style="width: 100%; height: auto; margin: 10px 0;" />`;
      imageHtmls.push(imageHtml);
    }

    let combinedHtml = "";
    if (layout === "side-by-side" && imageHtmls.length > 1) {
      combinedHtml = `<div style="display: flex; flex-direction: row; gap: 10px; margin: 10px 0; width: 100%;">
${imageHtmls.map(html => `<div style="flex: 1;">${html}</div>`).join("\n")}
</div>`;
    } else {
      combinedHtml = imageHtmls.join("\n");
    }

    const newContent = content.substring(0, position) + "\n" + combinedHtml + "\n" + content.substring(position);
    setContent(newContent);
    setCursorNode(null);
    setCursorOffset(0);

    if (!isPreview && textareaRef.current) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = position + combinedHtml.length + 2;
          textareaRef.current.selectionEnd = position + combinedHtml.length + 2;
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

  const removeImage = async (id: string) => {
    if (previewRef.current && isPreview) {
      scrollRef.current = previewRef.current.scrollTop;
    }
    const regex = /<img[^>]+id=([^>\s]+)/g;
    let newContent = content;
    let fileNameToDelete = null;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const fullMatch = match[0];
      const urlStr = match[0].match(/src="([^"]+)"/)?.[1] || "";
      const [, paramStr] = urlStr.split("?");
      if (!paramStr) continue;
      const params = new URLSearchParams(paramStr);
      if (params.get("id") === id) {
        fileNameToDelete = params.get("fileName");
        newContent = newContent.replace(fullMatch, "");
        const divRegex = /<div[^>]+>[\s\S]*?(<img[^>]+id=[^>]+>)[\s\S]*?<\/div>/g;
        newContent = newContent.replace(divRegex, (divMatch, imgMatch) => {
          if (imgMatch.includes(`id=${id}`)) return "";
          return divMatch;
        });
        break;
      }
    }
    if (fileNameToDelete) {
      const { error } = await supabase.storage.from("blog-images").remove([fileNameToDelete]);
      if (error) console.error("Delete error:", error);
    }
    setContent(newContent);
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
        newContent = `${content.substring(0, start)}<img src="${value}?id=${imageId}" alt="${selectedText || "image"}" style="width: 100%; height: auto; margin: 10px 0;" />${content.substring(end)}`;
        newCursorPos = end + value!.length + imageId.length + 38;
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

  const saveBlog = async (status: "draft" | "publish", date?: string) => {
    if (!title) {
      alert(t.pleaseEnterTitle);
      return;
    }

    if (!selectedCategory && !newCategory.trim()) {
      alert(t.pleaseSelectCategory);
      return;
    }

    if (status === "publish" && !date) {
      alert(t.pleaseSelectDate);
      return;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      alert("You must be logged in to save a blog");
      console.error("Auth error:", authError);
      return;
    }

    const categoryName = newCategory.trim() || selectedCategory;
    let categoryId: number | null = null;
    if (categoryName) {
      const { data: existingCategory, error: findError } = await supabase
        .from("categories")
        .select("id")
        .eq("name", categoryName)
        .maybeSingle();

      if (findError) {
        console.error("Category fetch error:", findError);
        alert("Failed to fetch category: " + findError.message);
        return;
      }

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const { data: newCat, error: insertError } = await supabase
          .from("categories")
          .insert([{ name: categoryName }])
          .select("id")
          .single();
        if (insertError) {
          console.error("Category insert error:", insertError);
          alert("Failed to create category: " + insertError.message);
          return;
        }
        categoryId = newCat.id;
        setCategoriesList([...categoriesList, { id: categoryId, name: categoryName }]);
        setSelectedCategory(categoryName);
        setNewCategory("");
      }
    }

    const allSubcategories = [...selectedSubcategories, newSubcategory.trim()].filter(
      (subcat, index, self) => subcat && self.indexOf(subcat) === index
    );
    let subcategoryIds: number[] = [];
    for (const subcatName of allSubcategories) {
      if (!subcatName) continue;
      const { data: existingSubcategory, error: findError } = await supabase
        .from("subcategories")
        .select("id")
        .eq("name", subcatName)
        .maybeSingle();

      if (findError) {
        console.error("Subcategory fetch error:", findError);
        alert("Failed to fetch subcategory: " + findError.message);
        return;
      }

      if (existingSubcategory) {
        subcategoryIds.push(existingSubcategory.id);
      } else {
        const { data: newSubcat, error: insertError } = await supabase
          .from("subcategories")
          .insert([{ name: subcatName, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
          .select("id")
          .single();
        if (insertError) {
          console.error("Subcategory insert error:", insertError);
          alert("Failed to create subcategory: " + insertError.message);
          return;
        }
        subcategoryIds.push(newSubcat.id);
        setSubcategoriesList([...subcategoriesList, { id: newSubcat.id, name: subcatName }]);
      }
    }

    const blogPayload = {
      title,
      top_image: topImage || null,
      details: content,
      status,
      publish_date: status === "publish" ? date : null,
      user_id: user.id,
      category_id: categoryId,
      subcategory_ids: subcategoryIds.length > 0 ? subcategoryIds : null,
      updated_at: new Date().toISOString(),
    };

    try {
      let currentBlogId = blogId;
      if (blogId) {
        const { error } = await supabase
          .from("blogs")
          .update(blogPayload)
          .eq("id", blogId)
          .eq("user_id", user.id);
        if (error) {
          console.error("Update blog error:", error);
          alert(t.failedToUpdate + ": " + error.message);
          return;
        }
        alert(t.blogUpdatedSuccess);
      } else {
        const { data, error } = await supabase
          .from("blogs")
          .insert([blogPayload])
          .select("id")
          .single();
        if (error) {
          console.error("Insert blog error:", error);
          alert(t.failedToSave + ": " + error.message);
          return;
        }
        currentBlogId = data.id;
        setBlogId(currentBlogId);
        alert(t.blogSavedSuccess);
      }

      setSelectedSubcategories(allSubcategories.slice(0, -1));
      setNewSubcategory("");
    } catch (error: any) {
      console.error("Save blog error:", error);
      alert("An unexpected error occurred while saving the blog: " + (error.message || "Unknown error"));
    }
  };

  const handleSaveDraft = () => {
    saveBlog("draft");
  };

  const handlePublish = () => {
    if (!publishDate) {
      alert(t.pleaseSelectDate);
      return;
    }
    saveBlog("publish", new Date(publishDate).toISOString());
  };

  const toggleCategoryDropdown = () => {
    setShowCategoryDropdown(!showCategoryDropdown);
    setShowSubcategoryDropdown(false);
  };

  const selectCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setNewCategory("");
    setShowCategoryDropdown(false);
  };

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategory(e.target.value);
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newCategory.trim()) {
      setSelectedCategory(newCategory.trim());
      setNewCategory("");
      setShowCategoryDropdown(false);
    } else if (e.key === 'Escape') {
      setShowCategoryDropdown(false);
      setNewCategory("");
    }
  };

  const toggleSubcategoryDropdown = () => {
    setShowSubcategoryDropdown(!showSubcategoryDropdown);
    setShowCategoryDropdown(false);
  };

  const selectSubcategory = (subcategoryName: string) => {
    if (!selectedSubcategories.includes(subcategoryName)) {
      setSelectedSubcategories([...selectedSubcategories, subcategoryName]);
    }
    setNewSubcategory("");
    setShowSubcategoryDropdown(false);
  };

  const removeSelectedSubcategory = (subcategoryName: string) => {
    setSelectedSubcategories(selectedSubcategories.filter(subcat => subcat !== subcategoryName));
  };

  const handleSubcategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSubcategory(e.target.value);
  };

  const handleSubcategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSubcategory.trim() && !selectedSubcategories.includes(newSubcategory.trim())) {
      setSelectedSubcategories([...selectedSubcategories, newSubcategory.trim()]);
      setNewSubcategory("");
      setShowSubcategoryDropdown(false);
    } else if (e.key === 'Escape') {
      setShowSubcategoryDropdown(false);
      setNewSubcategory("");
    }
  };

  const ImageComponent = memo(({ node, ...props }: any) => {
    const src = props.src || "";
    const [baseUrl, paramStr] = src.split("?");
    const params = new URLSearchParams(paramStr || "");
    const id = params.get("id") || "";
    const alt = props.alt || "Image";

    const containerStyle: React.CSSProperties = {
      position: "relative",
      display: "block",
      width: props.style?.width || "100%",
      margin: "10px 0",
    };

    return (
      <div className="image-container" style={containerStyle}>
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
          {t.remove}
        </button>
        <img
          src={baseUrl}
          alt={alt}
          style={{
            width: props.style?.width || "100%",
            height: props.style?.height || "auto",
            objectFit: "contain",
            cursor: "pointer",
            margin: props.style?.margin || "10px 0",
          }}
          onDoubleClick={() => setFullscreenImage(baseUrl)}
        />
        <div className="image-caption" style={{ textAlign: "center", marginTop: "5px" }}>
          {alt}
        </div>
      </div>
    );
  }, (prevProps, nextProps) => {
    return (
      prevProps.src === nextProps.src &&
      prevProps.alt === nextProps.alt &&
      JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style)
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
    div: ({ node, children, ...props }: any) => (
      <div {...props} style={props.style}>
        {children}
      </div>
    ),
    p: ({ node, children, ...props }: any) => {
      const textContent = toString(node);
      if (textContent.startsWith("[side-by-side:")) {
        return null;
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
    if (onHeadingsChange) {
      const headings = extractHeadingsFromMarkdown(content);
      onHeadingsChange(headings);
    }
  }, [content, onHeadingsChange]);

  useEffect(() => {
    if (scrollToPosition !== undefined && textareaRef.current && !isPreview) {
      textareaRef.current.scrollTop = scrollToPosition;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(scrollToPosition, scrollToPosition);
    }
  }, [scrollToPosition, isPreview]);

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

  useEffect(() => {
    if (previewRef.current && scrollRef.current > 0) {
      previewRef.current.scrollTop = scrollRef.current;
      scrollRef.current = 0;
    }
  }, [content]);

  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [cursorNode, cursorOffset]);

  const availableCategories = categoriesList.filter(cat => cat.name !== selectedCategory);
  const availableSubcategories = subcategoriesList.filter(subcat => !selectedSubcategories.includes(subcat.name));

  return (
    <div className="w-full bg-white p-5" ref={editorContainerRef}>
      {fullscreenImage && (
        <div
          className="image-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setFullscreenImage(null)}
        >
          <img
            src={fullscreenImage}
            alt="Fullscreen"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full"
          />
          <button
            className="close-button absolute top-4 right-4 bg-gray-500 text-white px-4 py-2 rounded"
            onClick={() => setFullscreenImage(null)}
          >
            {t.close}
          </button>
        </div>
      )}

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t.blogTitle}
        className="editor-title w-full p-2 mb-4 border rounded"
      />

      <div className="top-image-section mb-4">
        <label className="section-label block mb-2 font-semibold">{t.featuredImage}</label>
        <div
          className={`top-image-upload ${!topImage ? "empty" : ""} border rounded p-4 flex justify-center items-center cursor-pointer relative`}
          onClick={() => topImageInputRef.current?.click()}
        >
          {topImage ? (
            <>
              <img src={topImage} alt="Featured preview" className="top-image-preview max-w-full h-auto" />
              <button
                className="remove-image-button absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
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
            <div className="upload-placeholder text-center">
              <FiUpload size={24} className="mx-auto" />
              <span className="block">{t.clickToUpload}</span>
              <span className="block text-sm text-gray-500">{t.recommended}</span>
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

      <div className="category-section mb-4">
        <label className="section-label block mb-2 font-semibold">{t.category}</label>
        <div className="selected-items flex flex-wrap gap-2 mb-4">
          {selectedCategory && (
            <span
              className="category-tag bg-blue-100 text-blue-800 rounded px-2 py-1 flex items-center"
            >
              {selectedCategory}
              <button
                onClick={() => setSelectedCategory("")}
                className="remove-category ml-2 hover:bg-red-200 rounded"
              >
                <FiX size={12} />
              </button>
            </span>
          )}
        </div>
        <div className="category-input-container relative">
          <input
            ref={categoryInputRef}
            type="text"
            value={newCategory}
            onChange={handleCategoryInputChange}
            onFocus={toggleCategoryDropdown}
            placeholder={t.selectOrType}
            className="w-full p-2 border rounded"
            onKeyDown={handleCategoryKeyDown}
            disabled={!!selectedCategory}
          />
          {showCategoryDropdown && (
            <div className="category-dropdown absolute z-10 bg-white border rounded shadow-lg mt-1 w-full max-h-60 overflow-y-auto">
              <div className="p-2 border-b">
                <input
                  type="text"
                  value={newCategory}
                  onChange={handleCategoryInputChange}
                  placeholder={t.typeToCreate}
                  className="w-full p-2 border rounded"
                  onKeyDown={handleCategoryKeyDown}
                />
              </div>
              {availableCategories.length > 0 && (
                <div className="category-list">
                  {availableCategories.map((category) => (
                    <div
                      key={category.id}
                      className="category-option p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => selectCategory(category.name)}
                    >
                      <span className="font-medium">{category.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {availableCategories.length === 0 && newCategory.trim() && (
                <div className="p-3 text-center text-gray-500">
                  {t.pressEnter} "{newCategory}" {t.asNewCategory}
                </div>
              )}
              <div className="p-2 border-t flex justify-between">
                <button
                  onClick={() => {
                    if (newCategory.trim()) {
                      selectCategory(newCategory.trim());
                    }
                  }}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  disabled={!newCategory.trim()}
                >
                  {t.addCategory}
                </button>
                <button
                  onClick={toggleCategoryDropdown}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  {t.close}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="subcategory-section mb-4">
        <label className="section-label block mb-2 font-semibold">{t.subcategories}</label>
        <div className="selected-items flex flex-wrap gap-2 mb-4">
          {selectedSubcategories.map((subcat, index) => (
            <span
              key={`subcat-${index}`}
              className="subcategory-tag bg-green-100 text-green-800 rounded px-2 py-1 flex items-center"
            >
              {subcat}
              <button
                onClick={() => removeSelectedSubcategory(subcat)}
                className="remove-subcategory ml-2 hover:bg-red-200 rounded"
              >
                <FiX size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="subcategory-input-container relative">
          <input
            ref={subcategoryInputRef}
            type="text"
            value={newSubcategory}
            onChange={handleSubcategoryInputChange}
            onFocus={toggleSubcategoryDropdown}
            placeholder={t.selectOrTypeSub}
            className="w-full p-2 border rounded"
            onKeyDown={handleSubcategoryKeyDown}
          />
          {showSubcategoryDropdown && (
            <div className="subcategory-dropdown absolute z-10 bg-white border rounded shadow-lg mt-1 w-full max-h-60 overflow-y-auto">
              <div className="p-2 border-b">
                <input
                  type="text"
                  value={newSubcategory}
                  onChange={handleSubcategoryInputChange}
                  placeholder={t.typeToCreateSub}
                  className="w-full p-2 border rounded"
                  onKeyDown={handleSubcategoryKeyDown}
                />
              </div>
              {availableSubcategories.length > 0 && (
                <div className="subcategory-list">
                  {availableSubcategories.map((subcategory) => (
                    <div
                      key={subcategory.id}
                      className="subcategory-option p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => selectSubcategory(subcategory.name)}
                    >
                      <span className="font-medium">{subcategory.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {availableSubcategories.length === 0 && newSubcategory.trim() && (
                <div className="p-3 text-center text-gray-500">
                  {t.pressEnter} "{newSubcategory}" {t.asNewSubcategory}
                </div>
              )}
              <div className="p-2 border-t flex justify-between">
                <button
                  onClick={() => {
                    if (newSubcategory.trim()) {
                      selectSubcategory(newSubcategory.trim());
                    }
                  }}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                  disabled={!newSubcategory.trim()}
                >
                  {t.addSubcategory}
                </button>
                <button
                  onClick={toggleSubcategoryDropdown}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  {t.close}
                </button>
              </div>
            </div>
          )}
        </div>
        {availableSubcategories.length === 0 && !showSubcategoryDropdown && (
          <div className="mt-2 p-3 bg-blue-50 rounded text-sm text-blue-700">
            <p>{t.noSubcategories}</p>
          </div>
        )}
      </div>

      <Toolbar
        onFormat={handleFormat}
        onPreviewToggle={togglePreview}
        isPreview={isPreview}
        onImageUpload={handleImageUpload}
        imageLayout={imageLayout}
        onImageLayoutChange={(layout) => setImageLayout(layout)}
      />

      <div className="editor-toolbar flex gap-4 mb-4">
        <div className="color-picker flex items-center gap-2">
          <label className="flex items-center gap-1">
            {t.textColor}
            <input
              type="color"
              value={activeColor}
              onChange={(e) => setActiveColor(e.target.value)}
            />
          </label>
          <button
            onClick={() => debouncedApplyColorStyle(activeColor, false)}
            className="apply-color-button bg-blue-500 text-white px-2 py-1 rounded"
          >
            {t.applyTextColor}
          </button>
          <label className="flex items-center gap-1">
            {t.background}
            <input
              type="color"
              value={activeBgColor}
              onChange={(e) => setActiveBgColor(e.target.value)}
            />
          </label>
          <button
            onClick={() => debouncedApplyColorStyle(activeBgColor, true)}
            className="apply-color-button bg-blue-500 text-white px-2 py-1 rounded"
          >
            {t.applyBackgroundColor}
          </button>
        </div>

        <div className="ogp-input flex items-center gap-2">
          <input
            type="text"
            value={urlForOGP}
            onChange={(e) => setUrlForOGP(e.target.value)}
            onPaste={handleOGPPaste}
            placeholder={t.enterUrlOGP}
            className="p-2 border rounded"
            onKeyDown={(e) => e.key === "Enter" && handleOGPCardInsert(urlForOGP)}
          />
          <button
            onClick={() => handleOGPCardInsert(urlForOGP)}
            className="bg-blue-500 text-white px-2 py-1 rounded"
          >
            {t.addOGPCard}
          </button>
        </div>
      </div>

      <div className="editor-toolbar mb-4">
        <button
          className="toolbar-button bg-blue-500 text-black px-2 py-1 rounded mr-2"
          onClick={() => triggerImageUpload("single")}
        >
          {t.addSingleImage}
        </button>
        <button
          className="toolbar-button bg-blue-500 text-black px-2 py-1 rounded"
          onClick={() => triggerImageUpload("side-by-side")}
        >
          {t.addSideBySide}
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

      {isPreview ? (
        <div
          ref={previewRef}
          className="markdown-preview border rounded p-4"
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
          className="editor-content w-full h-96 p-2 border rounded mb-4"
          placeholder={t.writeContent}
        />
      )}

      <div className="publish-date-section mt-4 mb-4">
        <label className="section-label block mb-2 font-semibold">{t.publishDate}</label>
        <input
          type="date"
          value={publishDate}
          onChange={(e) => setPublishDate(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder={t.selectPublishDate}
        />
      </div>

      <div className="editor-actions flex gap-4 mt-4">
        <button
          className="save-button bg-gray-500 text-white px-4 py-2 rounded"
          onClick={handleSaveDraft}
        >
          {t.saveDraft}
        </button>
        <button
          className="publish-button bg-green-500 text-white px-4 py-2 rounded"
          onClick={handlePublish}
        >
          {t.publish}
        </button>
      </div>
    </div>
  );
}