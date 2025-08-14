import { useState } from "react";
import { BlogList } from "~/components/BlogList";
import { Editor } from "~/components/Editor";
import { TableOfContents } from "~/components/TableOfContents";

export default function BlogHome() {
  const [headings, setHeadings] = useState([]);

  return (
    <div className="flex h-screen">
      <div className="w-1/5 border-r p-4 overflow-y-auto">
        <BlogList />
      </div>
      <div className="w-3/5 border-r p-4 overflow-y-auto">
        <Editor onHeadingsChange={setHeadings} />
      </div>
      <div className="w-1/5 p-4 overflow-y-auto">
        <TableOfContents headings={headings} />
      </div>
    </div>
  );
}