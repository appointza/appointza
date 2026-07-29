import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { BlockImageUploadField } from "@/components/templateBuilder/BlockImageUploadField";

export type TeamMemberData = {
  name: string;
  role: string;
  experience: string;
  description: string;
  imageId: number;
  image: string;
};

type BlockTeamMembersFieldProps = {
  members: TeamMemberData[];
  onChange: (members: TeamMemberData[]) => void;
};

const emptyMember = (): TeamMemberData => ({
  name: "",
  role: "",
  experience: "",
  description: "",
  imageId: 0,
  image: "",
});

export function BlockTeamMembersField({ members, onChange }: BlockTeamMembersFieldProps) {
  const updateMember = (index: number, patch: Partial<TeamMemberData>) => {
    onChange(members.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Team members</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => onChange([...members, emptyMember()])}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add member
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
          No team members yet. Add one to get started.
        </p>
      ) : (
        members.map((member, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Member {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-600"
                onClick={() => onChange(members.filter((_, i) => i !== index))}
                aria-label="Remove member"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <Label className="text-xs">Name</Label>
              <Input
                className="mt-1 rounded-xl"
                value={member.name}
                onChange={(e) => updateMember(index, { name: e.target.value })}
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <Label className="text-xs">Role / title</Label>
              <Input
                className="mt-1 rounded-xl"
                value={member.role}
                onChange={(e) => updateMember(index, { role: e.target.value })}
                placeholder="Senior stylist"
              />
            </div>

            <div>
              <Label className="text-xs">Experience</Label>
              <Input
                className="mt-1 rounded-xl"
                value={member.experience}
                onChange={(e) => updateMember(index, { experience: e.target.value })}
                placeholder="10+ years · Certified expert"
              />
            </div>

            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                className="mt-1 rounded-xl"
                rows={3}
                value={member.description}
                onChange={(e) => updateMember(index, { description: e.target.value })}
                placeholder="Short bio shown on the booking page."
              />
            </div>

            <BlockImageUploadField
              label="Photo"
              imageId={member.imageId}
              imageUrl={member.image}
              onChange={(next) => updateMember(index, next)}
            />
          </div>
        ))
      )}
    </div>
  );
}

export function normalizeTeamMembers(raw: unknown): TeamMemberData[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const m = item as Partial<TeamMemberData>;
    return {
      name: String(m.name ?? ""),
      role: String(m.role ?? ""),
      experience: String(m.experience ?? ""),
      description: String(m.description ?? ""),
      imageId: Number(m.imageId ?? 0),
      image: String(m.image ?? ""),
    };
  });
}
