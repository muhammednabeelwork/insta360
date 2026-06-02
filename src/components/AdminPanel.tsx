import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { db, uploadFile, auth } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ImagePlus, Trash2, Eye, EyeOff, Loader2, ExternalLink } from 'lucide-react';
import { EventImage } from '@/types';

export default function AdminPanel() {
  const [images, setImages] = useState<EventImage[]>([]);
  const [groupName, setGroupName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'images'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const imgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventImage));
      setImages(imgs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !groupName) {
      toast.error('Please provide both an image and a unique group name');
      return;
    }

    setIsUploading(true);
    try {
      const uid = auth?.currentUser?.uid || 'admin';
      const uploadedUrl = await uploadFile(selectedFile, uid, 'event-images');

      await addDoc(collection(db, 'images'), {
        url: uploadedUrl,
        groupName: groupName.trim(),
        timestamp: Date.now(),
        isVisible: true
      });
      
      setSelectedFile(null);
      setPreviewUrl('');
      setGroupName('');
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleVisibility = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'images', id), { isVisible: !current });
      toast.success(`Image ${!current ? 'visible' : 'hidden'}`);
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  const deleteImage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await deleteDoc(doc(db, 'images', id));
      toast.success('Image deleted');
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8">
      <header className="flex items-center justify-between border-b pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Controller</h1>
          <p className="text-muted-foreground">Real-time event content management</p>
        </div>
        <div className="flex gap-2">
          <Link to="/display" target="_blank">
            <Button variant="outline" className="gap-2">
              Display Screen <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/certificate" target="_blank">
            <Button variant="outline" className="gap-2">
              User Portal <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImagePlus className="w-5 h-5" />
            Upload New Content
          </CardTitle>
          <CardDescription>Select an image and assign a unique group name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  placeholder="e.g. Group A, Stage 1"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-file">Image File</Label>
                <Input
                  id="image-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </div>
            </div>

            {previewUrl && (
              <div className="mt-4 relative aspect-video rounded-lg overflow-hidden border">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isUploading || !selectedFile}>
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Content
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Library</CardTitle>
          <CardDescription>Manage visibility and deletion of uploaded images.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 gap-4">
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
              ) : images.length === 0 ? (
                <p className="text-center text-muted-foreground p-8">No images uploaded yet.</p>
              ) : (
                images.map((img) => (
                  <div key={img.id} className="flex items-center gap-4 p-3 border rounded-lg hover:shadow-sm transition-shadow">
                    <img src={img.url} className="w-20 h-14 object-cover rounded" alt={img.groupName} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{img.groupName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(img.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 mr-4">
                        {img.isVisible ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                        <Switch
                          checked={img.isVisible}
                          onCheckedChange={() => toggleVisibility(img.id, img.isVisible)}
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteImage(img.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
