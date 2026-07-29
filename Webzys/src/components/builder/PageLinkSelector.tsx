import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PageLinkSelectorProps {
  value: string;
  onChange: (value: string) => void;
  pages: Array<{ id: string; name: string }>;
  placeholder?: string;
}

const PageLinkSelector = ({ value, onChange, pages, placeholder = "Select link type" }: PageLinkSelectorProps) => {
  const [linkType, setLinkType] = useState<"page" | "url" | "none">(
    value.startsWith("#page:") ? "page" : value && value !== "#" ? "url" : "none"
  );
  const [customUrl, setCustomUrl] = useState(
    linkType === "url" ? value : ""
  );
  const [selectedPageId, setSelectedPageId] = useState(
    linkType === "page" ? value.replace("#page:", "") : ""
  );

  // Update state when value prop changes
  useEffect(() => {
    if (value.startsWith("#page:")) {
      setLinkType("page");
      setSelectedPageId(value.replace("#page:", ""));
    } else if (value && value !== "#") {
      setLinkType("url");
      setCustomUrl(value);
    } else {
      setLinkType("none");
    }
  }, [value]);

  const handleLinkTypeChange = (type: "page" | "url" | "none") => {
    setLinkType(type);
    if (type === "none") {
      onChange("#");
    } else if (type === "page") {
      if (selectedPageId) {
        onChange(`#page:${selectedPageId}`);
      } else if (pages.length > 0) {
        onChange(`#page:${pages[0].id}`);
        setSelectedPageId(pages[0].id);
      }
    } else {
      onChange(customUrl || "#");
    }
  };

  const handlePageChange = (pageId: string) => {
    setSelectedPageId(pageId);
    onChange(`#page:${pageId}`);
  };

  const handleUrlChange = (url: string) => {
    setCustomUrl(url);
    onChange(url || "#");
  };

  return (
    <div className="space-y-2">
      <Label>Link Type</Label>
      <Select
        value={linkType}
        onValueChange={(value) => handleLinkTypeChange(value as "page" | "url" | "none")}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Link</SelectItem>
          <SelectItem value="page">Link to Page</SelectItem>
          <SelectItem value="url">Custom URL</SelectItem>
        </SelectContent>
      </Select>

      {linkType === "page" && (
        <div className="space-y-2">
          <Label>Select Page</Label>
          <Select
            value={selectedPageId}
            onValueChange={handlePageChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a page" />
            </SelectTrigger>
            <SelectContent>
              {pages.map((page) => (
                <SelectItem key={page.id} value={page.id}>
                  {page.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {linkType === "url" && (
        <div className="space-y-2">
          <Label>URL</Label>
          <Input
            value={customUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com or #section"
          />
        </div>
      )}
    </div>
  );
};

export default PageLinkSelector;

