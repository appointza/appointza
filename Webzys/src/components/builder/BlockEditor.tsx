import { useState } from "react";
import PricingBlockEditor from "./PricingBlockEditor";
import { X, ImageIcon, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Block, MediaItem } from "@/types/builder";
import MediaLibrary from "./MediaLibrary";
import { useContext } from "react";
import PageLinkSelector from "./PageLinkSelector";

interface BlockEditorProps {
  block: Block;
  onUpdate: (data: Record<string, any>) => void;
  onClose: () => void;
  pages?: Array<{ id: string; name: string }>;
}

// Accept images and setImages as props from parent (Builder)
const BlockEditor = ({ block, onUpdate, onClose, images, setImages, pages = [] }: BlockEditorProps & { images: any[]; setImages: any }) => {
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [mediaSelectionTarget, setMediaSelectionTarget] = useState<string | null>(null);

  const handleSelectImage = (image: MediaItem | MediaItem[]) => {
    // Handle array (from selection mode) - take first item
    const selectedImage = Array.isArray(image) ? image[0] : image;
    
    if (!selectedImage) {
      setMediaSelectionTarget(null);
      return;
    }

    if (mediaSelectionTarget === "single") {
      onUpdate({ src: selectedImage.url, alt: selectedImage.name });
    } else if (mediaSelectionTarget === "hero-image") {
      onUpdate({ image: selectedImage.url });
    } else if (mediaSelectionTarget === "section-bg") {
      onUpdate({ backgroundImage: selectedImage.url });
    } else if (mediaSelectionTarget === "avatar") {
      onUpdate({ avatar: selectedImage.url });
    } else if (mediaSelectionTarget === "logo") {
      onUpdate({ logo: selectedImage.url });
    } else if (mediaSelectionTarget === "thumbnail") {
      onUpdate({ thumbnail: selectedImage.url });
    } else if (mediaSelectionTarget?.startsWith("carousel-")) {
      const index = parseInt(mediaSelectionTarget.split("-")[1]);
      const images = [...(block.data.images || [])];
      if (Array.isArray(image)) {
        // Multiple images selected
        const newImages = image.map(img => ({ src: img.url, alt: img.name }));
        images[index] = newImages[0];
      } else {
        images[index] = { src: selectedImage.url, alt: selectedImage.name };
      }
      onUpdate({ images });
    } else if (mediaSelectionTarget === "carousel-add") {
      const images = [...(block.data.images || [])];
      if (Array.isArray(image)) {
        images.push(...image.map(img => ({ src: img.url, alt: img.name })));
      } else {
        images.push({ src: selectedImage.url, alt: selectedImage.name });
      }
      onUpdate({ images });
    } else if (mediaSelectionTarget?.startsWith("gallery-")) {
      const index = parseInt(mediaSelectionTarget.split("-")[1]);
      if (Array.isArray(image)) {
        const images = [...(block.data.images || []), ...image.map(img => ({ src: img.url, alt: img.name }))];
        onUpdate({ images });
      } else {
        const images = [...(block.data.images || [])];
        images[index] = { src: selectedImage.url, alt: selectedImage.name };
        onUpdate({ images });
      }
    } else if (mediaSelectionTarget === "gallery-add") {
      const images = [...(block.data.images || [])];
      if (Array.isArray(image)) {
        images.push(...image.map(img => ({ src: img.url, alt: img.name })));
      } else {
        images.push({ src: selectedImage.url, alt: selectedImage.name });
      }
      onUpdate({ images });
    } else if (mediaSelectionTarget?.startsWith("team-avatar-")) {
      const index = parseInt(mediaSelectionTarget.split("-")[2]);
      const members = [...(block.data.members || [])];
      members[index] = { ...members[index], avatar: selectedImage.url };
      onUpdate({ members });
    } else if (mediaSelectionTarget?.startsWith("review-avatar-")) {
      const index = parseInt(mediaSelectionTarget.split("-")[2]);
      const reviews = [...(block.data.reviews || [])];
      reviews[index] = { ...reviews[index], avatar: selectedImage.url };
      onUpdate({ reviews });
    } else if (mediaSelectionTarget?.startsWith("logo-item-")) {
      const index = parseInt(mediaSelectionTarget.split("-")[2]);
      const logos = [...(block.data.logos || [])];
      logos[index] = { ...logos[index], logo: selectedImage.url, name: selectedImage.name };
      onUpdate({ logos });
    } else if (mediaSelectionTarget === "logo-add") {
      const logos = [...(block.data.logos || [])];
      if (Array.isArray(image)) {
        logos.push(...image.map(img => ({ logo: img.url, name: img.name })));
      } else {
        logos.push({ logo: selectedImage.url, name: selectedImage.name });
      }
      onUpdate({ logos });
    } else if (mediaSelectionTarget?.startsWith("social-video-thumb-")) {
      const index = parseInt(mediaSelectionTarget.split("-")[3]);
      const videos = [...(block.data.videos || [])];
      videos[index] = { ...videos[index], thumbnail: selectedImage.url };
      onUpdate({ videos });
    }
    setMediaSelectionTarget(null);
  };

  const openMediaLibrary = (target: string) => {
    setMediaSelectionTarget(target);
    setIsMediaLibraryOpen(true);
  };

  const renderEditor = () => {
    switch (block.type) {
      case "hero":
      case "hero-2":
      case "hero-3":
      case "hero-4":
      case "hero-5":
      case "hero-6":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={block.data.subtitle || ""}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                rows={3}
              />
            </div>
            {(block.type === "hero-2" || block.type === "hero-4" || block.type === "hero-5") && (
              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="image"
                    value={block.data.image || ""}
                    onChange={(e) => onUpdate({ image: e.target.value })}
                    placeholder="Image URL"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setMediaSelectionTarget("hero-image");
                      setIsMediaLibraryOpen(true);
                    }}
                    title="Select from Media Library"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {block.type === "hero-6" && (
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  value={block.data.videoUrl || ""}
                  onChange={(e) => onUpdate({ videoUrl: e.target.value })}
                  placeholder="https://example.com/video.mp4"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="buttonText">Primary Button Text</Label>
              <Input
                id="buttonText"
                value={block.data.buttonText || ""}
                onChange={(e) => onUpdate({ buttonText: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <PageLinkSelector
                value={block.data.buttonLink || "#"}
                onChange={(href) => onUpdate({ buttonLink: href })}
                pages={pages}
                placeholder="Primary Button Link"
              />
            </div>
            {(block.type === "hero-2" || block.type === "hero-5" || block.type === "hero-6") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="secondaryButtonText">Secondary Button Text (Optional)</Label>
                  <Input
                    id="secondaryButtonText"
                    value={block.data.secondaryButtonText || ""}
                    onChange={(e) => onUpdate({ secondaryButtonText: e.target.value })}
                    placeholder="Learn More"
                  />
                </div>
                {block.data.secondaryButtonText && (
                  <div className="space-y-2">
                    <PageLinkSelector
                      value={block.data.secondaryButtonLink || "#"}
                      onChange={(href) => onUpdate({ secondaryButtonLink: href })}
                      pages={pages}
                      placeholder="Secondary Button Link"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        );

      case "section":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Section Title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={block.data.content || ""}
                onChange={(e) => onUpdate({ content: e.target.value })}
                rows={6}
                placeholder="Enter your content here (HTML supported)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backgroundImage">Background Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundImage"
                  value={block.data.backgroundImage || ""}
                  onChange={(e) => onUpdate({ backgroundImage: e.target.value })}
                  placeholder="Image URL"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setMediaSelectionTarget("section-bg");
                    setIsMediaLibraryOpen(true);
                  }}
                  title="Select from Media Library"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Background Color (if no image)</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={block.data.backgroundColor || "#ffffff"}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={block.data.backgroundColor || "#ffffff"}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Text Alignment</Label>
              <div className="flex gap-2">
                {(["left", "center", "right"] as const).map((align) => (
                  <Button
                    key={align}
                    variant={block.data.textAlign === align ? "default" : "outline"}
                    size="sm"
                    onClick={() => onUpdate({ textAlign: align })}
                    className="flex-1 capitalize"
                  >
                    {align}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Padding</Label>
              <div className="flex gap-2">
                {(["small", "medium", "large"] as const).map((size) => (
                  <Button
                    key={size}
                    variant={block.data.padding === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => onUpdate({ padding: size })}
                    className="flex-1 capitalize"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
            {block.data.backgroundImage && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="backgroundOverlay"
                      checked={block.data.backgroundOverlay || false}
                      onChange={(e) => onUpdate({ backgroundOverlay: e.target.checked })}
                      className="rounded border-border"
                    />
                    <Label htmlFor="backgroundOverlay" className="cursor-pointer">
                      Add Dark Overlay (for better text readability)
                    </Label>
                  </div>
                </div>
                {block.data.backgroundOverlay && (
                  <div className="space-y-2">
                    <Label htmlFor="overlayOpacity">Overlay Opacity: {((block.data.overlayOpacity || 0.5) * 100).toFixed(0)}%</Label>
                    <input
                      type="range"
                      id="overlayOpacity"
                      min="0"
                      max="1"
                      step="0.1"
                      value={block.data.overlayOpacity || 0.5}
                      onChange={(e) => onUpdate({ overlayOpacity: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                )}
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="buttonText">Primary Button Text</Label>
              <Input
                id="buttonText"
                value={block.data.buttonText || ""}
                onChange={(e) => onUpdate({ buttonText: e.target.value })}
                placeholder="Button Text"
              />
            </div>
            {block.data.buttonText && (
              <div className="space-y-2">
                <PageLinkSelector
                  value={block.data.buttonLink || "#"}
                  onChange={(href) => onUpdate({ buttonLink: href })}
                  pages={pages}
                  placeholder="Primary Button Link"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="secondaryButtonText">Secondary Button Text (Optional)</Label>
              <Input
                id="secondaryButtonText"
                value={block.data.secondaryButtonText || ""}
                onChange={(e) => onUpdate({ secondaryButtonText: e.target.value })}
                placeholder="Secondary Button Text"
              />
            </div>
            {block.data.secondaryButtonText && (
              <div className="space-y-2">
                <PageLinkSelector
                  value={block.data.secondaryButtonLink || "#"}
                  onChange={(href) => onUpdate({ secondaryButtonLink: href })}
                  pages={pages}
                  placeholder="Secondary Button Link"
                />
              </div>
            )}
          </div>
        );

      case "text":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={block.data.content || ""}
                onChange={(e) => onUpdate({ content: e.target.value })}
                rows={8}
              />
            </div>
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex gap-2">
                <Input
                  value={block.data.src || ""}
                  onChange={(e) => onUpdate({ src: e.target.value })}
                  placeholder="Image URL"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => openMediaLibrary("single")}
                  title="Select from Media Library"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={block.data.alt || ""}
                onChange={(e) => onUpdate({ alt: e.target.value })}
              />
            </div>
            {block.data.src && (
              <div className="rounded-lg overflow-hidden border border-border">
                <img
                  src={block.data.src}
                  alt={block.data.alt}
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
        );

      case "image-carousel":
        const images = block.data.images || [];
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Images</Label>
              <div className="space-y-2">
                {images.map((img: { src: string; alt: string }, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30">
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{img.alt || "No alt text"}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => openMediaLibrary(`carousel-${index}`)}
                    >
                      <ImageIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive"
                      onClick={() => {
                        const newImages = images.filter((_: any, i: number) => i !== index);
                        onUpdate({ images: newImages });
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => openMediaLibrary("carousel-add")}
              >
                <Plus className="h-4 w-4" />
                Add Image
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="autoPlay">Auto Play</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoPlay"
                  checked={block.data.autoPlay || false}
                  onChange={(e) => onUpdate({ autoPlay: e.target.checked })}
                  className="rounded border-border"
                />
                <span className="text-sm text-muted-foreground">Enable auto-slide</span>
              </div>
            </div>
          </div>
        );

      case "features":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Section Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label>Features</Label>
              {(block.data.features || []).map((feature: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border border-border space-y-2">
                  <Input
                    placeholder="Feature title"
                    value={feature.title || ""}
                    onChange={(e) => {
                      const newFeatures = [...block.data.features];
                      newFeatures[index] = { ...newFeatures[index], title: e.target.value };
                      onUpdate({ features: newFeatures });
                    }}
                  />
                  <Input
                    placeholder="Description"
                    value={feature.description || ""}
                    onChange={(e) => {
                      const newFeatures = [...block.data.features];
                      newFeatures[index] = { ...newFeatures[index], description: e.target.value };
                      onUpdate({ features: newFeatures });
                    }}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const newFeatures = [...(block.data.features || []), { title: "", description: "", icon: "Zap" }];
                  onUpdate({ features: newFeatures });
                }}
              >
                Add Feature
              </Button>
            </div>
          </div>
        );

      case "cta":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={block.data.subtitle || ""}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonText">Button Text</Label>
              <Input
                id="buttonText"
                value={block.data.buttonText || ""}
                onChange={(e) => onUpdate({ buttonText: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <PageLinkSelector
                value={block.data.buttonLink || "#"}
                onChange={(href) => onUpdate({ buttonLink: href })}
                pages={pages}
                placeholder="Button Link"
              />
            </div>
          </div>
        );

      case "testimonial":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quote">Quote</Label>
              <Textarea
                id="quote"
                value={block.data.quote || ""}
                onChange={(e) => onUpdate({ quote: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={block.data.author || ""}
                onChange={(e) => onUpdate({ author: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={block.data.role || ""}
                onChange={(e) => onUpdate({ role: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL</Label>
              <div className="flex gap-2">
              <Input
                id="avatar"
                value={block.data.avatar || ""}
                onChange={(e) => onUpdate({ avatar: e.target.value })}
                  placeholder="Avatar URL"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => openMediaLibrary("avatar")}
                  title="Select from Media Library"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case "header":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logoText">Logo Text</Label>
              <Input
                id="logoText"
                value={block.data.logoText || ""}
                onChange={(e) => onUpdate({ logoText: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <div className="flex gap-2">
                <Input
                  id="logo"
                  value={block.data.logo || ""}
                  onChange={(e) => onUpdate({ logo: e.target.value })}
                  placeholder="Logo URL"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => openMediaLibrary("logo")}
                  title="Select from Media Library"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaText">CTA Button Text</Label>
              <Input
                id="ctaText"
                value={block.data.ctaText || ""}
                onChange={(e) => onUpdate({ ctaText: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Navigation Links</Label>
              {(block.data.links || []).map((link: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border border-border space-y-2">
                  <Input
                    placeholder="Link label"
                    value={link.label || ""}
                    onChange={(e) => {
                      const newLinks = [...(block.data.links || [])];
                      newLinks[index] = { ...newLinks[index], label: e.target.value };
                      onUpdate({ links: newLinks });
                    }}
                  />
                  <PageLinkSelector
                    value={link.href || "#"}
                    onChange={(href) => {
                      const newLinks = [...(block.data.links || [])];
                      newLinks[index] = { ...newLinks[index], href };
                      onUpdate({ links: newLinks });
                    }}
                    pages={pages}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const newLinks = (block.data.links || []).filter((_: any, i: number) => i !== index);
                      onUpdate({ links: newLinks });
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Link
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => {
                  const newLinks = [...(block.data.links || []), { label: "", href: "#" }];
                  onUpdate({ links: newLinks });
                }}
              >
                <Plus className="h-4 w-4" />
                Add Link
              </Button>
            </div>
            <div className="space-y-2">
              <PageLinkSelector
                value={block.data.ctaLink || "#"}
                onChange={(href) => onUpdate({ ctaLink: href })}
                pages={pages}
                placeholder="CTA Button Link"
              />
            </div>
          </div>
        );

      case "footer":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={block.data.companyName || ""}
                onChange={(e) => onUpdate({ companyName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={block.data.description || ""}
                onChange={(e) => onUpdate({ description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Footer Text Items</Label>
              <p className="text-sm text-muted-foreground">
                Add any text items. Each can optionally link to a page or URL.
              </p>
              {(block.data.textItems || block.data.links || []).map((item: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border border-border space-y-2">
                  <Input
                    placeholder="Text content"
                    value={item.text || item.label || ""}
                    onChange={(e) => {
                      const textItems = block.data.textItems || block.data.links || [];
                      const newItems = [...textItems];
                      newItems[index] = { 
                        ...newItems[index], 
                        text: e.target.value,
                        label: e.target.value // Keep label for backward compatibility
                      };
                      onUpdate({ textItems: newItems });
                    }}
                  />
                  <PageLinkSelector
                    value={item.href || "#"}
                    onChange={(href) => {
                      const textItems = block.data.textItems || block.data.links || [];
                      const newItems = [...textItems];
                      newItems[index] = { ...newItems[index], href };
                      onUpdate({ textItems: newItems });
                    }}
                    pages={pages}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const textItems = block.data.textItems || block.data.links || [];
                      const newItems = textItems.filter((_: any, i: number) => i !== index);
                      onUpdate({ textItems: newItems });
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Item
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => {
                  const textItems = block.data.textItems || block.data.links || [];
                  const newItems = [...textItems, { text: "", href: "#" }];
                  onUpdate({ textItems: newItems });
                }}
              >
                <Plus className="h-4 w-4" />
                Add Text Item
              </Button>
            </div>
          </div>
        );

      case "benefits":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label>Benefits</Label>
              {(block.data.benefits || []).map((benefit: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border border-border space-y-2">
                  <Input
                    placeholder="Benefit text"
                    value={benefit.text || ""}
                    onChange={(e) => {
                      const newBenefits = [...(block.data.benefits || [])];
                      newBenefits[index] = { ...newBenefits[index], text: e.target.value };
                      onUpdate({ benefits: newBenefits });
                    }}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const newBenefits = [...(block.data.benefits || []), { text: "" }];
                  onUpdate({ benefits: newBenefits });
                }}
              >
                Add Benefit
              </Button>
            </div>
          </div>
        );

      case "stats":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label>Statistics</Label>
              {(block.data.stats || []).map((stat: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border border-border space-y-2">
                  <Input
                    placeholder="Value (e.g., 1000+)"
                    value={stat.value || ""}
                    onChange={(e) => {
                      const newStats = [...(block.data.stats || [])];
                      newStats[index] = { ...newStats[index], value: e.target.value };
                      onUpdate({ stats: newStats });
                    }}
                  />
                  <Input
                    placeholder="Label"
                    value={stat.label || ""}
                    onChange={(e) => {
                      const newStats = [...(block.data.stats || [])];
                      newStats[index] = { ...newStats[index], label: e.target.value };
                      onUpdate({ stats: newStats });
                    }}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const newStats = [...(block.data.stats || []), { value: "", label: "" }];
                  onUpdate({ stats: newStats });
                }}
              >
                Add Statistic
              </Button>
            </div>
          </div>
        );

      case "gallery":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Images</Label>
              <div className="space-y-2">
                {(block.data.images || []).map((img: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30">
                    <div className="h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => openMediaLibrary(`gallery-${index}`)}
                    >
                      <ImageIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-destructive"
                      onClick={() => {
                        const newImages = (block.data.images || []).filter((_: any, i: number) => i !== index);
                        onUpdate({ images: newImages });
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => openMediaLibrary("gallery-add")}
              >
                <Plus className="h-4 w-4" />
                Add Image
              </Button>
            </div>
          </div>
        );

      case "video":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL (YouTube or Vimeo)</Label>
              <Input
                id="videoUrl"
                value={block.data.videoUrl || ""}
                onChange={(e) => onUpdate({ videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <div className="flex gap-2">
                <Input
                  id="thumbnail"
                  value={block.data.thumbnail || ""}
                  onChange={(e) => onUpdate({ thumbnail: e.target.value })}
                  placeholder="Thumbnail URL"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => openMediaLibrary("thumbnail")}
                  title="Select from Media Library"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={block.data.description || ""}
                onChange={(e) => onUpdate({ description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        );

      case "social-video":
        const socialVideos = block.data.videos || [];
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={block.data.subtitle || ""}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Grid Columns</Label>
              <div className="flex gap-2">
                {([2, 3, 4] as const).map((col) => (
                  <Button
                    key={col}
                    variant={block.data.columns === col ? "default" : "outline"}
                    size="sm"
                    onClick={() => onUpdate({ columns: col })}
                    className="flex-1"
                  >
                    {col} Cols
                  </Button>
                ))}
              </div>
            </div>

            {/* Videos List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Videos ({socialVideos.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newVideo = {
                      id: `video-${Date.now()}`,
                      platform: "youtube" as const,
                      videoUrl: "",
                      thumbnail: "",
                      title: `Video ${socialVideos.length + 1}`,
                    };
                    onUpdate({ videos: [...socialVideos, newVideo] });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Video
                </Button>
              </div>

              {socialVideos.map((video: any, index: number) => (
                <div
                  key={video.id}
                  className="p-4 border border-border rounded-lg space-y-3 bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="text-sm font-medium">Video {index + 1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        video.platform === "instagram" 
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                          : "bg-red-600 text-white"
                      }`}>
                        {video.platform === "instagram" ? "Instagram" : "YouTube"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        const updated = socialVideos.filter((_: any, i: number) => i !== index);
                        onUpdate({ videos: updated });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <div className="flex gap-2">
                      {(["youtube", "instagram"] as const).map((p) => (
                        <Button
                          key={p}
                          variant={video.platform === p ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const updated = [...socialVideos];
                            updated[index] = { ...updated[index], platform: p };
                            onUpdate({ videos: updated });
                          }}
                          className="flex-1 capitalize text-xs"
                        >
                          {p === "youtube" ? "YouTube" : "Instagram"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={video.title || ""}
                      onChange={(e) => {
                        const updated = [...socialVideos];
                        updated[index] = { ...updated[index], title: e.target.value };
                        onUpdate({ videos: updated });
                      }}
                      placeholder="Video title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Video URL</Label>
                    <Input
                      value={video.videoUrl || ""}
                      onChange={(e) => {
                        const updated = [...socialVideos];
                        updated[index] = { ...updated[index], videoUrl: e.target.value };
                        onUpdate({ videos: updated });
                      }}
                      placeholder={
                        video.platform === "instagram"
                          ? "https://instagram.com/reel/..."
                          : "https://youtube.com/watch?v=..."
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Custom Thumbnail (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={video.thumbnail || ""}
                        onChange={(e) => {
                          const updated = [...socialVideos];
                          updated[index] = { ...updated[index], thumbnail: e.target.value };
                          onUpdate({ videos: updated });
                        }}
                        placeholder="Thumbnail URL"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openMediaLibrary(`social-video-thumb-${index}`)}
                        title="Select from Media Library"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      YouTube videos auto-generate thumbnails if left empty
                    </p>
                  </div>
                </div>
              ))}

              {socialVideos.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground text-sm">
                    No videos added yet. Click "Add Video" to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case "form":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={block.data.subtitle || ""}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="submitText">Submit Button Text</Label>
              <Input
                id="submitText"
                value={block.data.submitText || ""}
                onChange={(e) => onUpdate({ submitText: e.target.value })}
              />
            </div>
          </div>
        );

      case "pricing":
        return (
          <PricingBlockEditor
            value={block.data}
            onChange={onUpdate}
          />
        );

      case "reviews":
        const reviews = block.data.reviews || [];
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label>Reviews</Label>
              {reviews.map((review: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border border-border space-y-2">
                  <Input
                    placeholder="Author name"
                    value={review.author || ""}
                    onChange={(e) => {
                      const newReviews = [...reviews];
                      newReviews[index] = { ...newReviews[index], author: e.target.value };
                      onUpdate({ reviews: newReviews });
                    }}
                  />
                  <Input
                    placeholder="Role"
                    value={review.role || ""}
                    onChange={(e) => {
                      const newReviews = [...reviews];
                      newReviews[index] = { ...newReviews[index], role: e.target.value };
                      onUpdate({ reviews: newReviews });
                    }}
                  />
                  <Textarea
                    placeholder="Review comment"
                    value={review.comment || ""}
                    onChange={(e) => {
                      const newReviews = [...reviews];
                      newReviews[index] = { ...newReviews[index], comment: e.target.value };
                      onUpdate({ reviews: newReviews });
                    }}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Avatar URL"
                      value={review.avatar || ""}
                      onChange={(e) => {
                        const newReviews = [...reviews];
                        newReviews[index] = { ...newReviews[index], avatar: e.target.value };
                        onUpdate({ reviews: newReviews });
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openMediaLibrary(`review-avatar-${index}`)}
                      title="Select from Media Library"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const newReviews = [...reviews, { rating: 5, comment: "", author: "", role: "" }];
                  onUpdate({ reviews: newReviews });
                }}
              >
                Add Review
              </Button>
            </div>
          </div>
        );

      case "logos":
        const logos = block.data.logos || [];
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Logos</Label>
              <div className="space-y-2">
                {logos.map((logo: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30">
                    <div className="h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
                      {logo.logo && <img src={logo.logo} alt={logo.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Input
                        placeholder="Logo name"
                        value={logo.name || ""}
                        onChange={(e) => {
                          const newLogos = [...logos];
                          newLogos[index] = { ...newLogos[index], name: e.target.value };
                          onUpdate({ logos: newLogos });
                        }}
                        className="mb-1"
                      />
                      <Input
                        placeholder="Logo URL"
                        value={logo.logo || ""}
                        onChange={(e) => {
                          const newLogos = [...logos];
                          newLogos[index] = { ...newLogos[index], logo: e.target.value };
                          onUpdate({ logos: newLogos });
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => openMediaLibrary(`logo-item-${index}`)}
                    >
                      <ImageIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-destructive"
                      onClick={() => {
                        const newLogos = logos.filter((_: any, i: number) => i !== index);
                        onUpdate({ logos: newLogos });
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => openMediaLibrary("logo-add")}
              >
                <Plus className="h-4 w-4" />
                Add Logo
              </Button>
            </div>
          </div>
        );

      case "faq":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label>FAQs</Label>
              {(block.data.faqs || []).map((faq: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border border-border space-y-2">
                  <Input
                    placeholder="Question"
                    value={faq.question || ""}
                    onChange={(e) => {
                      const newFaqs = [...(block.data.faqs || [])];
                      newFaqs[index] = { ...newFaqs[index], question: e.target.value };
                      onUpdate({ faqs: newFaqs });
                    }}
                  />
                  <Textarea
                    placeholder="Answer"
                    value={faq.answer || ""}
                    onChange={(e) => {
                      const newFaqs = [...(block.data.faqs || [])];
                      newFaqs[index] = { ...newFaqs[index], answer: e.target.value };
                      onUpdate({ faqs: newFaqs });
                    }}
                    rows={3}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const newFaqs = [...(block.data.faqs || []), { question: "", answer: "" }];
                  onUpdate({ faqs: newFaqs });
                }}
              >
                Add FAQ
              </Button>
            </div>
          </div>
        );

      case "steps":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={block.data.subtitle || ""}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-3">
              <Label>Steps</Label>
              {(block.data.steps || []).map((step: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border border-border space-y-2">
                  <Input
                    placeholder="Step title"
                    value={step.title || ""}
                    onChange={(e) => {
                      const newSteps = [...(block.data.steps || [])];
                      newSteps[index] = { ...newSteps[index], title: e.target.value };
                      onUpdate({ steps: newSteps });
                    }}
                  />
                  <Textarea
                    placeholder="Step description"
                    value={step.description || ""}
                    onChange={(e) => {
                      const newSteps = [...(block.data.steps || [])];
                      newSteps[index] = { ...newSteps[index], description: e.target.value };
                      onUpdate({ steps: newSteps });
                    }}
                    rows={2}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const newSteps = [...(block.data.steps || []), { title: "", description: "" }];
                  onUpdate({ steps: newSteps });
                }}
              >
                Add Step
              </Button>
            </div>
          </div>
        );

      case "team":
        const members = block.data.members || [];
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={block.data.subtitle || ""}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-3">
              <Label>Team Members</Label>
              {members.map((member: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border border-border space-y-2">
                  <Input
                    placeholder="Name"
                    value={member.name || ""}
                    onChange={(e) => {
                      const newMembers = [...members];
                      newMembers[index] = { ...newMembers[index], name: e.target.value };
                      onUpdate({ members: newMembers });
                    }}
                  />
                  <Input
                    placeholder="Role"
                    value={member.role || ""}
                    onChange={(e) => {
                      const newMembers = [...members];
                      newMembers[index] = { ...newMembers[index], role: e.target.value };
                      onUpdate({ members: newMembers });
                    }}
                  />
                  <Textarea
                    placeholder="Bio"
                    value={member.bio || ""}
                    onChange={(e) => {
                      const newMembers = [...members];
                      newMembers[index] = { ...newMembers[index], bio: e.target.value };
                      onUpdate({ members: newMembers });
                    }}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Avatar URL"
                      value={member.avatar || ""}
                      onChange={(e) => {
                        const newMembers = [...members];
                        newMembers[index] = { ...newMembers[index], avatar: e.target.value };
                        onUpdate({ members: newMembers });
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openMediaLibrary(`team-avatar-${index}`)}
                      title="Select from Media Library"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive"
                    onClick={() => {
                      const newMembers = members.filter((_: any, i: number) => i !== index);
                      onUpdate({ members: newMembers });
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Member
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const newMembers = [...members, { name: "", role: "", bio: "", avatar: "" }];
                  onUpdate({ members: newMembers });
                }}
              >
                Add Member
              </Button>
            </div>
          </div>
        );

      case "appointza-organization":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                value={block.data.organizationName || ""}
                onChange={(e) => onUpdate({ organizationName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationTagline">Tagline</Label>
              <Input
                id="organizationTagline"
                value={block.data.organizationTagline || ""}
                onChange={(e) => onUpdate({ organizationTagline: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationLogo">Logo URL</Label>
              <div className="flex gap-2">
                <Input
                  id="organizationLogo"
                  value={block.data.organizationLogo || ""}
                  onChange={(e) => onUpdate({ organizationLogo: e.target.value })}
                  placeholder="Logo URL"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => openMediaLibrary("logo")}
                  title="Select from Media Library"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationNotes">Notes/Description</Label>
              <Textarea
                id="organizationNotes"
                value={block.data.organizationNotes || ""}
                onChange={(e) => onUpdate({ organizationNotes: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationEmail">Email</Label>
              <Input
                id="organizationEmail"
                value={block.data.organizationEmail || ""}
                onChange={(e) => onUpdate({ organizationEmail: e.target.value })}
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationGstNumber">GST Number</Label>
              <Input
                id="organizationGstNumber"
                value={block.data.organizationGstNumber || ""}
                onChange={(e) => onUpdate({ organizationGstNumber: e.target.value })}
              />
            </div>
          </div>
        );

      case "appointza-location":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name</Label>
              <Input
                id="locationName"
                value={block.data.locationName || ""}
                onChange={(e) => onUpdate({ locationName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                value={block.data.addressLine1 || ""}
                onChange={(e) => onUpdate({ addressLine1: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={block.data.addressLine2 || ""}
                onChange={(e) => onUpdate({ addressLine2: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={block.data.city || ""}
                  onChange={(e) => onUpdate({ city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={block.data.state || ""}
                  onChange={(e) => onUpdate({ state: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={block.data.pincode || ""}
                  onChange={(e) => onUpdate({ pincode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={block.data.country || ""}
                  onChange={(e) => onUpdate({ country: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile/Phone</Label>
              <Input
                id="mobile"
                value={block.data.mobile || ""}
                onChange={(e) => onUpdate({ mobile: e.target.value })}
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="googleLocation">Google Maps URL</Label>
              <Input
                id="googleLocation"
                value={block.data.googleLocation || ""}
                onChange={(e) => onUpdate({ googleLocation: e.target.value })}
                placeholder="https://maps.google.com/..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={block.data.latitude || ""}
                  onChange={(e) => onUpdate({ latitude: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={block.data.longitude || ""}
                  onChange={(e) => onUpdate({ longitude: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        );

      case "appointza-services":
        const services = block.data.services || [];
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label>Services</Label>
              {services.map((service: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border border-border space-y-2">
                  <Input
                    placeholder="Service Name"
                    value={service.serviceName || ""}
                    onChange={(e) => {
                      const newServices = [...services];
                      newServices[index] = { ...newServices[index], serviceName: e.target.value };
                      onUpdate({ services: newServices });
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Price (₹)"
                      type="number"
                      value={service.prize || ""}
                      onChange={(e) => {
                        const newServices = [...services];
                        newServices[index] = { ...newServices[index], prize: parseFloat(e.target.value) || 0 };
                        onUpdate({ services: newServices });
                      }}
                    />
                    <Input
                      placeholder="Time (minutes)"
                      type="number"
                      value={service.timeTaken || ""}
                      onChange={(e) => {
                        const newServices = [...services];
                        newServices[index] = { ...newServices[index], timeTaken: parseInt(e.target.value) || 0 };
                        onUpdate({ services: newServices });
                      }}
                    />
                  </div>
                  <Textarea
                    placeholder="Notes"
                    value={service.notes || ""}
                    onChange={(e) => {
                      const newServices = [...services];
                      newServices[index] = { ...newServices[index], notes: e.target.value };
                      onUpdate({ services: newServices });
                    }}
                    rows={2}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive"
                    onClick={() => {
                      const newServices = services.filter((_: any, i: number) => i !== index);
                      onUpdate({ services: newServices });
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Service
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const newServices = [...services, { serviceName: "", prize: 0, timeTaken: 0, notes: "" }];
                  onUpdate({ services: newServices });
                }}
              >
                Add Service
              </Button>
            </div>
          </div>
        );

      case "appointza-timings":
        const timings = block.data.timings || [];
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label>Service Timings</Label>
              {timings.map((timing: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border border-border space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={timing.dayOfWeek || 1}
                      onChange={(e) => {
                        const newTimings = [...timings];
                        newTimings[index] = { ...newTimings[index], dayOfWeek: parseInt(e.target.value) };
                        onUpdate({ timings: newTimings });
                      }}
                      className="px-3 py-2 rounded-md border border-border"
                    >
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                      <option value={7}>Sunday</option>
                    </select>
                    <Input
                      placeholder="Start (HH:mm)"
                      value={timing.startTime || ""}
                      onChange={(e) => {
                        const newTimings = [...timings];
                        newTimings[index] = { ...newTimings[index], startTime: e.target.value };
                        onUpdate({ timings: newTimings });
                      }}
                    />
                    <Input
                      placeholder="End (HH:mm)"
                      value={timing.endTime || ""}
                      onChange={(e) => {
                        const newTimings = [...timings];
                        newTimings[index] = { ...newTimings[index], endTime: e.target.value };
                        onUpdate({ timings: newTimings });
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive"
                    onClick={() => {
                      const newTimings = timings.filter((_: any, i: number) => i !== index);
                      onUpdate({ timings: newTimings });
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Timing
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const newTimings = [...timings, { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" }];
                  onUpdate({ timings: newTimings });
                }}
              >
                Add Timing
              </Button>
            </div>
          </div>
        );

      case "appointza-events":
        const events = block.data.events || [];
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label>Events</Label>
              {events.map((event: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border border-border space-y-2">
                  <Input
                    placeholder="Event Name"
                    value={event.eventName || ""}
                    onChange={(e) => {
                      const newEvents = [...events];
                      newEvents[index] = { ...newEvents[index], eventName: e.target.value };
                      onUpdate({ events: newEvents });
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Event Date"
                      type="datetime-local"
                      value={event.eventDate || ""}
                      onChange={(e) => {
                        const newEvents = [...events];
                        newEvents[index] = { ...newEvents[index], eventDate: e.target.value };
                        onUpdate({ events: newEvents });
                      }}
                    />
                    <Input
                      placeholder="Entry Amount (₹)"
                      type="number"
                      value={event.entryAmount || ""}
                      onChange={(e) => {
                        const newEvents = [...events];
                        newEvents[index] = { ...newEvents[index], entryAmount: parseFloat(e.target.value) || 0 };
                        onUpdate({ events: newEvents });
                      }}
                    />
                  </div>
                  <Textarea
                    placeholder="Description"
                    value={event.description || ""}
                    onChange={(e) => {
                      const newEvents = [...events];
                      newEvents[index] = { ...newEvents[index], description: e.target.value };
                      onUpdate({ events: newEvents });
                    }}
                    rows={3}
                  />
                  <Input
                    placeholder="Remaining Slots"
                    type="number"
                    value={event.remainingSlot || ""}
                    onChange={(e) => {
                      const newEvents = [...events];
                      newEvents[index] = { ...newEvents[index], remainingSlot: parseInt(e.target.value) || 0 };
                      onUpdate({ events: newEvents });
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive"
                    onClick={() => {
                      const newEvents = events.filter((_: any, i: number) => i !== index);
                      onUpdate({ events: newEvents });
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Event
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const newEvents = [...events, { eventName: "", eventDate: "", description: "", entryAmount: 0, remainingSlot: 0 }];
                  onUpdate({ events: newEvents });
                }}
              >
                Add Event
              </Button>
            </div>
          </div>
        );

      case "appointza-reviews":
        const appointzaReviews = block.data.reviews || [];
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label>Reviews</Label>
              {appointzaReviews.map((review: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border border-border space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Rating:</Label>
                    <select
                      value={review.rating || 5}
                      onChange={(e) => {
                        const newReviews = [...appointzaReviews];
                        newReviews[index] = { ...newReviews[index], rating: parseInt(e.target.value) };
                        onUpdate({ reviews: newReviews });
                      }}
                      className="px-2 py-1 rounded-md border border-border text-sm"
                    >
                      <option value={1}>1 Star</option>
                      <option value={2}>2 Stars</option>
                      <option value={3}>3 Stars</option>
                      <option value={4}>4 Stars</option>
                      <option value={5}>5 Stars</option>
                    </select>
                  </div>
                  <Textarea
                    placeholder="Review Comment"
                    value={review.comment || ""}
                    onChange={(e) => {
                      const newReviews = [...appointzaReviews];
                      newReviews[index] = { ...newReviews[index], comment: e.target.value };
                      onUpdate({ reviews: newReviews });
                    }}
                    rows={3}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive"
                    onClick={() => {
                      const newReviews = appointzaReviews.filter((_: any, i: number) => i !== index);
                      onUpdate({ reviews: newReviews });
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Review
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const newReviews = [...appointzaReviews, { rating: 5, comment: "" }];
                  onUpdate({ reviews: newReviews });
                }}
              >
                Add Review
              </Button>
            </div>
          </div>
        );

      case "appointza-facilities":
        const facilities = block.data.facilities || [];
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label>Facilities</Label>
              {facilities.map((facility: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={facility}
                    onChange={(e) => {
                      const newFacilities = [...facilities];
                      newFacilities[index] = e.target.value;
                      onUpdate({ facilities: newFacilities });
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newFacilities = facilities.filter((_: any, i: number) => i !== index);
                      onUpdate({ facilities: newFacilities });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const newFacilities = [...facilities, ""];
                  onUpdate({ facilities: newFacilities });
                }}
              >
                Add Facility
              </Button>
            </div>
          </div>
        );

      case "appointza-location-images":
        const imageIds = block.data.imageIds || [];
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Location Images</Label>
              <div className="space-y-2">
                {imageIds.map((imageId: number, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30">
                    <div className="h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
                      <img src={`/api/images/${imageId}`} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <Input
                      type="number"
                      value={imageId}
                      onChange={(e) => {
                        const newImageIds = [...imageIds];
                        newImageIds[index] = parseInt(e.target.value) || 0;
                        onUpdate({ imageIds: newImageIds });
                      }}
                      className="flex-1"
                      placeholder="Image ID"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-destructive"
                      onClick={() => {
                        const newImageIds = imageIds.filter((_: any, i: number) => i !== index);
                        onUpdate({ imageIds: newImageIds });
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => {
                  const newImageIds = [...imageIds, 0];
                  onUpdate({ imageIds: newImageIds });
                }}
              >
                <Plus className="h-4 w-4" />
                Add Image ID
              </Button>
            </div>
          </div>
        );

      case "resume-profile":
        return (
          <div className="space-y-4">
            {/* Template Selector */}
            <div className="space-y-2">
              <Label>Style Template</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "classic", name: "Classic", desc: "Traditional" },
                  { id: "modern", name: "Modern", desc: "Vibrant" },
                  { id: "minimal", name: "Minimal", desc: "Clean" },
                  { id: "bold", name: "Bold", desc: "Eye-catching" },
                ].map((template) => (
                  <button
                    key={template.id}
                    onClick={() => onUpdate({ template: template.id })}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      block.data.template === template.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-medium text-xs">{template.name}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={block.data.fullName || ""}
                  onChange={(e) => onUpdate({ fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Title / Role</Label>
                <Input
                  value={block.data.title || ""}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  placeholder="Senior Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label>Photo URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={block.data.photo || ""}
                    onChange={(e) => onUpdate({ photo: e.target.value })}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setMediaSelectionTarget("resume-photo");
                      setIsMediaLibraryOpen(true);
                    }}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={block.data.email || ""}
                  onChange={(e) => onUpdate({ email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={block.data.phone || ""}
                  onChange={(e) => onUpdate({ phone: e.target.value })}
                  placeholder="+1 234 567 890"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={block.data.location || ""}
                  onChange={(e) => onUpdate({ location: e.target.value })}
                  placeholder="San Francisco, CA"
                />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input
                  value={block.data.linkedin || ""}
                  onChange={(e) => onUpdate({ linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="space-y-2">
                <Label>GitHub URL</Label>
                <Input
                  value={block.data.github || ""}
                  onChange={(e) => onUpdate({ github: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={block.data.website || ""}
                  onChange={(e) => onUpdate({ website: e.target.value })}
                  placeholder="https://yoursite.com"
                />
              </div>
            </div>
          </div>
        );

      case "resume-summary":
        return (
          <div className="space-y-4">
            {/* Template Selector */}
            <div className="space-y-2">
              <Label>Style Template</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "classic", name: "Classic" },
                  { id: "modern", name: "Modern" },
                  { id: "minimal", name: "Minimal" },
                  { id: "bold", name: "Bold" },
                ].map((template) => (
                  <button
                    key={template.id}
                    onClick={() => onUpdate({ template: template.id })}
                    className={`p-2 rounded-lg border text-left transition-all text-xs font-medium ${
                      block.data.template === template.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={block.data.title || ""}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  placeholder="Professional Summary"
                />
              </div>
              <div className="space-y-2">
                <Label>Summary</Label>
                <Textarea
                  value={block.data.summary || ""}
                  onChange={(e) => onUpdate({ summary: e.target.value })}
                  placeholder="Write a compelling summary of your professional background..."
                  rows={6}
                />
              </div>
            </div>
          </div>
        );

      case "resume-experience":
        return (
          <div className="space-y-4">
            {/* Template Selector */}
            <div className="space-y-2">
              <Label>Style Template</Label>
              <div className="grid grid-cols-4 gap-1">
                {["classic", "modern", "minimal", "bold"].map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdate({ template: t })}
                    className={`p-1.5 rounded border text-xs capitalize ${
                      block.data.template === t
                        ? "border-primary bg-primary/10"
                        : "border-border"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={block.data.title || ""}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  placeholder="Work Experience"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Experiences</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const experiences = [...(block.data.experiences || [])];
                      experiences.push({
                        id: Date.now(),
                        company: "Company Name",
                        position: "Position Title",
                        location: "Location",
                        startDate: "2023",
                        endDate: "",
                        current: true,
                        description: "Description of your role...",
                        achievements: ["Key achievement 1"],
                      });
                      onUpdate({ experiences });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                {(block.data.experiences || []).map((exp: any, index: number) => (
                  <div key={exp.id || index} className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Experience {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const experiences = [...block.data.experiences];
                          experiences.splice(index, 1);
                          onUpdate({ experiences });
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <Input
                      value={exp.company || ""}
                      onChange={(e) => {
                        const experiences = [...block.data.experiences];
                        experiences[index] = { ...exp, company: e.target.value };
                        onUpdate({ experiences });
                      }}
                      placeholder="Company"
                      className="text-sm"
                    />
                    <Input
                      value={exp.position || ""}
                      onChange={(e) => {
                        const experiences = [...block.data.experiences];
                        experiences[index] = { ...exp, position: e.target.value };
                        onUpdate({ experiences });
                      }}
                      placeholder="Position"
                      className="text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={exp.startDate || ""}
                        onChange={(e) => {
                          const experiences = [...block.data.experiences];
                          experiences[index] = { ...exp, startDate: e.target.value };
                          onUpdate({ experiences });
                        }}
                        placeholder="Start Date"
                        className="text-sm"
                      />
                      <Input
                        value={exp.endDate || ""}
                        onChange={(e) => {
                          const experiences = [...block.data.experiences];
                          experiences[index] = { ...exp, endDate: e.target.value };
                          onUpdate({ experiences });
                        }}
                        placeholder="End Date"
                        disabled={exp.current}
                        className="text-sm"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={exp.current || false}
                        onChange={(e) => {
                          const experiences = [...block.data.experiences];
                          experiences[index] = { ...exp, current: e.target.checked };
                          onUpdate({ experiences });
                        }}
                      />
                      Currently working here
                    </label>
                    <Textarea
                      value={exp.description || ""}
                      onChange={(e) => {
                        const experiences = [...block.data.experiences];
                        experiences[index] = { ...exp, description: e.target.value };
                        onUpdate({ experiences });
                      }}
                      placeholder="Description"
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "resume-education":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Style Template</Label>
              <div className="grid grid-cols-4 gap-1">
                {["classic", "modern", "minimal", "bold"].map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdate({ template: t })}
                    className={`p-1.5 rounded border text-xs capitalize ${
                      block.data.template === t ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <Input
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Education"
              />
              <div className="flex items-center justify-between">
                <Label>Education</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const education = [...(block.data.education || [])];
                    education.push({
                      id: Date.now(),
                      institution: "University Name",
                      degree: "Degree",
                      field: "Field of Study",
                      startDate: "2020",
                      endDate: "2024",
                      gpa: "",
                    });
                    onUpdate({ education });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {(block.data.education || []).map((edu: any, index: number) => (
                <div key={edu.id || index} className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Education {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const education = [...block.data.education];
                        education.splice(index, 1);
                        onUpdate({ education });
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    value={edu.institution || ""}
                    onChange={(e) => {
                      const education = [...block.data.education];
                      education[index] = { ...edu, institution: e.target.value };
                      onUpdate({ education });
                    }}
                    placeholder="Institution"
                    className="text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={edu.degree || ""}
                      onChange={(e) => {
                        const education = [...block.data.education];
                        education[index] = { ...edu, degree: e.target.value };
                        onUpdate({ education });
                      }}
                      placeholder="Degree"
                      className="text-sm"
                    />
                    <Input
                      value={edu.field || ""}
                      onChange={(e) => {
                        const education = [...block.data.education];
                        education[index] = { ...edu, field: e.target.value };
                        onUpdate({ education });
                      }}
                      placeholder="Field"
                      className="text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={edu.startDate || ""}
                      onChange={(e) => {
                        const education = [...block.data.education];
                        education[index] = { ...edu, startDate: e.target.value };
                        onUpdate({ education });
                      }}
                      placeholder="Start"
                      className="text-sm"
                    />
                    <Input
                      value={edu.endDate || ""}
                      onChange={(e) => {
                        const education = [...block.data.education];
                        education[index] = { ...edu, endDate: e.target.value };
                        onUpdate({ education });
                      }}
                      placeholder="End"
                      className="text-sm"
                    />
                    <Input
                      value={edu.gpa || ""}
                      onChange={(e) => {
                        const education = [...block.data.education];
                        education[index] = { ...edu, gpa: e.target.value };
                        onUpdate({ education });
                      }}
                      placeholder="GPA"
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "resume-skills":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Style Template</Label>
              <div className="grid grid-cols-4 gap-1">
                {["classic", "modern", "minimal", "bold"].map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdate({ template: t })}
                    className={`p-1.5 rounded border text-xs capitalize ${
                      block.data.template === t ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <Input
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Skills"
              />
              <div className="space-y-2">
                <Label>Display Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["bars", "tags", "grid"].map((type) => (
                    <button
                      key={type}
                      onClick={() => onUpdate({ displayType: type })}
                      className={`p-2 rounded border text-xs capitalize ${
                        block.data.displayType === type ? "border-primary bg-primary/10" : "border-border"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Skills</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const skills = [...(block.data.skills || [])];
                    skills.push({ name: "New Skill", level: 4, category: "General" });
                    onUpdate({ skills });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {(block.data.skills || []).map((skill: any, index: number) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={skill.name || ""}
                    onChange={(e) => {
                      const skills = [...block.data.skills];
                      skills[index] = { ...skill, name: e.target.value };
                      onUpdate({ skills });
                    }}
                    placeholder="Skill name"
                    className="flex-1 text-sm"
                  />
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={skill.level || 3}
                    onChange={(e) => {
                      const skills = [...block.data.skills];
                      skills[index] = { ...skill, level: parseInt(e.target.value) };
                      onUpdate({ skills });
                    }}
                    className="w-16 text-sm"
                  />
                  <Input
                    value={skill.category || ""}
                    onChange={(e) => {
                      const skills = [...block.data.skills];
                      skills[index] = { ...skill, category: e.target.value };
                      onUpdate({ skills });
                    }}
                    placeholder="Category"
                    className="w-24 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const skills = [...block.data.skills];
                      skills.splice(index, 1);
                      onUpdate({ skills });
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case "resume-projects":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Style Template</Label>
              <div className="grid grid-cols-4 gap-1">
                {["classic", "modern", "minimal", "bold"].map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdate({ template: t })}
                    className={`p-1.5 rounded border text-xs capitalize ${
                      block.data.template === t ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <Input
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Projects"
              />
              <div className="flex items-center justify-between">
                <Label>Projects</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const projects = [...(block.data.projects || [])];
                    projects.push({
                      id: Date.now(),
                      name: "Project Name",
                      description: "Project description...",
                      technologies: ["Tech 1"],
                      liveUrl: "",
                      githubUrl: "",
                    });
                    onUpdate({ projects });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {(block.data.projects || []).map((proj: any, index: number) => (
                <div key={proj.id || index} className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Project {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const projects = [...block.data.projects];
                        projects.splice(index, 1);
                        onUpdate({ projects });
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    value={proj.name || ""}
                    onChange={(e) => {
                      const projects = [...block.data.projects];
                      projects[index] = { ...proj, name: e.target.value };
                      onUpdate({ projects });
                    }}
                    placeholder="Project Name"
                    className="text-sm"
                  />
                  <Textarea
                    value={proj.description || ""}
                    onChange={(e) => {
                      const projects = [...block.data.projects];
                      projects[index] = { ...proj, description: e.target.value };
                      onUpdate({ projects });
                    }}
                    placeholder="Description"
                    rows={2}
                    className="text-sm"
                  />
                  <Input
                    value={(proj.technologies || []).join(", ")}
                    onChange={(e) => {
                      const projects = [...block.data.projects];
                      projects[index] = { ...proj, technologies: e.target.value.split(", ").filter(Boolean) };
                      onUpdate({ projects });
                    }}
                    placeholder="Technologies (comma-separated)"
                    className="text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={proj.liveUrl || ""}
                      onChange={(e) => {
                        const projects = [...block.data.projects];
                        projects[index] = { ...proj, liveUrl: e.target.value };
                        onUpdate({ projects });
                      }}
                      placeholder="Live URL"
                      className="text-sm"
                    />
                    <Input
                      value={proj.githubUrl || ""}
                      onChange={(e) => {
                        const projects = [...block.data.projects];
                        projects[index] = { ...proj, githubUrl: e.target.value };
                        onUpdate({ projects });
                      }}
                      placeholder="GitHub URL"
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "resume-certifications":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Style Template</Label>
              <div className="grid grid-cols-4 gap-1">
                {["classic", "modern", "minimal", "bold"].map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdate({ template: t })}
                    className={`p-1.5 rounded border text-xs capitalize ${
                      block.data.template === t ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <Input
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Certifications"
              />
              <div className="flex items-center justify-between">
                <Label>Certifications</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const certifications = [...(block.data.certifications || [])];
                    certifications.push({
                      id: Date.now(),
                      name: "Certification Name",
                      issuer: "Issuing Organization",
                      date: "2024",
                      credentialUrl: "",
                    });
                    onUpdate({ certifications });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {(block.data.certifications || []).map((cert: any, index: number) => (
                <div key={cert.id || index} className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Certification {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const certifications = [...block.data.certifications];
                        certifications.splice(index, 1);
                        onUpdate({ certifications });
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    value={cert.name || ""}
                    onChange={(e) => {
                      const certifications = [...block.data.certifications];
                      certifications[index] = { ...cert, name: e.target.value };
                      onUpdate({ certifications });
                    }}
                    placeholder="Certification Name"
                    className="text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={cert.issuer || ""}
                      onChange={(e) => {
                        const certifications = [...block.data.certifications];
                        certifications[index] = { ...cert, issuer: e.target.value };
                        onUpdate({ certifications });
                      }}
                      placeholder="Issuer"
                      className="text-sm"
                    />
                    <Input
                      value={cert.date || ""}
                      onChange={(e) => {
                        const certifications = [...block.data.certifications];
                        certifications[index] = { ...cert, date: e.target.value };
                        onUpdate({ certifications });
                      }}
                      placeholder="Date"
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "resume-languages":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Style Template</Label>
              <div className="grid grid-cols-4 gap-1">
                {["classic", "modern", "minimal", "bold"].map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdate({ template: t })}
                    className={`p-1.5 rounded border text-xs capitalize ${
                      block.data.template === t ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <Input
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Languages"
              />
              <div className="flex items-center justify-between">
                <Label>Languages</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const languages = [...(block.data.languages || [])];
                    languages.push({ name: "Language", proficiency: "Intermediate" });
                    onUpdate({ languages });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {(block.data.languages || []).map((lang: any, index: number) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={lang.name || ""}
                    onChange={(e) => {
                      const languages = [...block.data.languages];
                      languages[index] = { ...lang, name: e.target.value };
                      onUpdate({ languages });
                    }}
                    placeholder="Language"
                    className="flex-1 text-sm"
                  />
                  <select
                    value={lang.proficiency || "Intermediate"}
                    onChange={(e) => {
                      const languages = [...block.data.languages];
                      languages[index] = { ...lang, proficiency: e.target.value };
                      onUpdate({ languages });
                    }}
                    className="flex-1 p-2 border rounded text-sm bg-background"
                  >
                    <option value="Native">Native</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Basic">Basic</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const languages = [...block.data.languages];
                      languages.splice(index, 1);
                      onUpdate({ languages });
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case "resume-contact":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Style Template</Label>
              <div className="grid grid-cols-4 gap-1">
                {["classic", "modern", "minimal", "bold"].map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdate({ template: t })}
                    className={`p-1.5 rounded border text-xs capitalize ${
                      block.data.template === t ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <Input
                value={block.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Contact"
              />
              <Input
                value={block.data.email || ""}
                onChange={(e) => onUpdate({ email: e.target.value })}
                placeholder="Email"
              />
              <Input
                value={block.data.phone || ""}
                onChange={(e) => onUpdate({ phone: e.target.value })}
                placeholder="Phone"
              />
              <Input
                value={block.data.location || ""}
                onChange={(e) => onUpdate({ location: e.target.value })}
                placeholder="Location"
              />
              <Input
                value={block.data.linkedin || ""}
                onChange={(e) => onUpdate({ linkedin: e.target.value })}
                placeholder="LinkedIn URL"
              />
              <Input
                value={block.data.github || ""}
                onChange={(e) => onUpdate({ github: e.target.value })}
                placeholder="GitHub URL"
              />
              <Input
                value={block.data.website || ""}
                onChange={(e) => onUpdate({ website: e.target.value })}
                placeholder="Website"
              />
              <Textarea
                value={block.data.message || ""}
                onChange={(e) => onUpdate({ message: e.target.value })}
                placeholder="Personal message or call-to-action..."
                rows={3}
              />
            </div>
          </div>
        );

      case "full-resume-template":
        const templateId = block.data.templateId || "template1";
        const resumeData = block.data.resumeData || {};
        
        const handleResumeDataUpdate = (path: string, value: any) => {
          // Deep update the resumeData object
          const keys = path.split(".");
          const newData = JSON.parse(JSON.stringify(resumeData));
          let current = newData;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = value;
          onUpdate({ ...block.data, resumeData: newData });
        };

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resume Template</Label>
              <div className="grid grid-cols-1 gap-2">
                {["template1", "template2", "template3"].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      // Change template and load its sample data
                      import("@/components/blocks/resume/FullResumePreview").then(({ getFullTemplateSampleData }) => {
                        onUpdate({ 
                          templateId: t, 
                          resumeData: getFullTemplateSampleData(t as any)
                        });
                      });
                    }}
                    className={`p-3 rounded border text-left ${
                      templateId === t ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="font-medium block">
                      {t === "template1" ? "Classic Professional" : 
                       t === "template2" ? "Creative Sidebar" : 
                       "Tech Minimal"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t === "template1" ? "Traditional single-column, ATS-friendly" : 
                       t === "template2" ? "Modern two-column with photo sidebar" : 
                       "Code-inspired layout for developers"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                💡 Click directly on the resume preview to edit content. All text fields are editable.
              </p>
              
              {/* Profile section - common across templates */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Profile Information</h4>
                <Input
                  value={resumeData.profile?.fullName || ""}
                  onChange={(e) => handleResumeDataUpdate("profile.fullName", e.target.value)}
                  placeholder="Full Name"
                />
                <Input
                  value={resumeData.profile?.title || ""}
                  onChange={(e) => handleResumeDataUpdate("profile.title", e.target.value)}
                  placeholder="Job Title"
                />
                <Input
                  value={resumeData.profile?.email || ""}
                  onChange={(e) => handleResumeDataUpdate("profile.email", e.target.value)}
                  placeholder="Email"
                />
                <Input
                  value={resumeData.profile?.phone || ""}
                  onChange={(e) => handleResumeDataUpdate("profile.phone", e.target.value)}
                  placeholder="Phone"
                />
                <Input
                  value={resumeData.profile?.location || ""}
                  onChange={(e) => handleResumeDataUpdate("profile.location", e.target.value)}
                  placeholder="Location"
                />
                <Input
                  value={resumeData.profile?.linkedin || ""}
                  onChange={(e) => handleResumeDataUpdate("profile.linkedin", e.target.value)}
                  placeholder="LinkedIn URL"
                />
                <Input
                  value={resumeData.profile?.github || ""}
                  onChange={(e) => handleResumeDataUpdate("profile.github", e.target.value)}
                  placeholder="GitHub URL"
                />
                <Input
                  value={resumeData.profile?.website || ""}
                  onChange={(e) => handleResumeDataUpdate("profile.website", e.target.value)}
                  placeholder="Website URL"
                />
              </div>
              
              {/* Summary */}
              <div className="space-y-2 mt-4">
                <h4 className="font-medium text-sm">Professional Summary</h4>
                <Textarea
                  value={resumeData.summary || ""}
                  onChange={(e) => handleResumeDataUpdate("summary", e.target.value)}
                  placeholder="Your professional summary..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        );

      case "custom-html":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="htmlCode">HTML Code</Label>
              <p className="text-xs text-muted-foreground">
                Paste your full HTML code below. It will be rendered in a sandboxed iframe.
              </p>
              <Textarea
                id="htmlCode"
                value={block.data.htmlCode || ""}
                onChange={(e) => onUpdate({ htmlCode: e.target.value })}
                rows={20}
                placeholder="<div>\n  <h1>Hello World</h1>\n  <p>Paste your HTML here...</p>\n</div>"
                className="font-mono text-xs"
              />
            </div>
            {block.data.htmlCode && (
              <div className="rounded-lg border border-border p-3 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-1">Preview is shown on the canvas →</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>Editor not available for this block type</p>
          </div>
        );
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground capitalize">{block.type.replace("-", " ")}</h3>
            <p className="text-xs text-muted-foreground">Edit block properties</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">{renderEditor()}</div>
      </div>

      <MediaLibrary
        open={isMediaLibraryOpen}
        onOpenChange={setIsMediaLibraryOpen}
        onSelect={handleSelectImage}
        selectionMode={mediaSelectionTarget !== null}
        images={images}
        setImages={setImages}
      />
    </>
  );
};

export default BlockEditor;