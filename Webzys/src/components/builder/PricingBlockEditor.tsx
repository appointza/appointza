import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface Feature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: Feature[];
  ctaText?: string;
  popular?: boolean;
}

interface PricingBlockEditorProps {
  value: {
    title?: string;
    subtitle?: string;
    plans?: Plan[];
  };
  onChange: (data: any) => void;
}

const PricingBlockEditor: React.FC<PricingBlockEditorProps> = ({ value, onChange }) => {
  const plans = value.plans || [];

  const handlePlanChange = (idx: number, updated: Partial<Plan>) => {
    const newPlans = plans.map((plan, i) => (i === idx ? { ...plan, ...updated } : plan));
    onChange({ ...value, plans: newPlans });
  };

  const handleFeatureChange = (planIdx: number, featureIdx: number, updated: Partial<Feature>) => {
    const newPlans = plans.map((plan, i) => {
      if (i !== planIdx) return plan;
      const newFeatures = plan.features.map((f, j) => (j === featureIdx ? { ...f, ...updated } : f));
      return { ...plan, features: newFeatures };
    });
    onChange({ ...value, plans: newPlans });
  };

  const addPlan = () => {
    const newPlan: Plan = {
      name: "New Plan",
      price: "$0",
      period: "/month",
      description: "",
      features: [{ text: "New Feature", included: true }],
      ctaText: "Get Started",
      popular: false,
    };
    onChange({ ...value, plans: [...plans, newPlan] });
  };

  const removePlan = (idx: number) => {
    const newPlans = plans.filter((_, i) => i !== idx);
    onChange({ ...value, plans: newPlans });
  };

  const addFeature = (planIdx: number) => {
    const newPlans = plans.map((plan, i) => {
      if (i !== planIdx) return plan;
      return { ...plan, features: [...plan.features, { text: "New Feature", included: true }] };
    });
    onChange({ ...value, plans: newPlans });
  };

  const removeFeature = (planIdx: number, featureIdx: number) => {
    const newPlans = plans.map((plan, i) => {
      if (i !== planIdx) return plan;
      return { ...plan, features: plan.features.filter((_, j) => j !== featureIdx) };
    });
    onChange({ ...value, plans: newPlans });
  };

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <Input
          value={value.title || ""}
          onChange={e => onChange({ ...value, title: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Subtitle</label>
        <Input
          value={value.subtitle || ""}
          onChange={e => onChange({ ...value, subtitle: e.target.value })}
        />
      </div>
      <div className="space-y-6">
        {plans.map((plan, idx) => (
          <div key={idx} className="border rounded-lg p-4 relative bg-muted/30">
            <button
              className="absolute top-2 right-2 text-xs text-red-500"
              onClick={() => removePlan(idx)}
              type="button"
            >
              Remove
            </button>
            <div className="flex gap-2 mb-2">
              <Input
                className="flex-1"
                value={plan.name}
                onChange={e => handlePlanChange(idx, { name: e.target.value })}
                placeholder="Plan Name"
              />
              <Input
                className="w-24"
                value={plan.price}
                onChange={e => handlePlanChange(idx, { price: e.target.value })}
                placeholder="$0"
              />
              <Input
                className="w-20"
                value={plan.period || ""}
                onChange={e => handlePlanChange(idx, { period: e.target.value })}
                placeholder="/month"
              />
            </div>
            <Input
              className="mb-2"
              value={plan.description || ""}
              onChange={e => handlePlanChange(idx, { description: e.target.value })}
              placeholder="Description"
            />
            <Input
              className="mb-2"
              value={plan.ctaText || ""}
              onChange={e => handlePlanChange(idx, { ctaText: e.target.value })}
              placeholder="CTA Text"
            />
            <div className="flex items-center gap-2 mb-2">
              <Switch
                checked={!!plan.popular}
                onCheckedChange={checked => handlePlanChange(idx, { popular: checked })}
                id={`popular-${idx}`}
              />
              <label htmlFor={`popular-${idx}`}>Most Popular</label>
            </div>
            <div>
              <div className="font-semibold mb-1">Features</div>
              {plan.features.map((feature, fIdx) => (
                <div key={fIdx} className="flex gap-2 mb-1 items-center">
                  <Input
                    className="flex-1"
                    value={feature.text}
                    onChange={e => handleFeatureChange(idx, fIdx, { text: e.target.value })}
                    placeholder="Feature text"
                  />
                  <Switch
                    checked={feature.included}
                    onCheckedChange={checked => handleFeatureChange(idx, fIdx, { included: checked })}
                  />
                  <span>Included</span>
                  <button
                    className="text-xs text-red-500"
                    onClick={() => removeFeature(idx, fIdx)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => addFeature(idx)}
                type="button"
              >
                Add Feature
              </Button>
            </div>
          </div>
        ))}
        <Button variant="default" onClick={addPlan} type="button">
          Add Plan
        </Button>
      </div>
    </div>
  );
};

export default PricingBlockEditor;
