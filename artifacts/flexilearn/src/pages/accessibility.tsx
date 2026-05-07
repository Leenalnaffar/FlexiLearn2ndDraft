import { useState, useEffect } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

interface AccessibilityPrefs {
  fontSize: number;
  lineSpacing: number;
  highContrast: boolean;
  reduceMotion: boolean;
  dyslexicFont: boolean;
  focusMode: boolean;
  breakReminders: boolean;
  theme: string;
}

const DEFAULT_PREFS: AccessibilityPrefs = {
  fontSize: 16,
  lineSpacing: 1.6,
  highContrast: false,
  reduceMotion: false,
  dyslexicFont: false,
  focusMode: false,
  breakReminders: true,
  theme: "light",
};

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onCheckedChange,
  testId,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  testId: string;
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-border last:border-0">
      <div className="flex-1 pr-4">
        <Label className="text-sm font-medium text-foreground cursor-pointer">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        data-testid={testId}
      />
    </div>
  );
}

export default function AccessibilityPage() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    const stored = localStorage.getItem("flexilearn-accessibility");
    if (stored) {
      try {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
      } catch {}
    }
  }, []);

  const updatePref = <K extends keyof AccessibilityPrefs>(key: K, value: AccessibilityPrefs[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem("flexilearn-accessibility", JSON.stringify(prefs));
    toast({
      title: "Preferences saved",
      description: "Your accessibility settings have been updated.",
    });
  };

  const handleReset = () => {
    setPrefs(DEFAULT_PREFS);
    localStorage.removeItem("flexilearn-accessibility");
    toast({ title: "Reset to defaults", description: "Accessibility settings have been reset." });
  };

  return (
    <DashboardLayout title="Accessibility Settings">
      <div className="max-w-2xl space-y-6" data-testid="accessibility-page">
        <div>
          <p className="text-sm text-muted-foreground">
            Customize how FlexiLearn presents content to match your sensory and cognitive preferences.
          </p>
        </div>

        {/* Text & Display */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <SectionHeader
            title="Text and Display"
            description="Adjust how content is rendered for comfortable reading."
          />

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-foreground">Font Size</Label>
                <span className="text-sm font-bold text-foreground">{prefs.fontSize}px</span>
              </div>
              <Slider
                min={12}
                max={24}
                step={1}
                value={[prefs.fontSize]}
                onValueChange={([v]) => updatePref("fontSize", v)}
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
                <span className="text-sm font-bold text-foreground">{prefs.lineSpacing.toFixed(1)}x</span>
              </div>
              <Slider
                min={1.2}
                max={2.4}
                step={0.1}
                value={[prefs.lineSpacing]}
                onValueChange={([v]) => updatePref("lineSpacing", Number(v.toFixed(1)))}
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
              <Select value={prefs.theme} onValueChange={(v) => updatePref("theme", v)}>
                <SelectTrigger className="mt-2 h-9 text-sm" data-testid="select-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="high-contrast">High Contrast</SelectItem>
                  <SelectItem value="sepia">Sepia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Cognitive Support */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <SectionHeader
            title="Cognitive Support"
            description="Settings designed to support focus, working memory, and attention regulation."
          />

          <div>
            <ToggleSetting
              label="Focus Mode"
              description="Reduces visual noise and removes non-essential interface elements during lessons."
              checked={prefs.focusMode}
              onCheckedChange={(v) => updatePref("focusMode", v)}
              testId="toggle-focus-mode"
            />
            <ToggleSetting
              label="Break Reminders"
              description="Prompts you to take short breaks every 25 minutes using the Pomodoro technique."
              checked={prefs.breakReminders}
              onCheckedChange={(v) => updatePref("breakReminders", v)}
              testId="toggle-break-reminders"
            />
            <ToggleSetting
              label="Dyslexic-Friendly Font"
              description="Uses OpenDyslexic font to improve readability for dyslexic learners."
              checked={prefs.dyslexicFont}
              onCheckedChange={(v) => updatePref("dyslexicFont", v)}
              testId="toggle-dyslexic-font"
            />
          </div>
        </div>

        {/* Motion & Sensory */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <SectionHeader
            title="Motion and Sensory"
            description="Adjust animations and visual feedback to reduce sensory overload."
          />

          <div>
            <ToggleSetting
              label="Reduce Motion"
              description="Minimizes animations, transitions, and pulsing elements throughout the interface."
              checked={prefs.reduceMotion}
              onCheckedChange={(v) => updatePref("reduceMotion", v)}
              testId="toggle-reduce-motion"
            />
            <ToggleSetting
              label="High Contrast Mode"
              description="Increases color contrast ratios to meet WCAG AAA standards."
              checked={prefs.highContrast}
              onCheckedChange={(v) => updatePref("highContrast", v)}
              testId="toggle-high-contrast"
            />
          </div>
        </div>

        {/* Save / Reset */}
        <div className="flex items-center gap-3 pb-2">
          <Button
            onClick={handleSave}
            className="h-10 px-6 text-sm font-semibold"
            style={{ backgroundColor: "#3B5BDB" }}
            data-testid="button-save-accessibility"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Save Preferences
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="h-10 px-6 text-sm"
            data-testid="button-reset-accessibility"
          >
            Reset to defaults
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
