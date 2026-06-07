import { useState } from "react";
import { useLocation } from "wouter";
import { setGasUrl, pingGas, GAS_SCRIPT, getGasUrl } from "@/lib/gasApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, Loader2, ExternalLink, Copy, ChevronDown, ChevronUp,
  Database, Wifi, Shield, Smartphone, GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    num: 1,
    title: "Create a Google Sheet",
    desc: "Go to sheets.google.com and create a new blank spreadsheet. Name it anything you like, such as \"Fee Tracker Data\".",
    link: { label: "Open Google Sheets", url: "https://sheets.google.com" },
  },
  {
    num: 2,
    title: "Open Apps Script",
    desc: "In your spreadsheet, click Extensions → Apps Script. A new browser tab will open with the script editor.",
  },
  {
    num: 3,
    title: "Paste the script",
    desc: "Delete all existing code in the editor, then paste the script below.",
  },
  {
    num: 4,
    title: "Save and Deploy",
    desc: "Click the floppy disk icon (Save), then click Deploy → New deployment. Set Type to \"Web app\", set \"Execute as\" to Me, set \"Who has access\" to Anyone. Click Deploy and authorize when asked.",
  },
  {
    num: 5,
    title: "Copy the Web App URL",
    desc: "After deploying, Google will show you a Web App URL starting with https://script.google.com/... Copy that URL and paste it below.",
  },
];

export default function Setup() {
  const [url, setUrl] = useState(getGasUrl() ?? "");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "fail" | null>(null);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleTest = async () => {
    if (!url.trim()) {
      toast({ title: "Please enter a URL first", variant: "destructive" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    // temporarily set the URL so gasApi can use it
    const prev = getGasUrl();
    setGasUrl(url.trim());
    const ok = await pingGas();
    if (!ok && prev !== url.trim()) {
      // restore previous if test failed
      if (prev) setGasUrl(prev);
      else localStorage.removeItem("cft_gas_url");
    }
    setTesting(false);
    setTestResult(ok ? "success" : "fail");
    if (!ok) {
      toast({
        title: "Connection failed",
        description: "Check the URL and make sure the deployment access is set to 'Anyone'.",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    if (!url.trim()) {
      toast({ title: "Please enter a URL first", variant: "destructive" });
      return;
    }
    setGasUrl(url.trim());
    toast({ title: "Setup complete! Redirecting to login…" });
    setTimeout(() => setLocation("/login"), 800);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GAS_SCRIPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const features = [
    { icon: Database, label: "Data stays in your Google Sheet" },
    { icon: Smartphone, label: "Works on any device, anywhere" },
    { icon: Shield, label: "Safe if you clear your browser" },
    { icon: Wifi, label: "Offline support with auto-sync" },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-4 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-sm leading-none">Coaching Fee Tracker</h1>
          <p className="text-xs text-muted-foreground mt-0.5">First-time setup</p>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 sm:py-10 space-y-6">
        {/* Intro */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Connect Google Sheets</h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Your student and fee data will be stored safely in Google Sheets — your personal database that you own and control.
          </p>
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-2 gap-2">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 p-3 rounded-lg bg-card border text-sm">
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Step-by-step */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Setup Steps</CardTitle>
            <CardDescription>Follow these steps — it takes about 3 minutes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {STEPS.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                  {step.link && (
                    <a
                      href={step.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                    >
                      {step.link.label} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {step.num === 3 && (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5 h-7"
                        onClick={() => setScriptOpen(v => !v)}
                        type="button"
                      >
                        {scriptOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {scriptOpen ? "Hide" : "Show"} Apps Script code
                      </Button>
                      {scriptOpen && (
                        <div className="mt-2 relative">
                          <pre className="bg-muted rounded-lg p-3 text-[10px] sm:text-xs overflow-x-auto leading-relaxed max-h-48 overflow-y-auto font-mono">
                            {GAS_SCRIPT}
                          </pre>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute top-2 right-2 h-6 text-xs gap-1"
                            onClick={handleCopyScript}
                            type="button"
                          >
                            {copied ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            {copied ? "Copied!" : "Copy"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* URL input */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Paste your Web App URL</CardTitle>
            <CardDescription>
              The URL looks like: <span className="font-mono text-xs">https://script.google.com/macros/s/…/exec</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="https://script.google.com/macros/s/…/exec"
              value={url}
              onChange={e => { setUrl(e.target.value); setTestResult(null); }}
              className={cn(
                "text-sm font-mono",
                testResult === "success" && "border-green-400 focus-visible:ring-green-400",
                testResult === "fail" && "border-red-400 focus-visible:ring-red-400"
              )}
              data-testid="input-gas-url"
            />

            {testResult && (
              <div className={cn(
                "flex items-center gap-2 text-sm p-2.5 rounded-lg",
                testResult === "success"
                  ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
              )}>
                {testResult === "success"
                  ? <><CheckCircle2 className="w-4 h-4 shrink-0" /> Connection successful! Your data is ready.</>
                  : <><span className="shrink-0">✕</span> Connection failed. Check the URL and deployment settings.</>
                }
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testing || !url.trim()}
                className="flex-1 gap-2"
                type="button"
                data-testid="button-test-connection"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                {testing ? "Testing…" : "Test Connection"}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!url.trim()}
                className="flex-1 gap-2"
                type="button"
                data-testid="button-save-setup"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save &amp; Continue
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Tip: Click "Test Connection" first to verify before saving.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
