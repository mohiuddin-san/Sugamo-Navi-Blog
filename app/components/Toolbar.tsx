import { useRef } from "react";

type ToolbarProps = {
  onFormat: (command: string, value?: string) => void;
  onPreviewToggle: () => void;
  isPreview: boolean;
};

export function Toolbar({ onFormat, onPreviewToggle, isPreview }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFormat = (command: string, value?: string) => {
    onFormat(command, value);
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onFormat('insertImage', event.target.result.toString());
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="toolbar">
      <button
        onClick={onPreviewToggle}
        className={`toolbar-button ${isPreview ? 'active' : ''}`}
        title="Toggle Preview"
      >
        {isPreview ? '✏️' : '👁️'}
      </button>
      
      {!isPreview && (
        <>
          <button
            onClick={() => handleFormat('bold')}
            className="toolbar-button"
            title="Bold"
          >
            <strong>B</strong>
          </button>
          
          <button
            onClick={() => handleFormat('italic')}
            className="toolbar-button"
            title="Italic"
          >
            <em>I</em>
          </button>
          
          <select
            onChange={(e) => handleFormat('formatBlock', e.target.value)}
            className="toolbar-select"
            title="Heading"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
          
          <button
            onClick={handleImageUpload}
            className="toolbar-button"
            title="Image"
          >
            🖼️
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </button>
        </>
      )}
    </div>
  );
}