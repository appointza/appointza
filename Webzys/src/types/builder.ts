export interface Block {
  id: string;
  type: string;
  data: Record<string, any>;
  visible: boolean;
}

export interface PageData {
  id: string;
  name: string;
  blocks: Block[];
}

export interface Website {
  id: string;
  name: string;
  type: "normal" | "appointza" | "resume";
  pages: PageData[];
  createdAt: string;
  updatedAt: string;
}

export interface BlockCategory {
  name: string;
  icon: string;
  blocks: BlockType[];
}

export interface BlockType {
  type: string;
  name: string;
  icon: string;
  description: string;
}

export interface MediaItem {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}
