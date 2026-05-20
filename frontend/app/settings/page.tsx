"use client";

import { AppShell } from "../../components/layout/AppShell";
import { useChatStore } from "../../lib/store";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";

export default function SettingsPage() {
  const { settings, updateSettings } = useChatStore();

  return (
    <AppShell title="Settings">
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-6 space-y-1">
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            These settings apply to all GigaChat consultations.
          </p>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>System prompt</Label>
            <Textarea
              value={settings.systemPrompt}
              onChange={(event) =>
                updateSettings({ systemPrompt: event.target.value })
              }
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Temperature</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.temperature}
                onChange={(event) =>
                  updateSettings({ temperature: Number(event.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Max tokens</Label>
              <Input
                type="number"
                value={settings.maxTokens}
                onChange={(event) =>
                  updateSettings({ maxTokens: Number(event.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Top P</Label>
              <Input
                type="number"
                step="0.05"
                value={settings.topP}
                onChange={(event) =>
                  updateSettings({ topP: Number(event.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Context length</Label>
              <Input
                type="number"
                value={settings.contextLength}
                onChange={(event) =>
                  updateSettings({ contextLength: Number(event.target.value) })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
