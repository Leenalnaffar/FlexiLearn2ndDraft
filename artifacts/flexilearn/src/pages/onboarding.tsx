import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateLearnerProfile, getGetCurrentLearnerProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useFlexiLearnStore } from "@/store";
import { GraduationCap, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const LEARNING_STYLES = [
  { value: "visual",         label: "Visual",          description: "You learn best through diagrams, charts, and spatial understanding" },
  { value: "auditory",       label: "Auditory",        description: "You absorb information through listening, discussion, and verbal instruction" },
  { value: "kinesthetic",    label: "Kinesthetic",     description: "Hands-on experience and physical engagement help you learn best" },
  { value: "reading_writing",label: "Reading / Writing", description: "Written text, note-taking, and reading are your strongest modalities" },
] as const;

const NEURO_PROFILES = [
  { value: "none",      label: "Standard",  description: "No specific neurodivergent profile" },
  { value: "adhd",      label: "ADHD",      description: "Attention deficit / hyperactivity — short bursts, frequent breaks" },
  { value: "dyslexia",  label: "Dyslexia",  description: "Reading support with dyslexic-friendly fonts and formatting" },
  { value: "autism",    label: "Autism",    description: "Structured routines, explicit instructions, minimal ambiguity" },
] as const;

const step1Schema = z.object({
  learningStyle: z.enum(["visual", "auditory", "kinesthetic", "reading_writing"]),
});

const step2Schema = z.object({
  neurodivergentProfile: z.enum(["none", "adhd", "dyslexia", "autism"]),
});

const step3Schema = z.object({
  displayName: z.string().min(2, "Please enter at least 2 characters"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

const steps = ["Learning Style", "Your Profile", "Your Name"];

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { setProfile } = useFlexiLearnStore();
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);

  const prefilledName = new URLSearchParams(window.location.search).get("name") ?? "";

  const createProfile = useCreateLearnerProfile();

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { learningStyle: undefined },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { neurodivergentProfile: undefined },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { displayName: prefilledName },
  });

  const handleStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
  };

  const handleStep2Submit = (data: Step2Data) => {
    setStep2Data(data);
    setStep(3);
  };

  const handleStep3Submit = async (data: Step3Data) => {
    if (!step1Data || !step2Data) return;
    createProfile.mutate(
      {
        data: {
          learningStyle: step1Data.learningStyle,
          neurodivergentProfile: step2Data.neurodivergentProfile,
          displayName: data.displayName,
        },
      },
      {
        onSuccess: () => {
          setProfile({
            displayName: data.displayName,
            learningStyle: step1Data.learningStyle,
            neuroProfile: step2Data.neurodivergentProfile,
          });
          queryClient.invalidateQueries({ queryKey: getGetCurrentLearnerProfileQueryKey() });
          setLocation("/workspace");
        },
      }
    );
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "#F7FAFC" }}
      data-testid="onboarding-page"
    >
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#3B5BDB" }}
          >
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">FlexiLearn</h1>
            <p className="text-xs text-muted-foreground">Adaptive Educational Platform</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-10" data-testid="step-indicator">
          {steps.map((label, idx) => {
            const num = idx + 1;
            const isDone = step > num;
            const isCurrent = step === num;
            return (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                      isDone
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "text-white"
                        : "bg-gray-200 text-gray-500"
                    )}
                    style={isCurrent ? { backgroundColor: "#3B5BDB" } : undefined}
                    data-testid={`step-indicator-${num}`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : num}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium whitespace-nowrap",
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className="h-px w-16 mb-5 mx-2 transition-colors duration-300"
                    style={{ backgroundColor: step > num ? "#22c55e" : "#e2e8f0" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-border shadow-md overflow-hidden">

          {/* Step 1 — Learning Style */}
          {step === 1 && (
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} data-testid="step1-form">
                <div className="px-8 pt-8 pb-6">
                  <h2 className="text-xl font-bold text-foreground mb-1">How do you learn best?</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    This helps FlexiLearn tailor content format and presentation to match your natural strengths.
                  </p>
                  <FormField
                    control={step1Form.control}
                    name="learningStyle"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2.5">
                          {LEARNING_STYLES.map((style) => (
                            <FormControl key={style.value}>
                              <button
                                type="button"
                                data-testid={`learning-style-${style.value}`}
                                onClick={() => field.onChange(style.value)}
                                className={cn(
                                  "w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-150",
                                  field.value === style.value
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-border hover:border-blue-200 hover:bg-gray-50"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{style.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{style.description}</p>
                                  </div>
                                  {field.value === style.value && (
                                    <div
                                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                      style={{ backgroundColor: "#3B5BDB" }}
                                    >
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                              </button>
                            </FormControl>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="px-8 pb-8">
                  <Button
                    type="submit"
                    className="w-full h-11 text-sm font-semibold"
                    style={{ backgroundColor: "#3B5BDB" }}
                    data-testid="button-next-step1"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Step 2 — Neurodivergent Profile (4 options only) */}
          {step === 2 && (
            <Form {...step2Form}>
              <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} data-testid="step2-form">
                <div className="px-8 pt-8 pb-6">
                  <h2 className="text-xl font-bold text-foreground mb-1">Your cognitive profile</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    FlexiLearn adapts content pacing, format, and structure to support the way your brain works.
                  </p>
                  <FormField
                    control={step2Form.control}
                    name="neurodivergentProfile"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-2 gap-3">
                          {NEURO_PROFILES.map((profile) => (
                            <FormControl key={profile.value}>
                              <button
                                type="button"
                                data-testid={`neuro-profile-${profile.value}`}
                                onClick={() => field.onChange(profile.value)}
                                className={cn(
                                  "text-left px-4 py-4 rounded-xl border-2 transition-all duration-150",
                                  field.value === profile.value
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-border hover:border-blue-200 hover:bg-gray-50"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground">{profile.label}</p>
                                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{profile.description}</p>
                                  </div>
                                  {field.value === profile.value && (
                                    <div
                                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                      style={{ backgroundColor: "#3B5BDB" }}
                                    >
                                      <Check className="w-2.5 h-2.5 text-white" />
                                    </div>
                                  )}
                                </div>
                              </button>
                            </FormControl>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="px-8 pb-8 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11 text-sm"
                    onClick={() => setStep(1)}
                    data-testid="button-back-step2"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 text-sm font-semibold"
                    style={{ backgroundColor: "#3B5BDB" }}
                    data-testid="button-next-step2"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Step 3 — Name */}
          {step === 3 && (
            <Form {...step3Form}>
              <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} data-testid="step3-form">
                <div className="px-8 pt-8 pb-6">
                  <h2 className="text-xl font-bold text-foreground mb-1">What should we call you?</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Your display name appears throughout your learning journey.
                  </p>
                  <FormField
                    control={step3Form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Display name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Alex, Jordan, Dr. Kim..."
                            className="h-11 text-sm"
                            data-testid="input-display-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="px-8 pb-8 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11 text-sm"
                    onClick={() => setStep(2)}
                    data-testid="button-back-step3"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={createProfile.isPending}
                    className="flex-1 h-11 text-sm font-semibold"
                    style={{ backgroundColor: "#3B5BDB" }}
                    data-testid="button-submit-onboarding"
                  >
                    {createProfile.isPending ? "Setting up..." : "Start Learning"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Your profile can be updated anytime from Accessibility Settings
        </p>
      </div>
    </div>
  );
}
