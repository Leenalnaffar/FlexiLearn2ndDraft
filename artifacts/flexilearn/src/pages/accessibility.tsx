import DashboardLayout from "@/layouts/dashboard-layout";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";
import { useFlexiLearnStore, type AccessibilitySettings } from "@/store";

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  );
}

function ToggleSetting({
  label, description, checked, onCheckedChange, testId,
}: {
  label: string; description: string; checked: boolean;
  onCheckedChange: (v: boolean) => void; testId: string;
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-border last:border-0">
      <div className="flex-1 pr-4">
        <Label className="text-sm font-medium text-foreground cursor-pointer">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} data-testid={testId} />
    </div>
  );
}

const DEFAULTS: AccessibilitySettings = {
  fontSize: 16,
  lineSpacing: 1.6,
  highContrast: false,
  reduceMotion: false,
  dyslexicFont: false,
  focusMode: false,
  theme: "default",
};

export default function AccessibilityPage() {
  const { toast } = useToast();
  const accessibility = useFlexiLearnStore((s) => s.accessibility);
  const setAccessibility = useFlexiLearnStore((s) => s.setAccessibility);

  const update = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    setAccessibility({ [key]: value });
  };

  const handleReset = () => {
    setAccessibility(DEFAULTS);
    toast({ title: "Reset to defaults", description: "Accessibility settings have been reset." });
  };

  return (
    <DashboardLayout title="Accessibility Settings">
      <div className="max-w-2xl space-y-6" data-testid="accessibility-page">
        <div>
          <h2 className="text-xl font-bold text-foreground">Accessibility Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Changes apply instantly to the entire platform — no save needed.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6">
          <SectionHeader title="Text and Display" description="Adjust how content is rendered for comfortable reading." />
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-foreground">Font Size</Label>
                <span className="text-sm font-bold text-foreground">{accessibility.fontSize}px</span>
              </div>
              <Slider
                min={12} max={24} step={1}
                value={[accessibility.fontSize]}
                onValueChange={([v]) => update("fontSize", v)}
                data-testid="slider-font-size"
                className="w-full"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">Small</span>
                <span className="text-[10px] text-muted-foreground">Large</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-foreground">Line Spacing</Label>
                <span className="text-sm font-bold text-foreground">{accessibility.lineSpacing.toFixed(1)}x</span>
              </div>
              <Slider
                min={1.2} max={2.4} step={0.1}
                value={[accessibility.lineSpacing]}
                onValueChange={([v]) => update("lineSpacing", Number(v.toFixed(1)))}
                data-testid="slider-line-spacing"
                className="w-full"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">Compact</span>
                <span className="text-[10px] text-muted-foreground">Spacious</span>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-foreground">Color Theme</Label>
              <Select
                value={accessibility.theme}
                onValueChange={(v) => update("theme", v as AccessibilitySettings["theme"])}
              >
                <SelectTrigger className="mt-2 h-9 text-sm" data-testid="select-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="sepia">Sepia (warm tones)</SelectItem>
                  <SelectItem value="high-contrast">High Contrast</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6">
          <SectionHeader title="Cognitive Support" description="Settings designed to support focus, working memory, and attention." />
          <ToggleSetting
            label="Focus Mode"
            description="Reduces visual noise and highlights only the current learning area."
            checked={accessibility.focusMode}
            onCheckedChange={(v) => update("focusMode", v)}
            testId="toggle-focus-mode"
          />
          <ToggleSetting
            label="Dyslexic-Friendly Font"
            description="Uses OpenDyslexic font to improve readability for dyslexic learners."
            checked={accessibility.dyslexicFont}
            onCheckedChange={(v) => update("dyslexicFont", v)}
            testId="toggle-dyslexic-font"
          />
        </div>

        <div className="bg-white rounded-2xl border border-border p-6">
          <SectionHeader title="Motion and Sensory" description="Adjust animations and visual feedback to reduce sensory overload." />
          <ToggleSetting
            label="Reduce Motion"
            description="Minimizes animations, transitions, and pulsing elements throughout."
            checked={accessibility.reduceMotion}
            onCheckedChange={(v) => update("reduceMotion", v)}
            testId="toggle-reduce-motion"
          />
          <ToggleSetting
            label="High Contrast Mode"
            description="Increases color contrast ratios to meet WCAG AAA accessibility standards."
            checked={accessibility.highContrast}
            onCheckedChange={(v) => update("highContrast", v)}
            testId="toggle-high-contrast"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-700 font-medium">
            Settings save automatically and apply instantly across the entire platform.
          </p>
        </div>

        <div className="flex items-center gap-3 pb-2">
          <Button
            onClick={handleReset}
            variant="outline"
            className="h-10 px-6 text-sm"
            data-testid="button-reset-accessibility"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Reset to defaults
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
