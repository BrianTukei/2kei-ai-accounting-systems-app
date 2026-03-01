/**
 * DevAdminAnnouncementForm.tsx
 * ════════════════════════════
 * Form for creating and editing system announcements
 * Features:
 *   - Create new announcements
 *   - Set priority and type
 *   - Target specific audiences
 *   - Schedule start/end dates
 *   - Preview announcement
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Megaphone,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Calendar,
  Users,
  Link,
  Eye,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────
// Form Schema
// ─────────────────────────────────────────

const announcementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  content: z.string().min(10, 'Content must be at least 10 characters').max(1000, 'Content too long'),
  type: z.enum(['info', 'warning', 'success', 'error']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  target_audience: z.string().default('all'),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  is_active: z.boolean().default(true),
  is_dismissible: z.boolean().default(true),
  action_url: z.string().url().optional().or(z.literal('')),
  action_label: z.string().optional(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────

interface DevAdminAnnouncementFormProps {
  onSubmit: (data: AnnouncementFormValues) => void;
  isSubmitting?: boolean;
  initialData?: Partial<AnnouncementFormValues>;
  mode?: 'create' | 'edit';
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export function DevAdminAnnouncementForm({
  onSubmit,
  isSubmitting = false,
  initialData,
  mode = 'create',
}: DevAdminAnnouncementFormProps) {
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'info',
      priority: 'medium',
      target_audience: 'all',
      is_active: true,
      is_dismissible: true,
      action_url: '',
      action_label: '',
      ...initialData,
    },
  });

  const watchedValues = form.watch();

  const TYPE_CONFIG = {
    info: { icon: Info, color: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
    warning: { icon: AlertTriangle, color: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
    success: { icon: CheckCircle2, color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
    error: { icon: XCircle, color: 'bg-red-500/10 border-red-500/30 text-red-400' },
  };

  const PRIORITY_COLORS = {
    low: 'bg-slate-500/20 text-slate-400',
    medium: 'bg-blue-500/20 text-blue-400',
    high: 'bg-amber-500/20 text-amber-400',
    critical: 'bg-red-500/20 text-red-400',
  };

  const handleSubmit = (data: AnnouncementFormValues) => {
    onSubmit(data);
  };

  const TypeIcon = TYPE_CONFIG[watchedValues.type]?.icon || Info;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-red-500 hover:bg-red-600">
          <Megaphone className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-red-400" />
            {mode === 'create' ? 'Create Announcement' : 'Edit Announcement'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Send notifications to users across the platform
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="compose" className="mt-4">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="compose" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
              Compose
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Announcement title..."
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {/* Content */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your announcement message..."
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-slate-500">
                        Supports plain text. {1000 - (field.value?.length || 0)} characters remaining.
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {/* Type and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-300">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="info">
                              <span className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-400" /> Info
                              </span>
                            </SelectItem>
                            <SelectItem value="success">
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Success
                              </span>
                            </SelectItem>
                            <SelectItem value="warning">
                              <span className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400" /> Warning
                              </span>
                            </SelectItem>
                            <SelectItem value="error">
                              <span className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-400" /> Error
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-300">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Target Audience */}
                <FormField
                  control={form.control}
                  name="target_audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Target Audience</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-300">
                            <SelectValue placeholder="Select audience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="admins">Admins Only</SelectItem>
                          <SelectItem value="users">Regular Users</SelectItem>
                          <SelectItem value="plan:free">Free Plan Users</SelectItem>
                          <SelectItem value="plan:pro">Pro Plan Users</SelectItem>
                          <SelectItem value="plan:enterprise">Enterprise Users</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-slate-500">
                        Who should see this announcement
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="starts_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            className="bg-slate-800/50 border-slate-700 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ends_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            className="bg-slate-800/50 border-slate-700 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Action URL */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="action_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Action URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://..."
                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="action_label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Action Label</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Learn More"
                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-slate-200 !mt-0">Active</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_dismissible"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-slate-200 !mt-0">Dismissible</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="mt-6 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700 text-slate-300"
                    onClick={() => form.reset()}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {isSubmitting ? (
                      'Publishing...'
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {mode === 'create' ? 'Publish Announcement' : 'Update Announcement'}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <Card className="bg-slate-800/30 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200 text-sm">Preview</CardTitle>
                <CardDescription className="text-slate-400">
                  This is how the announcement will appear to users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Preview Card */}
                <div
                  className={cn(
                    'p-4 rounded-lg border',
                    TYPE_CONFIG[watchedValues.type]?.color || TYPE_CONFIG.info.color
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="w-5 h-5" />
                      <h3 className="font-medium text-white">
                        {watchedValues.title || 'Announcement Title'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={PRIORITY_COLORS[watchedValues.priority] || PRIORITY_COLORS.medium}>
                        {watchedValues.priority || 'medium'}
                      </Badge>
                      {watchedValues.is_active && (
                        <Badge className="bg-emerald-500/20 text-emerald-400">Active</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mt-2">
                    {watchedValues.content || 'Announcement content will appear here...'}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    {watchedValues.action_url && watchedValues.action_label && (
                      <Button size="sm" variant="outline" className="border-current text-current hover:bg-white/10">
                        <Link className="w-3 h-3 mr-1" />
                        {watchedValues.action_label}
                      </Button>
                    )}
                    {watchedValues.is_dismissible && (
                      <span className="text-xs text-slate-400">× Dismissible</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {watchedValues.target_audience || 'all'}
                    </span>
                    {watchedValues.starts_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Starts: {new Date(watchedValues.starts_at).toLocaleDateString()}
                      </span>
                    )}
                    {watchedValues.ends_at && (
                      <span>
                        Ends: {new Date(watchedValues.ends_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default DevAdminAnnouncementForm;
