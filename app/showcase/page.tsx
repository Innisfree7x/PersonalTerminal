'use client';

import { useState } from 'react';
import { 
  Button, 
  IconButton,
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter,
  Checkbox,
  Badge,
  StatusBadge,
  PriorityBadge,
  Input,
  Textarea
} from '@/components/ui';
import { Plus, Search, Heart, Trash2, Settings } from 'lucide-react';

export default function ShowcasePage() {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLoadingButton = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-text-primary">
            UI Component Showcase
          </h1>
          <p className="text-lg text-text-secondary">
            Linear-inspired component library for Bloomberg Personal
          </p>
        </div>

        {/* Buttons */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">Buttons</h2>
            <p className="text-sm text-text-secondary">Interactive buttons with variants and states</p>
          </div>
          
          <Card padding="lg">
            <div className="space-y-6">
              {/* Variants */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-secondary">Variants</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary Button</Button>
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="danger">Danger Button</Button>
                </div>
              </div>

              {/* Sizes */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-secondary">Sizes</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>

              {/* With Icons */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-secondary">With Icons</h3>
                <div className="flex flex-wrap gap-3">
                  <Button leftIcon={<Plus className="w-4 h-4" />}>
                    Add New
                  </Button>
                  <Button variant="secondary" leftIcon={<Search className="w-4 h-4" />}>
                    Search
                  </Button>
                  <Button variant="ghost" rightIcon={<Settings className="w-4 h-4" />}>
                    Settings
                  </Button>
                </div>
              </div>

              {/* States */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-secondary">States</h3>
                <div className="flex flex-wrap gap-3">
                  <Button loading={loading} onClick={handleLoadingButton}>
                    {loading ? 'Loading...' : 'Click to Load'}
                  </Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>

              {/* Icon Buttons */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-secondary">Icon Buttons</h3>
                <div className="flex flex-wrap gap-3">
                  <IconButton icon={<Heart className="w-4 h-4" />} aria-label="Like" />
                  <IconButton icon={<Trash2 className="w-4 h-4" />} variant="danger" aria-label="Delete" />
                  <IconButton icon={<Settings className="w-4 h-4" />} variant="secondary" aria-label="Settings" />
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">Cards</h2>
            <p className="text-sm text-text-secondary">Flexible card components with hover effects</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card hoverable>
              <CardHeader>
                <CardTitle>Hoverable Card</CardTitle>
                <CardDescription>Hover over me to see the effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  This card has a hover effect with a glow and slight lift.
                </p>
              </CardContent>
            </Card>

            <Card clickable>
              <CardHeader>
                <CardTitle>Clickable Card</CardTitle>
                <CardDescription>Click me for interaction</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  This card is interactive and responds to clicks.
                </p>
              </CardContent>
              <CardFooter>
                <Badge variant="primary">Interactive</Badge>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>With shadow elevation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  This card has a subtle shadow for depth.
                </p>
              </CardContent>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Bordered Card</CardTitle>
                <CardDescription>With thicker border</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  This card has a more prominent border.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Checkboxes */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">Checkboxes</h2>
            <p className="text-sm text-text-secondary">Animated checkboxes with smooth transitions</p>
          </div>

          <Card padding="lg">
            <div className="space-y-4">
              <Checkbox 
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                label="Animated Checkbox"
                description="Click to see the smooth check animation"
              />
              <Checkbox 
                checked={true}
                label="Checked Checkbox"
              />
              <Checkbox 
                checked={false}
                disabled
                label="Disabled Checkbox"
                description="This checkbox is disabled"
              />
            </div>
          </Card>
        </section>

        {/* Badges */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">Badges</h2>
            <p className="text-sm text-text-secondary">Status indicators and labels</p>
          </div>

          <Card padding="lg">
            <div className="space-y-6">
              {/* Status Badges */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-secondary">Status Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="info">Info</Badge>
                </div>
              </div>

              {/* With Dot */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-secondary">With Indicator Dot</h3>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status="active" />
                  <StatusBadge status="completed" />
                  <StatusBadge status="pending" />
                  <StatusBadge status="cancelled" />
                </div>
              </div>

              {/* Priority Badges */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-secondary">Priority Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <PriorityBadge priority="low" />
                  <PriorityBadge priority="medium" />
                  <PriorityBadge priority="high" />
                </div>
              </div>

              {/* Feature Badges */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-secondary">Feature Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="goals">Goals</Badge>
                  <Badge variant="career">Career</Badge>
                  <Badge variant="university">University</Badge>
                  <Badge variant="calendar">Calendar</Badge>
                </div>
              </div>

              {/* Sizes */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-secondary">Sizes</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge size="sm">Small</Badge>
                  <Badge size="md">Medium</Badge>
                  <Badge size="lg">Large</Badge>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Inputs */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">Inputs</h2>
            <p className="text-sm text-text-secondary">Form inputs with validation</p>
          </div>

          <Card padding="lg">
            <div className="space-y-6">
              <Input 
                label="Text Input"
                placeholder="Enter some text..."
                description="This is a helper text"
              />

              <Input 
                label="With Left Icon"
                placeholder="Search..."
                leftIcon={<Search className="w-4 h-4" />}
              />

              <Input 
                label="With Error"
                placeholder="Invalid input"
                error="This field is required"
              />

              <Input 
                label="Disabled Input"
                placeholder="Disabled"
                disabled
              />

              <Textarea 
                label="Textarea"
                placeholder="Enter a longer text..."
                description="This is a textarea for multi-line input"
                rows={4}
              />
            </div>
          </Card>
        </section>

        {/* Color Palette */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">Color Palette</h2>
            <p className="text-sm text-text-secondary">Design system colors</p>
          </div>

          <Card padding="lg">
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-secondary">Primary Purple</h3>
                <div className="flex gap-2">
                  <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-xs text-white font-mono">500</span>
                  </div>
                  <div className="w-16 h-16 rounded-lg bg-primary-hover flex items-center justify-center">
                    <span className="text-xs text-white font-mono">600</span>
                  </div>
                  <div className="w-16 h-16 rounded-lg bg-primary-light flex items-center justify-center">
                    <span className="text-xs text-white font-mono">400</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-secondary">Status Colors</h3>
                <div className="flex gap-2">
                  <div className="w-16 h-16 rounded-lg bg-success flex items-center justify-center">
                    <span className="text-xs text-white font-mono">✓</span>
                  </div>
                  <div className="w-16 h-16 rounded-lg bg-warning flex items-center justify-center">
                    <span className="text-xs text-white font-mono">!</span>
                  </div>
                  <div className="w-16 h-16 rounded-lg bg-error flex items-center justify-center">
                    <span className="text-xs text-white font-mono">×</span>
                  </div>
                  <div className="w-16 h-16 rounded-lg bg-info flex items-center justify-center">
                    <span className="text-xs text-white font-mono">i</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}