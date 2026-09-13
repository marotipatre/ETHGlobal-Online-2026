import { readFileSync } from "fs";
import { join } from "path";
import type { ReactElement } from "react";

// Simple markdown renderer component
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: ReactElement[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let inList = false;
  let listItems: ReactElement[] = [];
  let isNumberedList = false;

  const flushList = () => {
    if (listItems.length > 0) {
      const ListTag = isNumberedList ? 'ol' : 'ul';
      const listClass = isNumberedList 
        ? "list-decimal ml-6 mb-4 space-y-2" 
        : "list-disc ml-6 mb-4 space-y-2";
      
      elements.push(
        <ListTag key={`list-${elements.length}`} className={listClass}>
          {listItems}
        </ListTag>
      );
      listItems = [];
      inList = false;
      isNumberedList = false;
    }
  };

  lines.forEach((line, index) => {
    // Handle code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        flushList();
        elements.push(
          <pre
            key={`code-${index}`}
            className="bg-[#1e1e1e] text-green-400 p-6 rounded-lg border-2 border-black overflow-x-auto my-6 font-mono text-xs md:text-sm shadow-[4px_4px_0px_0px_#000] whitespace-pre"
            style={{ fontFamily: "monospace" }}
          >
            <code className="block">{codeBlockContent.join("\n")}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start code block
        flushList();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Handle headers
    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1
          key={`h1-${index}`}
          className="text-4xl md:text-5xl font-black text-black mt-12 mb-6 first:mt-0"
        >
          {line.slice(2)}
        </h1>
      );
      return;
    }
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2
          key={`h2-${index}`}
          className="text-3xl md:text-4xl font-black text-black mt-10 mb-4"
        >
          {line.slice(3)}
        </h2>
      );
      return;
    }
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3
          key={`h3-${index}`}
          className="text-2xl md:text-3xl font-black text-black mt-8 mb-3"
        >
          {line.slice(4)}
        </h3>
      );
      return;
    }

    // Handle horizontal rules
    if (line.trim() === "---") {
      flushList();
      elements.push(
        <hr
          key={`hr-${index}`}
          className="my-8 border-t-2 border-black"
        />
      );
      return;
    }

    // Handle empty lines
    if (line.trim() === "") {
      flushList();
      return;
    }

    // Handle regular content
    if (line.trim()) {
      // Check if it's a numbered list item
      const numberedListMatch = line.trim().match(/^(\d+)\.\s+(.+)$/);
      if (numberedListMatch) {
        isNumberedList = true;
        inList = true;
        listItems.push(
          <li key={`li-${index}`} className="text-black/80 font-medium leading-relaxed">
            {numberedListMatch[2]}
          </li>
        );
        return;
      }

      // Check if it's a bullet list item
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        inList = true;
        listItems.push(
          <li key={`li-${index}`} className="text-black/80 font-medium leading-relaxed">
            {line.trim().slice(2)}
          </li>
        );
        return;
      }

      // Regular paragraph - handle bold text and checkmarks
      flushList();
      const processedLine = line
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-black text-black">$1</strong>')
        .replace(/✅/g, '<span class="text-green-600">✅</span>')
        .replace(/⚠️/g, '<span class="text-yellow-600">⚠️</span>')
        .replace(/🎉/g, '<span class="text-[var(--primary)]">🎉</span>');
      
      elements.push(
        <p 
          key={`p-${index}`} 
          className="text-black/80 font-medium mb-4 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />
      );
    }
  });

  // Flush any remaining list items
  flushList();

  return <div className="markdown-content">{elements}</div>;
}

export default function SDKPage() {
  // Read the markdown file
  const filePath = join(process.cwd(), "SDK_GUIDE.md");
  const content = readFileSync(filePath, "utf-8");

  return (
    <div className="max-w-5xl mx-auto py-12">
      <div className="bg-white border-2 border-black rounded-xl p-8 md:p-12 shadow-[6px_6px_0px_0px_#000]">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
